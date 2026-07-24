import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Carte",
  description: "Vue carte des lieux répertoriés à Casablanca.",
};

// Carte schématique autonome (SVG) : aucune dépendance à un service de
// tuiles externe. Un fournisseur cartographique sous licence peut être
// branché plus tard via les intégrations.
export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const places = await prisma.place.findMany({
    where: { status: "ACTIVE", ...(categorie ? { category: { slug: categorie } } : {}), location: { isNot: null } },
    include: { location: true, category: true, zone: true, ratings: { where: { isCurrent: true } } },
    take: 100,
  });
  const universes = await prisma.category.findMany({ where: { kind: "universe" }, orderBy: { sortOrder: "asc" } });

  const lats = places.map((p) => p.location!.lat);
  const lngs = places.map((p) => p.location!.lng);
  const minLat = Math.min(...lats, 33.4), maxLat = Math.max(...lats, 33.62);
  const minLng = Math.min(...lngs, -7.85), maxLng = Math.max(...lngs, -7.55);
  const x = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 940 + 30;
  const y = (lat: number) => (1 - (lat - minLat) / (maxLat - minLat)) * 560 + 20;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-extrabold">Vue carte — Casablanca</h1>
      <p className="mb-4 text-sm text-stone-500">
        Carte schématique (positions fictives de démonstration). Survolez un point pour voir le lieu.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/carte" className={`chip ${!categorie ? "border-brand-600 bg-brand-50 text-brand-800" : "hover:border-brand-600"}`}>Tout</Link>
        {universes.map((u) => (
          <Link key={u.id} href={`/carte?categorie=${u.slug}`} className={`chip ${categorie === u.slug ? "border-brand-600 bg-brand-50 text-brand-800" : "hover:border-brand-600"}`}>
            {u.icon} {u.name}
          </Link>
        ))}
      </div>
      <div className="card overflow-x-auto p-2">
        <svg viewBox="0 0 1000 600" className="min-w-[640px]" role="img" aria-label="Carte schématique des lieux">
          <rect width="1000" height="600" fill="#f0fdfa" rx="12" />
          <path d="M 0 80 Q 300 20 1000 120 L 1000 0 L 0 0 Z" fill="#bae6fd" opacity="0.7" />
          <text x="500" y="45" textAnchor="middle" fontSize="16" fill="#0369a1">Océan Atlantique</text>
          {places.map((p) => (
            <g key={p.id}>
              <a href={`/lieux/${p.slug}`}>
                <circle cx={x(p.location!.lng)} cy={y(p.location!.lat)} r="8" fill="#0f766e" opacity="0.85">
                  <title>{`${p.name} — ${p.category.name} (${(p.ratings[0]?.rating ?? 0).toFixed(1)}/10)`}</title>
                </circle>
              </a>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {places.slice(0, 12).map((p) => (
          <Link key={p.id} href={`/lieux/${p.slug}`} className="card flex justify-between p-3 hover:border-brand-600">
            <span className="truncate font-medium">{p.name}</span>
            <span className="shrink-0 text-stone-400">{p.zone?.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
