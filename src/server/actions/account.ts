"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, destroySession } from "@/server/auth/session";
import { audit } from "@/server/services/audit";
import type { FormState } from "./auth";

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    displayName: z.string().min(2, "Nom affiché trop court.").max(60),
    bio: z.string().max(400).optional(),
    zoneId: z.string().optional(),
    isPublic: z.string().optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: parsed.data.displayName,
      bio: parsed.data.bio || null,
      zoneId: parsed.data.zoneId || null,
      isPublic: parsed.data.isPublic === "on",
    },
    update: {
      displayName: parsed.data.displayName,
      bio: parsed.data.bio || null,
      zoneId: parsed.data.zoneId || null,
      isPublic: parsed.data.isPublic === "on",
    },
  });
  revalidatePath("/compte/profil");
  return { success: "Profil mis à jour." };
}

export async function updatePreferencesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    budgetLevel: z.string().optional(),
    hasChildren: z.string().optional(),
    childrenAges: z.string().max(60).optional(),
    mobilityNeeds: z.string().optional(),
    radiusKm: z.coerce.number().int().min(1).max(100).default(10),
    notifyEmail: z.string().optional(),
    notifyInApp: z.string().optional(),
    notifyNetwork: z.string().optional(),
    notifyMissions: z.string().optional(),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Préférences invalides." };
  const favoriteCategories = formData.getAll("favoriteCategories").map(String);
  const preferredZones = formData.getAll("preferredZones").map(String);
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, favoriteCategories, preferredZones },
    update: {
      budgetLevel: parsed.data.budgetLevel ? parseInt(parsed.data.budgetLevel, 10) : null,
      hasChildren: parsed.data.hasChildren === "on",
      childrenAges: parsed.data.childrenAges || null,
      mobilityNeeds: parsed.data.mobilityNeeds === "on",
      radiusKm: parsed.data.radiusKm,
      favoriteCategories,
      preferredZones,
      notifyEmail: parsed.data.notifyEmail === "on",
      notifyInApp: parsed.data.notifyInApp === "on",
      notifyNetwork: parsed.data.notifyNetwork === "on",
      notifyMissions: parsed.data.notifyMissions === "on",
    },
  });
  revalidatePath("/compte/preferences");
  return { success: "Préférences enregistrées." };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const schema = z.object({
    current: z.string().min(1, "Mot de passe actuel requis."),
    password: z.string().min(8, "8 caractères minimum.").regex(/[A-Z]/, "Une majuscule est requise.").regex(/[0-9]/, "Un chiffre est requis."),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  if (!bcrypt.compareSync(parsed.data.current, user.passwordHash)) {
    return { error: "Mot de passe actuel incorrect." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: bcrypt.hashSync(parsed.data.password, 10) },
  });
  await audit(user.id, "auth.password-change");
  return { success: "Mot de passe modifié." };
}

export async function revokeSessionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const sessionId = String(formData.get("sessionId") ?? "");
  await prisma.session.updateMany({
    where: { id: sessionId, userId: user.id },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/compte/securite");
}

export async function updateConsentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const kind = String(formData.get("kind") ?? "");
  const granted = formData.get("granted") === "true";
  if (!["geolocalisation", "reseau", "cookies"].includes(kind)) return;
  await prisma.userConsent.create({
    data: { userId: user.id, kind, granted, version: "1.0" },
  });
  await audit(user.id, "consent.update", kind, String(granted));
  revalidatePath("/compte/donnees");
}

export async function deleteAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "SUPPRIMER") {
    return { error: "Tapez SUPPRIMER pour confirmer la suppression définitive." };
  }
  // Anonymisation : les contributions sont détachées puis le compte marqué supprimé.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        status: "DELETED",
        email: `supprime-${user.id}@compte-supprime.local`,
        name: "Compte supprimé",
        passwordHash: "",
      },
    }),
    prisma.session.updateMany({ where: { userId: user.id }, data: { revokedAt: new Date() } }),
    prisma.userProfile.updateMany({
      where: { userId: user.id },
      data: { displayName: "Compte supprimé", bio: null, isPublic: false },
    }),
  ]);
  await audit(user.id, "account.delete");
  await destroySession();
  redirect("/");
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/compte/notifications");
}
