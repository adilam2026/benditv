import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Role, User } from "@prisma/client";
import { redirect } from "next/navigation";

const COOKIE_NAME = "reco_session";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token + (process.env.SESSION_SECRET ?? "")).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const h = await headers();
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000),
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: h.get("user-agent")?.slice(0, 250) ?? null,
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86400,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token) },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.delete(COOKIE_NAME);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.user.status === "SUSPENDED" || session.user.status === "DELETED") return null;
  return session.user;
});

const ROLE_LEVELS: Record<Role, number> = {
  VISITOR: 0,
  USER: 1,
  VERIFIED_CONTRIBUTOR: 2,
  PROFESSIONAL: 2,
  MODERATOR: 3,
  ADMIN: 4,
};

export function hasRole(user: User | null, role: Role): boolean {
  if (!user) return false;
  if (role === "PROFESSIONAL") return user.role === "PROFESSIONAL" || user.role === "ADMIN";
  return ROLE_LEVELS[user.role] >= ROLE_LEVELS[role];
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

export async function requireRole(role: Role): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (!hasRole(user, role)) redirect("/compte");
  return user;
}
