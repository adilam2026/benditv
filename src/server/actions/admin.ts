"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/services/audit";
import { notify } from "@/server/services/notifications";
import { recomputePlaceRating } from "@/server/services/recompute";
import { slugify } from "@/lib/text";
import type { FormState } from "./auth";

// ── Modération ──────────────────────────────────────────────────

export async function moderationDecisionAction(formData: FormData): Promise<void> {
  const moderator = await requireRole("MODERATOR");
  const schema = z.object({
    reportId: z.string().optional(),
    reviewId: z.string().optional(),
    action: z.enum(["suspend", "restore", "ask-proof", "hide", "dismiss", "warn"]),
    reason: z.string().min(3).max(500),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { reportId, reviewId, action, reason } = parsed.data;

  await prisma.moderationDecision.create({
    data: { reportId: reportId || null, moderatorId: moderator.id, action, reason },
  });

  if (reviewId) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (review) {
      if (action === "suspend" || action === "hide") {
        await prisma.review.update({ where: { id: reviewId }, data: { status: "SUSPENDED" } });
        await notify(review.userId, "moderation", "Votre avis a été suspendu", `Motif : ${reason}. Vous pouvez faire un recours depuis vos expériences.`);
      } else if (action === "restore") {
        await prisma.review.update({ where: { id: reviewId }, data: { status: "PUBLISHED", weight: 1 } });
        await notify(review.userId, "moderation", "Votre avis a été rétabli", reason);
      } else if (action === "ask-proof") {
        await notify(review.userId, "moderation", "Précision demandée sur votre avis", `Un modérateur demande : ${reason}`);
      }
      await recomputePlaceRating(review.placeId);
    }
  }
  if (reportId) {
    await prisma.moderationReport.update({
      where: { id: reportId },
      data: { status: action === "dismiss" ? "DISMISSED" : "RESOLVED" },
    });
  }
  await audit(moderator.id, `moderation.${action}`, reviewId ?? reportId, reason);
  revalidatePath("/admin/moderation");
}

export async function decideClaimAction(formData: FormData): Promise<void> {
  const admin = await requireRole("MODERATOR");
  const claimId = String(formData.get("claimId") ?? "");
  const approve = formData.get("decision") === "approve";
  const claim = await prisma.placeClaim.findUnique({
    where: { id: claimId },
    include: { place: true, user: true },
  });
  if (!claim || claim.status !== "PENDING") return;

  if (approve) {
    // Crée ou rattache l'organisation du professionnel
    let org = await prisma.professionalOrganization.findFirst({
      where: { members: { some: { userId: claim.userId } } },
    });
    if (!org) {
      org = await prisma.professionalOrganization.create({
        data: { name: `${claim.user.name} — organisation`, members: { create: { userId: claim.userId, role: "owner" } } },
      });
      const freePlan = await prisma.subscriptionPlan.findUnique({ where: { slug: "gratuit" } });
      if (freePlan) {
        await prisma.subscription.create({ data: { organizationId: org.id, planId: freePlan.id } });
      }
    }
    await prisma.$transaction([
      prisma.placeClaim.update({ where: { id: claimId }, data: { status: "APPROVED", decidedAt: new Date() } }),
      prisma.place.update({ where: { id: claim.placeId }, data: { claimed: true, organizationId: org.id } }),
      prisma.user.update({ where: { id: claim.userId }, data: { role: claim.user.role === "ADMIN" ? "ADMIN" : "PROFESSIONAL" } }),
    ]);
    await notify(claim.userId, "revendication", `Revendication validée — ${claim.place.name}`, "Vous pouvez maintenant gérer cette fiche depuis l'espace professionnel.", "/pro");
  } else {
    await prisma.placeClaim.update({ where: { id: claimId }, data: { status: "REJECTED", decidedAt: new Date() } });
    await notify(claim.userId, "revendication", `Revendication refusée — ${claim.place.name}`, "Les justificatifs fournis n'ont pas permis de valider votre lien avec l'établissement.");
  }
  await audit(admin.id, approve ? "claim.approve" : "claim.reject", claimId);
  revalidatePath("/admin/revendications");
}

// ── Taxonomie ───────────────────────────────────────────────────

export async function decideProposalAction(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const schema = z.object({
    proposalId: z.string(),
    decision: z.enum(["accept", "merge", "tag", "specialty", "reject"]),
    categorySlug: z.string().optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const proposal = await prisma.categoryProposal.findUnique({ where: { id: parsed.data.proposalId } });
  if (!proposal || proposal.status !== "PENDING") return;

  const term = proposal.term;
  if (parsed.data.decision === "accept") {
    const universe = await prisma.category.findFirst({ where: { kind: "universe" }, orderBy: { sortOrder: "asc" } });
    await prisma.category.create({
      data: { slug: slugify(term), name: term.charAt(0).toUpperCase() + term.slice(1), kind: "category", parentId: universe?.id },
    });
    await prisma.categoryProposal.update({
      where: { id: proposal.id },
      data: { status: "ACCEPTED", decidedById: admin.id, decidedAt: new Date() },
    });
  } else if (parsed.data.decision === "merge" && parsed.data.categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: parsed.data.categorySlug } });
    if (!category) return;
    await prisma.categorySynonym.upsert({
      where: { categoryId_term: { categoryId: category.id, term: slugify(term).replace(/-/g, " ") } },
      create: { categoryId: category.id, term: slugify(term).replace(/-/g, " ") },
      update: {},
    });
    await prisma.categoryProposal.update({
      where: { id: proposal.id },
      data: { status: "MERGED", categoryId: category.id, decidedById: admin.id, decidedAt: new Date() },
    });
  } else if (parsed.data.decision === "tag") {
    await prisma.tag.upsert({
      where: { slug: slugify(term) },
      create: { slug: slugify(term), name: term },
      update: {},
    });
    await prisma.categoryProposal.update({
      where: { id: proposal.id },
      data: { status: "CONVERTED_TAG", decidedById: admin.id, decidedAt: new Date() },
    });
  } else if (parsed.data.decision === "specialty" && parsed.data.categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: parsed.data.categorySlug } });
    if (!category) return;
    await prisma.specialty.upsert({
      where: { slug: slugify(term) },
      create: { slug: slugify(term), name: term, categoryId: category.id },
      update: {},
    });
    await prisma.categoryProposal.update({
      where: { id: proposal.id },
      data: { status: "CONVERTED_SPECIALTY", categoryId: category.id, decidedById: admin.id, decidedAt: new Date() },
    });
  } else {
    await prisma.categoryProposal.update({
      where: { id: proposal.id },
      data: { status: "REJECTED", decidedById: admin.id, decidedAt: new Date() },
    });
  }
  await audit(admin.id, `taxonomy.proposal.${parsed.data.decision}`, proposal.id, term);
  revalidatePath("/admin/categories");
}

// ── Anti-fraude ─────────────────────────────────────────────────

export async function decideFraudWaveAction(formData: FormData): Promise<void> {
  const admin = await requireRole("MODERATOR");
  const waveId = String(formData.get("waveId") ?? "");
  const decision = String(formData.get("decision") ?? ""); // neutralize | clear
  const wave = await prisma.fraudWave.findUnique({ where: { id: waveId } });
  if (!wave) return;

  if (decision === "clear") {
    await prisma.$transaction([
      prisma.fraudWave.update({ where: { id: waveId }, data: { status: "cleared", endedAt: new Date() } }),
      prisma.review.updateMany({
        where: { placeId: wave.placeId, status: "NEUTRALIZED" },
        data: { status: "PUBLISHED", weight: 0.6 },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.fraudWave.update({ where: { id: waveId }, data: { status: "neutralized" } }),
      prisma.review.updateMany({
        where: {
          placeId: wave.placeId,
          createdAt: { gte: wave.startedAt },
          status: { in: ["PUBLISHED", "NEUTRALIZED"] },
          riskScore: { gte: 0.5 },
        },
        data: { status: "EXCLUDED", weight: 0 },
      }),
    ]);
  }
  await recomputePlaceRating(wave.placeId);
  await audit(admin.id, `fraud.wave.${decision}`, waveId);
  revalidatePath("/admin/fraude");
}

// ── Utilisateurs ────────────────────────────────────────────────

export async function updateUserStatusAction(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["ACTIVE", "LIMITED", "SUSPENDED"].includes(status)) return;
  if (userId === admin.id) return;
  await prisma.user.update({ where: { id: userId }, data: { status: status as "ACTIVE" | "LIMITED" | "SUSPENDED" } });
  if (status === "SUSPENDED") {
    await prisma.session.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
  }
  await audit(admin.id, "user.status", userId, status);
  revalidatePath("/admin/utilisateurs");
}

export async function updateSettingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const entries = [...formData.entries()].filter(([k]) => k.startsWith("setting:"));
  for (const [key, value] of entries) {
    await prisma.systemSetting.upsert({
      where: { key: key.replace("setting:", "") },
      create: { key: key.replace("setting:", ""), value: String(value) },
      update: { value: String(value) },
    });
  }
  await audit(admin.id, "settings.update", undefined, `${entries.length} clés`);
  revalidatePath("/admin/parametres");
  return { success: "Paramètres enregistrés." };
}

// ── Import CSV ──────────────────────────────────────────────────

export async function importCsvAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const csv = String(formData.get("csv") ?? "").trim();
  if (!csv) return { error: "Collez un contenu CSV (nom;categorie;zone;adresse;prix)." };
  const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
  let created = 0;
  const errors: string[] = [];
  for (const [i, line] of lines.entries()) {
    if (i === 0 && /^nom[;,]/i.test(line)) continue; // en-tête
    const [name, categorySlug, zoneSlug, address, price] = line.split(/[;,]/).map((s) => s?.trim());
    if (!name || !categorySlug || !zoneSlug) {
      errors.push(`Ligne ${i + 1} : nom, catégorie et zone requis.`);
      continue;
    }
    const [category, zone] = await Promise.all([
      prisma.category.findUnique({ where: { slug: categorySlug } }),
      prisma.zone.findUnique({ where: { slug: zoneSlug }, include: { city: true } }),
    ]);
    if (!category || !zone) {
      errors.push(`Ligne ${i + 1} : catégorie « ${categorySlug} » ou zone « ${zoneSlug} » inconnue.`);
      continue;
    }
    let slug = slugify(name);
    if (await prisma.place.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}${i}`;
    await prisma.place.create({
      data: {
        slug, name, categoryId: category.id, cityId: zone.cityId, zoneId: zone.id,
        address: address || null,
        avgPricePerPerson: price ? parseInt(price, 10) || null : null,
        description: "Fiche importée par l'administration (données à compléter).",
      },
    });
    created++;
  }
  await audit(admin.id, "import.csv", undefined, `${created} lieux créés`);
  if (errors.length > 0) {
    return { error: `${created} lieu(x) créé(s). Erreurs : ${errors.slice(0, 3).join(" ")}` };
  }
  return { success: `${created} lieu(x) importé(s) avec succès.` };
}

export async function archivePlaceAction(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const placeId = String(formData.get("placeId") ?? "");
  await prisma.place.update({ where: { id: placeId }, data: { status: "ARCHIVED" } });
  await audit(admin.id, "place.archive", placeId);
  revalidatePath("/admin/lieux");
}

export async function verifyPlaceAction(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const placeId = String(formData.get("placeId") ?? "");
  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place) return;
  await prisma.place.update({ where: { id: placeId }, data: { verified: !place.verified } });
  await audit(admin.id, "place.verify", placeId, String(!place.verified));
  revalidatePath("/admin/lieux");
}
