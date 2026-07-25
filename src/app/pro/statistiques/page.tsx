import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { getProOrganization } from "@/server/actions/pro";
import { ScoreBar } from "@/components/rating";

export const metadata: Metadata = { title: "Statistiques" };

export default async function ProStatsPage() {
  const user = await requireRole("PROFESSIONAL");
  const org = await getProOrganization(user.id);
  const plan = org?.subscriptions[0]?.plan;
  const statsLevel = plan?.statsLevel ?? 0;
  const places = org?.places ?? [];

  if (statsLevel < 1) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="mb-2 text-xl font-extrabold">Statistiques</h1>
        <p className="text-sm text-stone-500">
          Les statistiques enrichies (détail par critère, évolution, comparaison avec la catégorie) sont incluses à
          partir de l&apos;offre Présence.
        </p>
        <Link href="/pro/abonnement" className="btn-primary mt-4">Voir les offres</Link>
      </div>
    );
  }

  const details = await Promise.all(
    places.map(async (p) => {
      const [scores, snapshot, categoryAvg] = await Promise.all([
        prisma.placeCriterionScore.findMany({
          where: { placeId: p.id },
          include: { criterion: true },
          orderBy: { score: "desc" },
        }),
        prisma.ratingSnapshot.findFirst({ where: { placeId: p.id, isCurrent: true } }),
        prisma.ratingSnapshot.aggregate({
          where: { isCurrent: true, place: { categoryId: p.categoryId } },
          _avg: { rating: true },
        }),
      ]);
      return { place: p, scores, snapshot, categoryAvg: categoryAvg._avg.rating };
    })
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold">Statistiques ({plan?.name})</h1>
      {details.map(({ place, scores, snapshot, categoryAvg }) => (
        <section key={place.id} className="card p-6">
          <h2 className="mb-1 font-bold">{place.name}</h2>
          <p className="mb-3 text-sm text-stone-500">
            Note publique {snapshot?.rating.toFixed(1).replace(".", ",")}/10
            {statsLevel >= 2 && categoryAvg && (
              <> · moyenne anonymisée de la catégorie : {categoryAvg.toFixed(1).replace(".", ",")}/10</>
            )}
            {snapshot && (
              <>
                {" "}· tendance 6 mois : {snapshot.trend > 0 ? "+" : ""}
                {snapshot.trend.toFixed(1).replace(".", ",")}
              </>
            )}
          </p>
          <div className="space-y-2">
            {scores.map((cs) => (
              <ScoreBar key={cs.id} label={cs.criterion.name} score={cs.score} count={cs.count} />
            ))}
          </div>
          {statsLevel >= 2 && snapshot && (
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-lg font-extrabold text-brand-800">{snapshot.reviewCount}</p>
                <p className="text-xs text-stone-500">expériences retenues</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-lg font-extrabold text-brand-800">{snapshot.verifiedCount}</p>
                <p className="text-xs text-stone-500">vérifiées</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-lg font-extrabold text-brand-800">{snapshot.recentCount}</p>
                <p className="text-xs text-stone-500">sur 12 mois</p>
              </div>
            </div>
          )}
        </section>
      ))}
      <p className="text-xs text-stone-400">
        Statistiques agrégées et anonymisées : l&apos;identité des contributeurs n&apos;apparaît jamais au-delà de ce
        qu&apos;ils ont rendu public.
      </p>
    </div>
  );
}
