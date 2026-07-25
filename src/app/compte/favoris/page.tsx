import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { RatingBadge, ConfidenceBadge } from "@/components/rating";
import { FavoriteButton } from "@/components/place-actions";

export const metadata: Metadata = { title: "Mes favoris" };

export default async function FavoritesPage() {
  const user = await requireUser();
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      place: { include: { category: true, zone: true, ratings: { where: { isCurrent: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold">Mes favoris ({favorites.length})</h1>
      <div className="space-y-3">
        {favorites.map((f) => (
          <div key={f.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/lieux/${f.place.slug}`} className="font-bold hover:text-brand-700">{f.place.name}</Link>
              <p className="text-xs text-stone-500">{f.place.category.name} · {f.place.zone?.name ?? "Casablanca"}</p>
              <div className="mt-1"><ConfidenceBadge confidence={f.place.ratings[0]?.confidence ?? "faible"} /></div>
            </div>
            <div className="flex items-center gap-2">
              <RatingBadge rating={f.place.ratings[0]?.rating ?? 0} />
              <FavoriteButton placeId={f.placeId} path="/compte/favoris" isFavorite loggedIn />
            </div>
          </div>
        ))}
        {favorites.length === 0 && (
          <div className="card p-8 text-center text-sm text-stone-500">
            Aucun favori. <Link href="/recherche" className="font-medium text-brand-700 hover:underline">Explorez les lieux</Link> et enregistrez vos adresses.
          </div>
        )}
      </div>
    </div>
  );
}
