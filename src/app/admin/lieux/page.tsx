import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { archivePlaceAction, verifyPlaceAction } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Fiches" };

export default async function AdminPlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("ADMIN");
  const { q } = await searchParams;
  const places = await prisma.place.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    include: {
      category: true,
      zone: true,
      ratings: { where: { isCurrent: true } },
      _count: { select: { reviews: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Fiches ({places.length})</h1>
        <Link href="/admin/import" className="btn-secondary">Import CSV</Link>
      </div>
      <form action="/admin/lieux" method="get" className="mb-4 flex gap-2">
        <input type="search" name="q" defaultValue={q ?? ""} className="input max-w-xs" placeholder="Nom de la fiche" aria-label="Rechercher une fiche" />
        <button type="submit" className="btn-secondary">Chercher</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-400">
              <th className="p-3">Fiche</th>
              <th className="p-3">Note</th>
              <th className="p-3">Avis</th>
              <th className="p-3">Signal.</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {places.map((p) => (
              <tr key={p.id}>
                <td className="p-3">
                  <Link href={`/lieux/${p.slug}`} className="font-medium hover:text-brand-700">{p.name}</Link>
                  <p className="text-xs text-stone-400">{p.category.name} · {p.zone?.name}</p>
                </td>
                <td className="p-3">{(p.ratings[0]?.rating ?? 0).toFixed(1).replace(".", ",")}</td>
                <td className="p-3">{p._count.reviews}</td>
                <td className="p-3">{p._count.reports}</td>
                <td className="p-3 text-xs">
                  {p.status === "ACTIVE" ? "Active" : p.status === "ARCHIVED" ? "Archivée" : p.status}
                  {p.verified && " · ✓ vérifiée"}
                  {p.claimed && " · revendiquée"}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <form action={verifyPlaceAction}>
                      <input type="hidden" name="placeId" value={p.id} />
                      <button type="submit" className="btn-ghost text-xs">{p.verified ? "Retirer ✓" : "Vérifier"}</button>
                    </form>
                    {p.status === "ACTIVE" && (
                      <form action={archivePlaceAction}>
                        <input type="hidden" name="placeId" value={p.id} />
                        <button type="submit" className="btn-ghost text-xs text-red-700">Archiver</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
