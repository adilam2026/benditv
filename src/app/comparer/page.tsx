import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RatingBadge, ConfidenceBadge } from "@/components/rating";

export const metadata: Metadata = {
  title: "Comparateur",
  description: "Comparez jusqu'à quatre lieux sur la note, la confiance, les prix et les critères.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ lieux?: string; categorie?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const slugs = (sp.lieux ?? "").split(",").filter(Boolean).slice(0, 4);

  const places = slugs.length
    ? await prisma.place.findMany({
        where: { slug: { in: slugs } },
        include: {
          category: true,
          zone: true,
          ratings: { where: { isCurrent: true } },
          criterionScores: { include: { criterion: true } },
          hours: true,
          tags: { include: { tag: true } },
        },
      })
    : [];

  // Sélecteur : lieux de la catégorie demandée ou résultat de recherche
  const candidates = await prisma.place.findMany({
    where: {
      status: "ACTIVE",
      ...(sp.categorie ? { category: { slug: sp.categorie } } : {}),
      ...(sp.q ? { name: { contains: sp.q, mode: "insensitive" } } : {}),
    },
    include: { category: true, zone: true },
    take: 12,
    orderBy: { name: "asc" },
  });

  // Explication des différences entre les deux premiers lieux
  let comparisonNote: string | null = null;
  if (places.length >= 2) {
    const [a, b] = places;
    const findScore = (p: typeof a, slug: string) =>
      p.criterionScores.find((c) => c.criterion.slug === slug)?.score ?? null;
    const parts: string[] = [];
    const kidsA = findScore(a, "accueil-enfants");
    const kidsB = findScore(b, "accueil-enfants");
    if (kidsA !== null && kidsB !== null && Math.abs(kidsA - kidsB) >= 1) {
      parts.push(`${kidsA > kidsB ? a.name : b.name} est plus adapté aux enfants`);
    }
    if (a.avgPricePerPerson && b.avgPricePerPerson && a.avgPricePerPerson !== b.avgPricePerPerson) {
      const cheaper = a.avgPricePerPerson < b.avgPricePerPerson ? a : b;
      parts.push(`${cheaper.name} est généralement moins cher`);
    }
    const speedA = findScore(a, "delai-service");
    const speedB = findScore(b, "delai-service");
    if (speedA !== null && speedB !== null && Math.abs(speedA - speedB) >= 1) {
      parts.push(`${speedA > speedB ? a.name : b.name} sert généralement plus vite`);
    }
    if (parts.length) comparisonNote = parts.join(", tandis que ") + ".";
  }

  const allCriteria = [...new Set(places.flatMap((p) => p.criterionScores.map((c) => c.criterion.name)))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">Comparer des lieux</h1>
      <p className="mb-6 text-sm text-stone-500">Jusqu&apos;à quatre lieux côte à côte, critère par critère.</p>

      <form action="/comparer" method="get" className="mb-4 flex gap-2">
        <input type="hidden" name="lieux" value={slugs.join(",")} />
        <input type="search" name="q" defaultValue={sp.q ?? ""} className="input max-w-sm" placeholder="Chercher un lieu à ajouter" aria-label="Chercher un lieu à ajouter" />
        <button type="submit" className="btn-secondary">Chercher</button>
      </form>
      <div className="mb-6 flex flex-wrap gap-2">
        {candidates.map((c) => {
          const selected = slugs.includes(c.slug);
          const next = selected ? slugs.filter((s) => s !== c.slug) : [...slugs, c.slug].slice(0, 4);
          return (
            <Link
              key={c.id}
              href={`/comparer?lieux=${next.join(",")}${sp.categorie ? `&categorie=${sp.categorie}` : ""}`}
              className={`chip ${selected ? "border-brand-600 bg-brand-50 text-brand-800" : "hover:border-brand-600"}`}
            >
              {selected ? "✓ " : "+ "}{c.name}
            </Link>
          );
        })}
      </div>

      {places.length === 0 ? (
        <div className="card p-8 text-center text-sm text-stone-500">
          Sélectionnez des lieux ci-dessus (ou depuis les résultats de recherche) pour les comparer.
        </div>
      ) : (
        <>
          {comparisonNote && (
            <p className="card mb-4 border-brand-200 bg-brand-50/50 p-4 text-sm text-stone-700">
              <strong>En résumé :</strong> {comparisonNote}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-44 p-2 text-left align-bottom text-xs font-medium text-stone-400">Critère</th>
                  {places.map((p) => (
                    <th key={p.id} className="p-2 text-left">
                      <Link href={`/lieux/${p.slug}`} className="font-bold hover:text-brand-700">{p.name}</Link>
                      <p className="text-xs font-normal text-stone-400">{p.category.name} · {p.zone?.name}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="p-2 text-stone-500">Note publique</td>
                  {places.map((p) => <td key={p.id} className="p-2"><RatingBadge rating={p.ratings[0]?.rating ?? 0} /></td>)}
                </tr>
                <tr>
                  <td className="p-2 text-stone-500">Confiance</td>
                  {places.map((p) => <td key={p.id} className="p-2"><ConfidenceBadge confidence={p.ratings[0]?.confidence ?? "faible"} /></td>)}
                </tr>
                <tr>
                  <td className="p-2 text-stone-500">Expériences</td>
                  {places.map((p) => (
                    <td key={p.id} className="p-2">
                      {p.ratings[0]?.reviewCount ?? 0} <span className="text-xs text-stone-400">dont {p.ratings[0]?.recentCount ?? 0} récentes</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 text-stone-500">Prix moyen / pers.</td>
                  {places.map((p) => <td key={p.id} className="p-2">{p.avgPricePerPerson ? `${p.avgPricePerPerson} MAD` : "—"}</td>)}
                </tr>
                <tr>
                  <td className="p-2 text-stone-500">Équipements</td>
                  {places.map((p) => <td key={p.id} className="p-2 text-xs">{p.tags.map((t) => t.tag.name).join(", ") || "—"}</td>)}
                </tr>
                {allCriteria.map((critName) => (
                  <tr key={critName}>
                    <td className="p-2 text-stone-500">{critName}</td>
                    {places.map((p) => {
                      const cs = p.criterionScores.find((c) => c.criterion.name === critName);
                      const best = Math.max(
                        ...places.map((q) => q.criterionScores.find((c) => c.criterion.name === critName)?.score ?? 0)
                      );
                      return (
                        <td key={p.id} className={`p-2 font-semibold ${cs && cs.score === best && best > 0 ? "text-brand-700" : ""}`}>
                          {cs ? `${cs.score.toFixed(1).replace(".", ",")}/10` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
