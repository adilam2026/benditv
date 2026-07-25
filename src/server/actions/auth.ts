"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { createSession, destroySession, getCurrentUser } from "@/server/auth/session";
import { audit, trackEvent } from "@/server/services/audit";
import { sendMail } from "@/server/integrations/mail";

export type FormState = { error?: string; success?: string } | null;

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(80),
  email: z.string().email("Adresse e-mail invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule.")
    .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre."),
  cgu: z.literal("on", { errorMap: () => ({ message: "Vous devez accepter les conditions générales." }) }),
});

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`, 5, 3600_000).ok) {
    return { error: "Trop de tentatives d'inscription. Réessayez plus tard." };
  }
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return { error: "Un compte existe déjà avec cette adresse e-mail." };

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "USER",
      // Validation d'e-mail simulée en développement (MAIL_PROVIDER=console)
      emailVerified: new Date(),
      profile: { create: { displayName: name } },
      preferences: { create: { favoriteCategories: [], preferredZones: [] } },
      consents: {
        create: [
          { kind: "cgu", granted: true, version: "1.0" },
          { kind: "confidentialite", granted: true, version: "1.0" },
        ],
      },
      trustScore: { create: { score: 0.5 } },
    },
  });
  await sendMail(user.email, "Bienvenue sur RECOFIABLE", "Votre compte de démonstration est actif.");
  await createSession(user.id);
  await audit(user.id, "auth.register");
  await trackEvent("signup", user.id);
  redirect("/compte");
}

const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 10, 900_000).ok) {
    return { error: "Trop de tentatives. Patientez 15 minutes avant de réessayer." };
  }
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
    await audit(null, "auth.login.failed", parsed.data.email);
    return { error: "Identifiants incorrects." };
  }
  if (user.status === "SUSPENDED") return { error: "Ce compte est suspendu. Contactez le support." };
  await createSession(user.id);
  await audit(user.id, "auth.login");
  const dest =
    user.role === "ADMIN" ? "/admin" : user.role === "MODERATOR" ? "/admin/moderation" : user.role === "PROFESSIONAL" ? "/pro" : "/compte";
  redirect(dest);
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit(user.id, "auth.logout");
  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`forgot:${ip}`, 5, 3600_000).ok) {
    return { error: "Trop de demandes. Réessayez plus tard." };
  }
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Adresse e-mail invalide." };
  const user = await prisma.user.findUnique({ where: { email: email.data.toLowerCase() } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reinitialiser?token=${token}`;
    await sendMail(user.email, "Réinitialisation de votre mot de passe", `Lien (valide 1 h) : ${url}`);
  }
  // Réponse identique que le compte existe ou non (pas de fuite d'information)
  return { success: "Si un compte existe pour cette adresse, un e-mail de réinitialisation a été envoyé (en développement : voir la console du serveur)." };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const schema = z.object({
    token: z.string().min(10),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").regex(/[A-Z]/, "Une majuscule est requise.").regex(/[0-9]/, "Un chiffre est requis."),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { error: "Lien invalide ou expiré. Refaites une demande." };
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: bcrypt.hashSync(parsed.data.password, 10) },
    }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    prisma.session.updateMany({ where: { userId: row.userId }, data: { revokedAt: new Date() } }),
  ]);
  await audit(row.userId, "auth.password-reset");
  return { success: "Mot de passe mis à jour. Vous pouvez vous connecter." };
}
