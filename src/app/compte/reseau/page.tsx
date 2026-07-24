import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { respondFollowAction, blockUserAction, followAction } from "@/server/actions/user";
import { FollowButton } from "@/components/follow-button";

export const metadata: Metadata = { title: "Mon réseau" };

export default async function NetworkPage() {
  const user = await requireUser();
  const [following, followers, pending, blocks] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: user.id, status: "ACCEPTED" },
      include: { followed: { include: { profile: true } } },
    }),
    prisma.follow.findMany({
      where: { followedId: user.id, status: "ACCEPTED" },
      include: { follower: { include: { profile: true } } },
    }),
    prisma.follow.findMany({
      where: { followedId: user.id, status: "PENDING" },
      include: { follower: { include: { profile: true } } },
    }),
    prisma.block.findMany({ where: { blockerId: user.id }, include: { blocked: true } }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold">Mon réseau</h1>
      <p className="mb-6 text-sm text-stone-500">
        Réseau interne à la plateforme, indépendant des réseaux sociaux externes. Il personnalise votre classement,
        jamais les notes publiques.
      </p>

      {pending.length > 0 && (
        <section className="mb-6">
          <h2 className="section-title mb-3">Invitations reçues ({pending.length})</h2>
          <div className="card divide-y divide-stone-100">
            {pending.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <span className="font-medium">{f.follower.profile?.displayName ?? f.follower.name}</span>
                <div className="flex gap-2">
                  <form action={respondFollowAction}>
                    <input type="hidden" name="followId" value={f.id} />
                    <input type="hidden" name="decision" value="accept" />
                    <button type="submit" className="btn-primary">Accepter</button>
                  </form>
                  <form action={respondFollowAction}>
                    <input type="hidden" name="followId" value={f.id} />
                    <input type="hidden" name="decision" value="decline" />
                    <button type="submit" className="btn-secondary">Refuser</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Personnes suivies ({following.length})</h2>
          <Link href="/contributeurs" className="text-sm font-medium text-brand-700 hover:underline">Découvrir des contributeurs</Link>
        </div>
        <div className="card divide-y divide-stone-100">
          {following.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <span className="font-medium">{f.followed.profile?.displayName ?? f.followed.name}</span>
              <div className="flex gap-2">
                <FollowButton targetId={f.followedId} following path="/compte/reseau" action={followAction} />
                <form action={blockUserAction}>
                  <input type="hidden" name="targetId" value={f.followedId} />
                  <button type="submit" className="btn-ghost text-red-700">Bloquer</button>
                </form>
              </div>
            </div>
          ))}
          {following.length === 0 && <p className="p-4 text-sm text-stone-500">Vous ne suivez encore personne.</p>}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="section-title mb-3">Vos abonnés ({followers.length})</h2>
        <div className="card divide-y divide-stone-100">
          {followers.map((f) => (
            <div key={f.id} className="p-4 text-sm font-medium">{f.follower.profile?.displayName ?? f.follower.name}</div>
          ))}
          {followers.length === 0 && <p className="p-4 text-sm text-stone-500">Personne ne vous suit encore.</p>}
        </div>
      </section>

      {blocks.length > 0 && (
        <section>
          <h2 className="section-title mb-3">Comptes bloqués</h2>
          <div className="card divide-y divide-stone-100">
            {blocks.map((b) => (
              <div key={b.id} className="p-4 text-sm text-stone-500">{b.blocked.name}</div>
            ))}
          </div>
        </section>
      )}

      <div className="card mt-6 border-stone-200 bg-stone-50/50 p-4 text-xs text-stone-500">
        Connexion sociale externe : l&apos;import de contacts depuis un réseau social n&apos;est pas activé dans cette
        version de démonstration. Si un connecteur officiel est activé un jour, seules les données explicitement
        autorisées par vous et par la plateforme concernée seront utilisées.
      </div>
    </div>
  );
}
