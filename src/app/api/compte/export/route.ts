import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { audit } from "@/server/services/audit";

// Export JSON des données personnelles (droit d'accès / portabilité)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [profile, preferences, consents, reviews, favorites, lists, follows, questions] =
    await Promise.all([
      prisma.userProfile.findUnique({ where: { userId: user.id }, include: { badges: true } }),
      prisma.userPreference.findUnique({ where: { userId: user.id } }),
      prisma.userConsent.findMany({ where: { userId: user.id } }),
      prisma.review.findMany({
        where: { userId: user.id, status: { not: "DELETED" } },
        include: { answers: true, verification: true, place: { select: { name: true, slug: true } } },
      }),
      prisma.favorite.findMany({ where: { userId: user.id }, include: { place: { select: { name: true } } } }),
      prisma.list.findMany({ where: { ownerId: user.id }, include: { items: true } }),
      prisma.follow.findMany({ where: { followerId: user.id } }),
      prisma.question.findMany({ where: { userId: user.id } }),
    ]);

  await audit(user.id, "account.export");

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
    profile,
    preferences,
    consents,
    reviews,
    favorites,
    lists,
    follows,
    questions,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="recofiable-donnees-${user.id.slice(-6)}.json"`,
    },
  });
}
