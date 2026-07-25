import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminDashboard() {
  const monthAgo = new Date(Date.now() - 30 * 86400_000);
  const [
    users, newUsers, pros, places, reviews, openReports, waves, activeSubs,
    revenue, searches, noResultSearches, proposals,
  ] = await Promise.all([
    prisma.user.count({ where: { status: { not: "DELETED" } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { role: "PROFESSIONAL" } }),
    prisma.place.count({ where: { status: "ACTIVE" } }),
    prisma.review.count({ where: { status: "PUBLISHED" } }),
    prisma.moderationReport.count({ where: { status: "OPEN" } }),
    prisma.fraudWave.count({ where: { status: "detected" } }),
    prisma.subscription.count({ where: { status: "ACTIVE", plan: { priceMad: { gt: 0 } } } }),
    prisma.invoice.aggregate({ _sum: { amountMad: true } }),
    prisma.searchLog.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.searchLog.findMany({ where: { resultCount: 0 }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.categoryProposal.count({ where: { status: "PENDING" } }),
  ]);

  const topSearches = await prisma.searchLog.groupBy({
    by: ["rawQuery"],
    _count: { rawQuery: true },
    orderBy: { _count: { rawQuery: "desc" } },
    take: 6,
  });

  const cards = [
    [String(users), "utilisateurs", "/admin/utilisateurs"],
    [`+${newUsers}`, "nouveaux comptes (30 j)", "/admin/utilisateurs"],
    [String(pros), "professionnels", "/admin/utilisateurs"],
    [String(places), "fiches actives", "/admin/lieux"],
    [String(reviews), "avis publiés", "/admin/moderation"],
    [String(openReports), "signalements ouverts", "/admin/moderation"],
    [String(waves), "vagues suspectes", "/admin/fraude"],
    [String(activeSubs), "abonnements payants", "/admin/abonnements"],
  ] as const;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Tableau de bord</h1>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(([n, label, href]) => (
          <Link key={label} href={href} className="card p-4 text-center transition hover:border-brand-600">
            <p className="text-2xl font-extrabold text-brand-800">{n}</p>
            <p className="text-xs text-stone-500">{label}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-bold">Recherches fréquentes (30 j : {searches})</h2>
          <ul className="space-y-1.5 text-sm text-stone-600">
            {topSearches.map((s) => (
              <li key={s.rawQuery} className="flex justify-between">
                <span className="truncate">{s.rawQuery}</span>
                <span className="text-stone-400">{s._count.rawQuery}×</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-bold">Recherches sans résultat</h2>
          <ul className="space-y-1.5 text-sm text-stone-600">
            {noResultSearches.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span className="truncate">{s.rawQuery}</span>
                <span className="text-xs text-stone-400">{s.createdAt.toLocaleDateString("fr-FR")}</span>
              </li>
            ))}
            {noResultSearches.length === 0 && <li className="text-stone-400">Aucune.</li>}
          </ul>
          <p className="mt-2 text-xs text-stone-400">
            {proposals} proposition{proposals > 1 ? "s" : ""} de catégorie en attente —{" "}
            <Link href="/admin/categories" className="font-medium text-brand-700 hover:underline">examiner</Link>
          </p>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Revenus fictifs cumulés</h2>
          <p className="text-2xl font-extrabold text-brand-800">{revenue._sum.amountMad ?? 0} MAD</p>
          <p className="text-xs text-stone-400">Factures de démonstration uniquement — aucun paiement réel.</p>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Zones actives</h2>
          <p className="text-sm text-stone-600">Casablanca : Dar Bouazza, Ain Diab, Bouskoura, Maârif, Californie, Oasis, Sidi Maârouf, Centre-ville.</p>
          <p className="mt-1 text-xs text-stone-400">Ajout de villes et zones via les paramètres système et l&apos;import.</p>
        </section>
      </div>
    </div>
  );
}
