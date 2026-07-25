import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { getProOrganization } from "@/server/actions/pro";
import { RatingBadge, ConfidenceBadge, TrendBadge } from "@/components/rating";

export const metadata: Metadata = { title: "Espace professionnel" };

export default async function ProDashboard() {
  const user = await requireRole("PROFESSIONAL");
  const org = await getProOrganization(user.id);
  if (!org) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="mb-2 text-xl font-extrabold">Espace professionnel</h1>
        <p className="text-sm text-stone-500">
          Votre compte professionnel n&apos;est pas encore rattaché à un établissement.
        </p>
        <Link href="/pro/revendication" className="btn-primary mt-4">Revendiquer ma fiche</Link>
      </div>
    );
  }
  const placeIds = org.places.map((p) => p.id);
  const plan = org.subscriptions[0]?.plan;
  const [reviewCount, recentReviews, quotes, reservations, views] = await Promise.all([
    prisma.review.count({ where: { placeId: { in: placeIds }, status: "PUBLISHED" } }),
    prisma.review.count({
      where: { placeId: { in: placeIds }, status: "PUBLISHED", createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } },
    }),
    prisma.quoteRequest.count({ where: { placeId: { in: placeIds }, status: "new" } }),
    prisma.reservation.count({ where: { placeId: { in: placeIds }, status: "pending" } }),
    prisma.analyticsEvent.count({ where: { kind: "click", createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{org.name}</h1>
          <p className="text-sm text-stone-500">
            Abonnement : <strong>{plan?.name ?? "Gratuit"}</strong> ·{" "}
            <Link href="/pro/abonnement" className="text-brand-700 hover:underline">gérer</Link>
          </p>
        </div>
        <Link href="/pro/revendication" className="btn-secondary">+ Revendiquer une autre fiche</Link>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [String(reviewCount), "avis publiés", "/pro/avis"],
          [String(recentReviews), "avis sur 30 jours", "/pro/avis"],
          [String(quotes), "devis en attente", "/pro/demandes"],
          [String(reservations), "réservations à traiter", "/pro/demandes"],
        ].map(([n, label, href]) => (
          <Link key={label} href={href} className="card p-4 text-center transition hover:border-brand-600">
            <p className="text-2xl font-extrabold text-brand-800">{n}</p>
            <p className="text-xs text-stone-500">{label}</p>
          </Link>
        ))}
      </div>
      <p className="mb-6 text-xs text-stone-400">
        Vues plateforme (30 j, toutes fiches confondues, agrégées et anonymisées) : {views}. Les statistiques ne
        révèlent jamais l&apos;identité des visiteurs.
      </p>
      <h2 className="section-title mb-3">Vos établissements</h2>
      <div className="space-y-3">
        {org.places.map((p) => (
          <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/pro/etablissements/${p.id}`} className="font-bold hover:text-brand-700">{p.name}</Link>
              <p className="text-xs text-stone-500">{p.category.name} · {p.zone?.name ?? "Casablanca"}</p>
              <div className="mt-1 flex items-center gap-2">
                <ConfidenceBadge confidence={p.ratings[0]?.confidence ?? "faible"} />
                <TrendBadge trend={p.ratings[0]?.trend ?? 0} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RatingBadge rating={p.ratings[0]?.rating ?? 0} />
              <Link href={`/pro/etablissements/${p.id}`} className="btn-secondary">Gérer</Link>
            </div>
          </div>
        ))}
        {org.places.length === 0 && (
          <div className="card p-6 text-sm text-stone-500">
            Aucun établissement rattaché. <Link href="/pro/revendication" className="font-medium text-brand-700 hover:underline">Revendiquez votre fiche.</Link>
          </div>
        )}
      </div>
    </div>
  );
}
