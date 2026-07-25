"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { audit, trackEvent } from "@/server/services/audit";
import { notify } from "@/server/services/notifications";
import { chargeSubscription } from "@/server/integrations/payment";
import type { FormState } from "./auth";

// Renvoie l'organisation du professionnel connecté (ou null)
export async function getProOrganization(userId: string) {
  return prisma.professionalOrganization.findFirst({
    where: { members: { some: { userId } } },
    include: {
      places: { include: { category: true, zone: true, ratings: { where: { isCurrent: true } } } },
      subscriptions: { where: { status: { in: ["ACTIVE", "TRIAL"] } }, include: { plan: true }, orderBy: { startedAt: "desc" } },
      members: { include: { user: true } },
    },
  });
}

async function assertOwnsPlace(userId: string, placeId: string) {
  const place = await prisma.place.findFirst({
    where: { id: placeId, organization: { members: { some: { userId } } } },
  });
  if (!place) throw new Error("Accès refusé à cet établissement.");
  return place;
}

export async function updatePlaceInfoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    placeId: z.string(),
    description: z.string().max(1500).optional(),
    phone: z.string().max(30).optional(),
    whatsapp: z.string().max(30).optional(),
    website: z.string().url("Adresse de site invalide.").optional().or(z.literal("")),
    address: z.string().max(200).optional(),
    avgPricePerPerson: z.coerce.number().int().min(0).max(100000).optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  try {
    await assertOwnsPlace(user.id, parsed.data.placeId);
  } catch {
    return { error: "Vous ne gérez pas cet établissement." };
  }
  await prisma.place.update({
    where: { id: parsed.data.placeId },
    data: {
      description: parsed.data.description || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      website: parsed.data.website || null,
      address: parsed.data.address || null,
      avgPricePerPerson: parsed.data.avgPricePerPerson || null,
    },
  });
  await audit(user.id, "pro.place-update", parsed.data.placeId);
  revalidatePath(`/pro/etablissements/${parsed.data.placeId}`);
  return { success: "Informations mises à jour. Elles restent identifiées comme déclarées par le professionnel." };
}

export async function updateHoursAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const placeId = String(formData.get("placeId") ?? "");
  try {
    await assertOwnsPlace(user.id, placeId);
  } catch {
    return;
  }
  const rows: { dayOfWeek: number; openMin: number; closeMin: number }[] = [];
  for (let day = 0; day < 7; day++) {
    const open = String(formData.get(`open-${day}`) ?? "");
    const close = String(formData.get(`close-${day}`) ?? "");
    if (!open || !close) continue;
    const [oh, om] = open.split(":").map(Number);
    const [ch, cm] = close.split(":").map(Number);
    if ([oh, om, ch, cm].some(Number.isNaN)) continue;
    rows.push({ dayOfWeek: day, openMin: oh * 60 + om, closeMin: ch * 60 + cm });
  }
  await prisma.$transaction([
    prisma.placeHours.deleteMany({ where: { placeId } }),
    prisma.placeHours.createMany({ data: rows.map((r) => ({ ...r, placeId })) }),
    prisma.placeHistory.create({
      data: { placeId, kind: "horaires", detail: "Horaires mis à jour par le professionnel" },
    }),
  ]);
  revalidatePath(`/pro/etablissements/${placeId}`);
}

export async function respondReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    reviewId: z.string(),
    body: z.string().min(10, "Votre réponse doit contenir au moins 10 caractères.").max(2000),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const review = await prisma.review.findUnique({
    where: { id: parsed.data.reviewId },
    include: { place: { include: { organization: { include: { members: true } } } } },
  });
  if (!review || !review.place.organization?.members.some((m) => m.userId === user.id)) {
    return { error: "Vous ne pouvez répondre qu'aux avis de vos établissements." };
  }
  await prisma.professionalResponse.upsert({
    where: { reviewId: review.id },
    create: { reviewId: review.id, authorId: user.id, body: parsed.data.body },
    update: { body: parsed.data.body },
  });
  await notify(review.userId, "reponse-pro", `Le professionnel a répondu à votre avis sur ${review.place.name}`, undefined, `/lieux/${review.place.slug}`);
  await audit(user.id, "pro.respond", review.id);
  revalidatePath("/pro/avis");
  return { success: "Réponse publiée. Elle apparaît clairement identifiée comme réponse du professionnel." };
}

export async function claimPlaceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    placeSlug: z.string().min(1, "Indiquez la fiche à revendiquer."),
    roleInOrg: z.string().min(2, "Précisez votre rôle dans l'entreprise."),
    proofNote: z.string().min(5, "Décrivez le justificatif fourni."),
    proPhone: z.string().max(30).optional(),
    proEmail: z.string().email("E-mail professionnel invalide."),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const place = await prisma.place.findUnique({ where: { slug: parsed.data.placeSlug } });
  if (!place) return { error: "Fiche introuvable. Vérifiez l'identifiant (visible dans l'adresse de la fiche)." };
  const existing = await prisma.placeClaim.findFirst({
    where: { placeId: place.id, userId: user.id, status: "PENDING" },
  });
  if (existing) return { error: "Vous avez déjà une revendication en attente pour cette fiche." };
  await prisma.placeClaim.create({
    data: {
      placeId: place.id,
      userId: user.id,
      roleInOrg: parsed.data.roleInOrg,
      proofNote: parsed.data.proofNote,
      proPhone: parsed.data.proPhone || null,
      proEmail: parsed.data.proEmail,
    },
  });
  await audit(user.id, "pro.claim", place.id);
  return { success: "Revendication envoyée. Un administrateur va vérifier vos justificatifs (validation manuelle)." };
}

export async function changePlanAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const planSlug = String(formData.get("planSlug") ?? "");
  const org = await prisma.professionalOrganization.findFirst({
    where: { members: { some: { userId: user.id } } },
    include: { subscriptions: { where: { status: "ACTIVE" } } },
  });
  if (!org) return { error: "Aucune organisation professionnelle associée à votre compte." };
  const plan = await prisma.subscriptionPlan.findUnique({ where: { slug: planSlug } });
  if (!plan || !plan.active) return { error: "Offre inconnue." };
  if (plan.priceMad === null) return { error: "L'offre Réseau est sur devis : contactez-nous via la page Contact." };

  // Paiement fictif via l'abstraction (PAYMENT_PROVIDER=demo par défaut)
  if (plan.priceMad > 0) {
    const payment = await chargeSubscription(org.id, plan.priceMad);
    if (!payment.ok) return { error: payment.error };
  }

  await prisma.$transaction(async (tx) => {
    for (const sub of org.subscriptions) {
      await tx.subscription.update({
        where: { id: sub.id },
        data: { status: "CANCELED", canceledAt: new Date() },
      });
    }
    const sub = await tx.subscription.create({
      data: { organizationId: org.id, planId: plan.id, status: "ACTIVE" },
    });
    if (plan.priceMad && plan.priceMad > 0) {
      await tx.invoice.create({
        data: {
          subscriptionId: sub.id,
          number: `DEMO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
          amountMad: plan.priceMad,
          status: "paid",
          isDemo: true,
        },
      });
    }
  });
  await audit(user.id, "pro.plan-change", org.id, planSlug);
  await trackEvent("subscription", user.id, { plan: planSlug });
  revalidatePath("/pro/abonnement");
  return { success: `Abonnement « ${plan.name} » activé (paiement fictif de démonstration, facture générée).` };
}

export async function cancelPlanAction(): Promise<void> {
  const user = await requireUser();
  const org = await prisma.professionalOrganization.findFirst({
    where: { members: { some: { userId: user.id } } },
    include: { subscriptions: { where: { status: "ACTIVE" } } },
  });
  if (!org) return;
  for (const sub of org.subscriptions) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
  }
  await audit(user.id, "pro.plan-cancel", org.id);
  revalidatePath("/pro/abonnement");
}
