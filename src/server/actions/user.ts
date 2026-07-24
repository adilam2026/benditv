"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { audit, trackEvent } from "@/server/services/audit";
import { notify } from "@/server/services/notifications";
import { rateLimit } from "@/lib/rate-limit";
import type { FormState } from "./auth";

// ── Favoris ─────────────────────────────────────────────────────

export async function toggleFavoriteAction(placeId: string, path: string): Promise<void> {
  const user = await requireUser();
  const existing = await prisma.favorite.findUnique({
    where: { userId_placeId: { userId: user.id, placeId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, placeId } });
    await trackEvent("favorite", user.id, { placeId });
  }
  revalidatePath(path);
}

// ── Listes ──────────────────────────────────────────────────────

export async function createListAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    title: z.string().min(2, "Titre trop court.").max(80),
    description: z.string().max(500).optional(),
    visibility: z.enum(["private", "public", "link"]),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const list = await prisma.list.create({
    data: {
      ownerId: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      visibility: parsed.data.visibility,
      shareToken:
        parsed.data.visibility !== "private"
          ? `${user.id.slice(-4)}-${Date.now().toString(36)}`
          : null,
    },
  });
  await audit(user.id, "list.create", list.id);
  redirect(`/compte/listes/${list.id}`);
}

export async function addToListAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  const placeId = String(formData.get("placeId") ?? "");
  const path = String(formData.get("path") ?? "/compte/listes");
  const list = await prisma.list.findFirst({
    where: { id: listId, OR: [{ ownerId: user.id }, { collaborators: { some: { userId: user.id } } }] },
  });
  if (!list) return;
  await prisma.listItem.upsert({
    where: { listId_placeId: { listId, placeId } },
    create: { listId, placeId },
    update: {},
  });
  revalidatePath(path);
}

export async function removeFromListAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const item = await prisma.listItem.findUnique({ where: { id: itemId }, include: { list: true } });
  if (!item || item.list.ownerId !== user.id) return;
  await prisma.listItem.delete({ where: { id: itemId } });
  revalidatePath(`/compte/listes/${item.listId}`);
}

export async function deleteListAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const listId = String(formData.get("listId") ?? "");
  await prisma.list.deleteMany({ where: { id: listId, ownerId: user.id } });
  redirect("/compte/listes");
}

// ── Réseau ──────────────────────────────────────────────────────

export async function followAction(targetId: string, path: string): Promise<void> {
  const user = await requireUser();
  if (targetId === user.id) return;
  const blocked = await prisma.block.findFirst({
    where: { blockerId: targetId, blockedId: user.id },
  });
  if (blocked) return;
  const existing = await prisma.follow.findUnique({
    where: { followerId_followedId: { followerId: user.id, followedId: targetId } },
  });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: { followerId: user.id, followedId: targetId, status: "PENDING" },
    });
    await notify(targetId, "invitation", "Nouvelle invitation à vous suivre", `${user.name} souhaite suivre vos recommandations.`, "/compte/reseau");
  }
  revalidatePath(path);
}

export async function respondFollowAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const followId = String(formData.get("followId") ?? "");
  const accept = formData.get("decision") === "accept";
  const follow = await prisma.follow.findUnique({ where: { id: followId } });
  if (!follow || follow.followedId !== user.id) return;
  if (accept) {
    await prisma.follow.update({ where: { id: followId }, data: { status: "ACCEPTED" } });
    await notify(follow.followerId, "invitation-acceptee", "Invitation acceptée", `${user.name} a accepté votre invitation.`);
  } else {
    await prisma.follow.delete({ where: { id: followId } });
  }
  revalidatePath("/compte/reseau");
}

export async function blockUserAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  if (!targetId || targetId === user.id) return;
  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetId } },
      create: { blockerId: user.id, blockedId: targetId },
      update: {},
    }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, followedId: targetId },
          { followerId: targetId, followedId: user.id },
        ],
      },
    }),
  ]);
  revalidatePath("/compte/reseau");
}

export async function createCircleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({ name: z.string().min(2, "Nom trop court.").max(40), kind: z.string() });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  await prisma.circle.create({ data: { ownerId: user.id, name: parsed.data.name, kind: parsed.data.kind } });
  revalidatePath("/compte/cercles");
  return { success: "Cercle créé." };
}

export async function addToCircleAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const circleId = String(formData.get("circleId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const circle = await prisma.circle.findFirst({ where: { id: circleId, ownerId: user.id } });
  if (!circle) return;
  await prisma.circleMember.upsert({
    where: { circleId_userId: { circleId, userId } },
    create: { circleId, userId },
    update: {},
  });
  revalidatePath("/compte/cercles");
}

// ── Signalements ────────────────────────────────────────────────

export async function reportAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`report:${user.id}`, 10, 3600_000).ok) {
    return { error: "Trop de signalements envoyés récemment." };
  }
  const schema = z.object({
    targetKind: z.enum(["review", "photo", "place", "pro-response"]),
    reviewId: z.string().optional(),
    placeId: z.string().optional(),
    reason: z.enum(["faux-avis", "conflit", "injurieux", "donnees-perso", "photo", "pub", "hors-sujet", "incorrect", "harcelement", "dangereux"]),
    detail: z.string().max(1000).optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Signalement invalide." };
  await prisma.moderationReport.create({
    data: {
      reporterId: user.id,
      targetKind: parsed.data.targetKind,
      reviewId: parsed.data.reviewId || null,
      placeId: parsed.data.placeId || null,
      reason: parsed.data.reason,
      detail: parsed.data.detail || null,
    },
  });
  await audit(user.id, "report.create", parsed.data.reviewId ?? parsed.data.placeId);
  return { success: "Signalement transmis à la modération. Merci pour votre vigilance." };
}

// ── Votes d'utilité ─────────────────────────────────────────────

export async function voteHelpfulAction(reviewId: string, path: string): Promise<void> {
  const user = await requireUser();
  const existing = await prisma.reviewVote.findUnique({
    where: { reviewId_userId: { reviewId, userId: user.id } },
  });
  if (existing) {
    await prisma.$transaction([
      prisma.reviewVote.delete({ where: { id: existing.id } }),
      prisma.review.update({ where: { id: reviewId }, data: { helpfulCount: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.reviewVote.create({ data: { reviewId, userId: user.id } }),
      prisma.review.update({ where: { id: reviewId }, data: { helpfulCount: { increment: 1 } } }),
    ]);
  }
  revalidatePath(path);
}

// ── Devis et réservations ───────────────────────────────────────

export async function quoteRequestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    placeId: z.string(),
    need: z.string().min(5, "Décrivez votre besoin (5 caractères minimum)."),
    budget: z.coerce.number().int().positive().optional(),
    message: z.string().max(1000).optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const place = await prisma.place.findUnique({
    where: { id: parsed.data.placeId },
    include: { organization: { include: { members: true } } },
  });
  if (!place) return { error: "Lieu introuvable." };
  await prisma.quoteRequest.create({
    data: {
      placeId: place.id,
      userId: user.id,
      need: parsed.data.need,
      budget: parsed.data.budget ?? null,
      message: parsed.data.message || null,
    },
  });
  await trackEvent("quote", user.id, { placeId: place.id });
  for (const member of place.organization?.members ?? []) {
    await notify(member.userId, "devis", `Nouvelle demande de devis — ${place.name}`, parsed.data.need, "/pro/demandes");
  }
  return { success: "Demande de devis envoyée. Le professionnel vous répondra via la plateforme." };
}

export async function reservationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    placeId: z.string(),
    date: z.string().min(8, "Choisissez une date."),
    partySize: z.coerce.number().int().min(1, "Nombre de personnes requis.").max(50),
    note: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const date = new Date(parsed.data.date);
  if (Number.isNaN(date.getTime()) || date < new Date()) {
    return { error: "La date doit être dans le futur." };
  }
  const place = await prisma.place.findUnique({
    where: { id: parsed.data.placeId },
    include: { organization: { include: { members: true } } },
  });
  if (!place) return { error: "Lieu introuvable." };
  await prisma.reservation.create({
    data: {
      placeId: place.id,
      userId: user.id,
      date,
      partySize: parsed.data.partySize,
      note: parsed.data.note || null,
    },
  });
  await trackEvent("reservation", user.id, { placeId: place.id });
  for (const member of place.organization?.members ?? []) {
    await notify(member.userId, "reservation", `Nouvelle demande de réservation — ${place.name}`, `${parsed.data.partySize} personnes`, "/pro/demandes");
  }
  return { success: "Demande de réservation envoyée (démonstration : aucune réservation réelle n'est effectuée)." };
}

// ── Questions communautaires ────────────────────────────────────

export async function createQuestionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`question:${user.id}`, 5, 3600_000).ok) {
    return { error: "Trop de questions publiées récemment." };
  }
  const schema = z.object({
    title: z.string().min(10, "Formulez votre demande en quelques mots (10 caractères minimum)."),
    body: z.string().max(2000).optional(),
    zone: z.string().optional(),
    categorie: z.string().optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Anti-doublon simple : question très similaire récente
  const recent = await prisma.question.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } },
    select: { id: true, title: true },
  });
  const { trigramSimilarity } = await import("@/lib/text");
  const dup = recent.find((r) => trigramSimilarity(r.title, parsed.data.title) > 0.7);
  if (dup) {
    return { error: "Une question très proche existe déjà. Consultez-la avant d'en créer une nouvelle." };
  }

  const question = await prisma.question.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      body: parsed.data.body || null,
      citySlug: "casablanca",
      zoneSlug: parsed.data.zone || null,
      categorySlug: parsed.data.categorie || null,
    },
  });
  await audit(user.id, "question.create", question.id);
  redirect(`/questions/${question.id}`);
}

export async function answerQuestionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    questionId: z.string(),
    body: z.string().min(10, "Expliquez votre recommandation (10 caractères minimum)."),
    placeSlug: z.string().optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const question = await prisma.question.findUnique({ where: { id: parsed.data.questionId } });
  if (!question) return { error: "Question introuvable." };
  if (parsed.data.placeSlug) {
    const place = await prisma.place.findUnique({ where: { slug: parsed.data.placeSlug } });
    if (!place) return { error: "Le lieu cité est introuvable. Utilisez son adresse exacte (slug) ou laissez vide." };
  }
  await prisma.questionAnswer.create({
    data: {
      questionId: question.id,
      userId: user.id,
      body: parsed.data.body,
      placeSlug: parsed.data.placeSlug || null,
    },
  });
  await prisma.question.update({ where: { id: question.id }, data: { status: "answered" } });
  await notify(question.userId, "question-reponse", "Nouvelle réponse à votre question", parsed.data.body.slice(0, 120), `/questions/${question.id}`);
  revalidatePath(`/questions/${question.id}`);
  return { success: "Réponse publiée." };
}

export async function voteAnswerAction(answerId: string, questionId: string): Promise<void> {
  const user = await requireUser();
  const existing = await prisma.answerVote.findUnique({
    where: { answerId_userId: { answerId, userId: user.id } },
  });
  if (existing) {
    await prisma.$transaction([
      prisma.answerVote.delete({ where: { id: existing.id } }),
      prisma.questionAnswer.update({ where: { id: answerId }, data: { votes: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.answerVote.create({ data: { answerId, userId: user.id } }),
      prisma.questionAnswer.update({ where: { id: answerId }, data: { votes: { increment: 1 } } }),
    ]);
  }
  revalidatePath(`/questions/${questionId}`);
}

// ── Missions ────────────────────────────────────────────────────

export async function joinMissionAction(missionId: string): Promise<void> {
  const user = await requireUser();
  const exists = await prisma.missionContribution.findFirst({
    where: { missionId, userId: user.id },
  });
  if (!exists) {
    await prisma.missionContribution.create({ data: { missionId, userId: user.id } });
  }
  revalidatePath(`/missions/${missionId}`);
}
