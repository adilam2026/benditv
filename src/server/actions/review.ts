"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { audit, trackEvent } from "@/server/services/audit";
import { assessReview, type FraudReviewInput } from "@/server/services/fraud";
import { recomputePlaceRating } from "@/server/services/recompute";
import { isVagueComment, slugify } from "@/lib/text";
import type { FormState } from "./auth";

const submitSchema = z.object({
  placeId: z.string().min(1),
  visitedAt: z.string().min(8, "Indiquez la date de votre visite."),
  context: z.enum(["famille", "couple", "amis", "solo", "travail", "livraison"]),
  groupType: z.string().max(80).optional(),
  need: z.string().max(120).optional(),
  mode: z.enum(["express", "guide", "detaille"]).default("express"),
  comment: z.string().max(3000).optional(),
  positives: z.string().max(1000).optional(),
  cautions: z.string().max(1000).optional(),
  tip: z.string().max(500).optional(),
  visibility: z.enum(["PUBLIC", "NETWORK", "PRIVATE"]).default("PUBLIC"),
  evidence: z.enum(["none", "geoloc", "ticket", "reservation"]).default("none"),
  consent: z.literal("on", { errorMap: () => ({ message: "Vous devez confirmer que cette expérience est personnelle et sincère." }) }),
  answers: z.string(), // JSON { criterionId: value }
});

export async function submitReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`review:${user.id}`, 8, 3600_000).ok) {
    return { error: "Vous avez publié beaucoup d'expériences récemment. Réessayez plus tard." };
  }
  const parsed = submitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const data = parsed.data;

  const visitedAt = new Date(data.visitedAt);
  if (Number.isNaN(visitedAt.getTime()) || visitedAt > new Date()) {
    return { error: "La date de visite doit être passée." };
  }

  const place = await prisma.place.findUnique({
    where: { id: data.placeId },
    include: { category: { include: { criteria: { include: { criterion: { include: { options: true } } } } } } },
  });
  if (!place) return { error: "Lieu introuvable." };

  // Un seul avis actif par lieu et par utilisateur (modifiable)
  const existing = await prisma.review.findFirst({
    where: { placeId: place.id, userId: user.id, status: { in: ["PUBLISHED", "PENDING_MODERATION"] } },
  });

  // Réponses aux critères
  let rawAnswers: Record<string, string>;
  try {
    rawAnswers = JSON.parse(data.answers ?? "{}");
  } catch {
    return { error: "Réponses aux critères illisibles." };
  }
  const validAnswers: { criterionId: string; value: string; score: number | null }[] = [];
  for (const cc of place.category.criteria) {
    const value = rawAnswers[cc.criterion.id];
    if (value === undefined || value === "") {
      if (cc.criterion.required || cc.required) {
        return { error: `Le critère « ${cc.criterion.name} » est requis.` };
      }
      continue;
    }
    let score: number | null = null;
    if (cc.criterion.type === "SCALE") {
      const n = parseFloat(value);
      if (Number.isNaN(n) || n < 0 || n > 10) return { error: `Valeur invalide pour « ${cc.criterion.name} ».` };
      score = n;
    } else if (cc.criterion.type === "SINGLE_CHOICE" || cc.criterion.type === "YES_NO") {
      const opt = cc.criterion.options.find((o) => o.value === value);
      if (!opt) return { error: `Option invalide pour « ${cc.criterion.name} ».` };
      score = opt.score;
    } else if (cc.criterion.type === "AMOUNT") {
      const n = parseInt(value, 10);
      if (Number.isNaN(n) || n < 0 || n > 1_000_000) return { error: `Montant invalide pour « ${cc.criterion.name} ».` };
    }
    validAnswers.push({ criterionId: cc.criterion.id, value, score });
  }
  if (validAnswers.filter((a) => a.score !== null).length === 0) {
    return { error: "Répondez à au moins un critère noté pour publier votre expérience." };
  }

  // Suggestion (non bloquante côté serveur, le client gère l'aide) :
  // un commentaire trop vague est simplement conservé sans pénalité.
  void isVagueComment;

  const avgScore =
    validAnswers.filter((a) => a.score !== null).reduce((s, a) => s + (a.score ?? 0), 0) /
    validAnswers.filter((a) => a.score !== null).length;

  // Niveau de vérification selon la preuve fournie.
  // La géolocalisation est transformée en indicateur puis les détails
  // sont abandonnés : aucune position précise n'est conservée.
  const level =
    data.evidence === "ticket" ? "TRANSACTION_CONFIRMED"
    : data.evidence === "reservation" ? "TRANSACTION_CONFIRMED"
    : data.evidence === "geoloc" ? "VISIT_CONFIRMED"
    : "DECLARED";
  const method =
    data.evidence === "ticket" ? "Achat confirmé"
    : data.evidence === "reservation" ? "Réservation confirmée"
    : data.evidence === "geoloc" ? "Visite confirmée"
    : "Expérience déclarée";

  // Anti-fraude : évaluation de la contribution avant publication
  const siblings = await prisma.review.findMany({
    where: { placeId: place.id, status: { in: ["PUBLISHED", "NEUTRALIZED"] } },
    select: { id: true, userId: true, comment: true, createdAt: true },
  });
  const fraudInput: FraudReviewInput = {
    id: "new",
    userId: user.id,
    score: avgScore,
    text: data.comment ?? null,
    createdAt: new Date(),
    accountAgeDaysAtReview: Math.floor((Date.now() - user.createdAt.getTime()) / 86400_000),
    userTotalReviews: await prisma.review.count({ where: { userId: user.id } }),
    userDistinctPlaces: (await prisma.review.groupBy({ by: ["placeId"], where: { userId: user.id } })).length,
  };
  const assessment = assessReview(
    fraudInput,
    siblings.map((s) => ({ ...fraudInput, id: s.id, userId: s.userId, text: s.comment, createdAt: s.createdAt })),
    []
  );

  const status =
    assessment.decision === "moderate" ? "PENDING_MODERATION"
    : assessment.decision === "neutralize" ? "NEUTRALIZED"
    : "PUBLISHED";

  const review = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.reviewRevision.create({
        data: {
          reviewId: existing.id,
          snapshot: JSON.parse(JSON.stringify({ comment: existing.comment, visitedAt: existing.visitedAt })),
        },
      });
      await tx.reviewCriterionAnswer.deleteMany({ where: { reviewId: existing.id } });
      return tx.review.update({
        where: { id: existing.id },
        data: {
          visitedAt, context: data.context, groupType: data.groupType || null,
          needSlug: data.need ? slugify(data.need) : null,
          comment: data.comment || null, positives: data.positives || null,
          cautions: data.cautions || null, tip: data.tip || null,
          visibility: data.visibility, mode: data.mode, status,
          weight: assessment.weight, riskScore: assessment.riskScore,
          answers: { create: validAnswers },
          verification: {
            upsert: { create: { level, method }, update: { level, method } },
          },
        },
      });
    }
    return tx.review.create({
      data: {
        placeId: place.id, userId: user.id,
        visitedAt, context: data.context, groupType: data.groupType || null,
        needSlug: data.need ? slugify(data.need) : null,
        comment: data.comment || null, positives: data.positives || null,
        cautions: data.cautions || null, tip: data.tip || null,
        visibility: data.visibility, mode: data.mode, status,
        weight: assessment.weight, riskScore: assessment.riskScore,
        answers: { create: validAnswers },
        verification: { create: { level, method } },
        evidences:
          data.evidence !== "none"
            ? { create: [{ kind: data.evidence, status: "accepted", note: method }] }
            : undefined,
      },
    });
  });

  for (const signal of assessment.signals) {
    await prisma.fraudSignal.create({
      data: { kind: signal.kind, severity: signal.severity, detail: signal.detail, reviewId: review.id, userId: user.id },
    });
  }

  await recomputePlaceRating(place.id);
  await audit(user.id, existing ? "review.update" : "review.create", review.id);
  await trackEvent("review-done", user.id, { placeId: place.id, status });

  if (status === "PENDING_MODERATION") {
    return {
      success:
        "Votre expérience a été transmise à la modération avant publication (contrôles automatiques). Vous serez notifié de la décision.",
    };
  }
  redirect(`/lieux/${place.slug}?publie=1`);
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const reviewId = String(formData.get("reviewId") ?? "");
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== user.id) return;
  await prisma.review.update({ where: { id: reviewId }, data: { status: "DELETED" } });
  await recomputePlaceRating(review.placeId);
  await audit(user.id, "review.delete", reviewId);
  redirect("/compte/experiences");
}

const proposePlaceSchema = z.object({
  name: z.string().min(2, "Nom trop court.").max(120),
  categorySlug: z.string().min(1, "Choisissez une catégorie."),
  zoneSlug: z.string().min(1, "Choisissez une zone."),
  address: z.string().max(200).optional(),
});

export async function proposePlaceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`propose:${user.id}`, 5, 3600_000).ok) {
    return { error: "Trop de propositions récentes." };
  }
  const parsed = proposePlaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Détection de doublon par similarité de nom dans la même zone
  const { trigramSimilarity } = await import("@/lib/text");
  const sameZone = await prisma.place.findMany({
    where: { zone: { slug: parsed.data.zoneSlug } },
    select: { name: true, slug: true },
  });
  const dup = sameZone.find((p) => trigramSimilarity(p.name, parsed.data.name) > 0.6);
  if (dup) {
    return { error: `Un lieu très proche existe déjà : « ${dup.name} ». Vérifiez avant de créer un doublon.` };
  }

  const [category, zone] = await Promise.all([
    prisma.category.findUnique({ where: { slug: parsed.data.categorySlug } }),
    prisma.zone.findUnique({ where: { slug: parsed.data.zoneSlug }, include: { city: true } }),
  ]);
  if (!category || !zone) return { error: "Catégorie ou zone invalide." };

  let slug = slugify(parsed.data.name);
  if (await prisma.place.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;

  const place = await prisma.place.create({
    data: {
      slug,
      name: parsed.data.name,
      categoryId: category.id,
      cityId: zone.cityId,
      zoneId: zone.id,
      address: parsed.data.address || null,
      status: "ACTIVE",
      description: "Fiche proposée par la communauté — en attente d'enrichissement.",
    },
  });
  await audit(user.id, "place.propose", place.id);
  redirect(`/avis/nouveau?lieu=${place.slug}`);
}
