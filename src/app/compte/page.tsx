import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { searchPlaces } from "@/server/services/search";
import { PlaceCard } from "@/components/place-card";

export const metadata: Metadata = { title: "Mon tableau de bord" };

export default async function AccountDashboard() {
  const user = await requireUser();
  const [reviewCount, favCount, listCount, following, notifications, prefs] = await Promise.all([
    prisma.review.count({ where: { userId: user.id, status: { not: "DELETED" } } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.list.count({ where: { ownerId: user.id } }),
    prisma.follow.findMany({ where: { followerId: user.id, status: "ACCEPTED" }, select: { followedId: true } }),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.userPreference.findUnique({ where: { userId: user.id } }),
  ]);

  // Activité récente du réseau
  const networkActivity = following.length
    ? await prisma.review.findMany({
        where: { userId: { in: following.map((f) => f.followedId) }, status: "PUBLISHED", visibility: { in: ["PUBLIC", "NETWORK"] } },
        include: { user: { include: { profile: true } }, place: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  // Recommandations personnalisées basées sur les préférences
  const recoQuery = prefs?.hasChildren ? "sortie en famille avec enfants" : "";
  const { results: recommendations } = await searchPlaces(recoQuery, {}, user.id, 3);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold">Bonjour, {user.name.split(" ")[0]} 👋</h1>
      <p className="mb-6 text-sm text-stone-500">Votre activité et vos recommandations personnalisées.</p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [String(reviewCount), "expériences", "/compte/experiences"],
          [String(favCount), "favoris", "/compte/favoris"],
          [String(listCount), "listes", "/compte/listes"],
          [String(following.length), "personnes suivies", "/compte/reseau"],
        ].map(([n, label, href]) => (
          <Link key={label} href={href} className="card p-4 text-center transition hover:border-brand-600">
            <p className="text-2xl font-extrabold text-brand-800">{n}</p>
            <p className="text-xs text-stone-500">{label}</p>
          </Link>
        ))}
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Recommandé pour vous</h2>
          <Link href="/recherche" className="text-sm font-medium text-brand-700 hover:underline">Rechercher</Link>
        </div>
        <div className="space-y-4">
          {recommendations.map((item) => <PlaceCard key={item.id} item={item} />)}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="section-title mb-3">Activité de votre réseau</h2>
        {networkActivity.length === 0 ? (
          <div className="card p-6 text-sm text-stone-500">
            Suivez des <Link href="/contributeurs" className="font-medium text-brand-700 hover:underline">contributeurs</Link> pour voir leurs découvertes ici.
          </div>
        ) : (
          <div className="card divide-y divide-stone-100">
            {networkActivity.map((r) => (
              <div key={r.id} className="p-4 text-sm">
                <p>
                  <strong>{r.user.profile?.displayName ?? r.user.name}</strong> a partagé une expérience chez{" "}
                  <Link href={`/lieux/${r.place.slug}`} className="font-medium text-brand-700 hover:underline">{r.place.name}</Link>
                </p>
                {r.comment && <p className="mt-1 text-stone-500">« {r.comment.slice(0, 120)}{r.comment.length > 120 ? "…" : ""} »</p>}
                <p className="mt-1 text-xs text-stone-400">{r.createdAt.toLocaleDateString("fr-FR")}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Dernières notifications</h2>
          <Link href="/compte/notifications" className="text-sm font-medium text-brand-700 hover:underline">Tout voir</Link>
        </div>
        <div className="card divide-y divide-stone-100">
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 text-sm ${n.readAt ? "text-stone-500" : ""}`}>
              <p className="font-medium">{n.title}</p>
              {n.body && <p className="text-stone-500">{n.body}</p>}
            </div>
          ))}
          {notifications.length === 0 && <p className="p-4 text-sm text-stone-500">Aucune notification.</p>}
        </div>
      </section>
    </div>
  );
}
