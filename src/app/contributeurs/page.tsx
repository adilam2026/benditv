import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FollowButton } from "@/components/follow-button";
import { getCurrentUser } from "@/server/auth/session";
import { followAction } from "@/server/actions/user";

export const metadata: Metadata = {
  title: "Contributeurs",
  description: "Les membres qui font vivre la plateforme avec leurs expériences vérifiées.",
};

export default async function ContributorsPage() {
  const user = await getCurrentUser();
  const contributors = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: { in: ["USER", "VERIFIED_CONTRIBUTOR"] },
      reviews: { some: { status: "PUBLISHED" } },
      profile: { isPublic: true },
    },
    include: {
      profile: { include: { badges: true, zone: true } },
      _count: { select: { reviews: { where: { status: "PUBLISHED" } }, followers: true } },
    },
    take: 30,
  });
  const sorted = [...contributors].sort((a, b) => b._count.reviews - a._count.reviews);
  const followed = user
    ? new Set(
        (
          await prisma.follow.findMany({ where: { followerId: user.id }, select: { followedId: true } })
        ).map((f) => f.followedId)
      )
    : new Set<string>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">Contributeurs</h1>
      <p className="mb-6 text-sm text-stone-500">
        Suivez des membres pour personnaliser votre classement — sans jamais changer les notes publiques.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((c) => (
          <div key={c.id} className="card flex items-start justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{c.profile?.displayName ?? c.name}</p>
              <p className="text-xs text-stone-400">
                {c._count.reviews} expérience{c._count.reviews > 1 ? "s" : ""} · {c._count.followers} abonné{c._count.followers > 1 ? "s" : ""}
                {c.profile?.zone && ` · ${c.profile.zone.name}`}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {c.profile?.badges.slice(0, 3).map((b) => (
                  <span key={b.id} className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">{b.label}</span>
                ))}
              </div>
            </div>
            {user && user.id !== c.id && (
              <FollowButton targetId={c.id} following={followed.has(c.id)} path="/contributeurs" action={followAction} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
