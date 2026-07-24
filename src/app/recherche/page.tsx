import type { Metadata } from "next";
import Link from "next/link";
import { searchPlaces } from "@/server/services/search";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { PlaceCard } from "@/components/place-card";
import { trackEvent } from "@/server/services/audit";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Recherchez un lieu, un professionnel ou un service en langage naturel.",
};

type SP = {
  q?: string;
  categorie?: string;
  zone?: string;
  budget?: string;
  tri?: string;
  enfants?: string;
  verifie?: string;
  ouvert?: string;
  note?: string;
  attribut?: string | string[];
  quand?: string;
};

function buildUrl(sp: SP, patch: Partial<Record<string, string | null>>): string {
  const params = new URLSearchParams();
  const merged: Record<string, string | string[] | undefined> = { ...sp, ...Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== null) as [string, string][]
  ) };
  for (const key of Object.keys(patch)) if (patch[key] === null) delete merged[key];
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
    else params.set(k, v);
  }
  return `/recherche?${params.toString()}`;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const user = await getCurrentUser();

  const attributes = Array.isArray(sp.attribut) ? sp.attribut : sp.attribut ? [sp.attribut] : [];
  const { parsed, results } = await searchPlaces(
    q,
    {
      categorySlug: sp.categorie || undefined,
      zoneSlug: sp.zone || undefined,
      budgetMax: sp.budget ? parseInt(sp.budget, 10) : undefined,
      sort: (sp.tri as "pertinence" | "note" | "recents" | "prix") || "pertinence",
      withChildren: sp.enfants === "1" ? true : undefined,
      verifiedOnly: sp.verifie === "1",
      openNow: sp.ouvert === "1",
      minRating: sp.note ? parseFloat(sp.note) : undefined,
      attributes,
    },
    user?.id ?? null
  );

  if (q) {
    await prisma.searchLog.create({
      data: {
        rawQuery: q,
        userId: user?.id ?? null,
        parsed: JSON.parse(JSON.stringify(parsed)),
        resultCount: results.length,
      },
    });
    await trackEvent("search", user?.id, { q, count: results.length });
  }

  const effectiveCategory = sp.categorie ?? parsed.categorySlug;
  const effectiveZone = sp.zone ?? parsed.zoneSlug;
  const effectiveBudget = sp.budget ?? (parsed.budgetMaxPerPerson ? String(parsed.budgetMaxPerPerson) : null);

  const [category, zone, allZones] = await Promise.all([
    effectiveCategory ? prisma.category.findUnique({ where: { slug: effectiveCategory } }) : null,
    effectiveZone ? prisma.zone.findUnique({ where: { slug: effectiveZone } }) : null,
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
  ]);

  const detectedChips: { label: string; removeKey: string }[] = [];
  if (category) detectedChips.push({ label: `Catégorie : ${category.name}`, removeKey: "categorie" });
  if (zone) detectedChips.push({ label: `Zone : ${zone.name}`, removeKey: "zone" });
  if (effectiveBudget) detectedChips.push({ label: `Budget ≤ ${effectiveBudget} MAD/pers.`, removeKey: "budget" });
  if (parsed.withChildren || sp.enfants === "1") detectedChips.push({ label: "Avec enfants", removeKey: "enfants" });
  for (const attr of [...new Set([...parsed.attributes, ...attributes])]) {
    detectedChips.push({ label: attr.replace(/-/g, " "), removeKey: `attr:${attr}` });
  }
  if (parsed.adults) detectedChips.push({ label: `${parsed.adults} adulte${parsed.adults > 1 ? "s" : ""}`, removeKey: "" });
  if (parsed.children) detectedChips.push({ label: `${parsed.children} enfant${parsed.children > 1 ? "s" : ""}`, removeKey: "" });

  const needsWhen = !parsed.when && !sp.quand && q.length > 0 && results.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <form action="/recherche" method="get" role="search" className="mb-4">
        <div className="flex overflow-hidden rounded-2xl border-2 border-brand-700 bg-white shadow focus-within:ring-2 focus-within:ring-brand-600/30">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Que cherchez-vous aujourd'hui ?"
            aria-label="Que cherchez-vous aujourd'hui ?"
            className="min-w-0 flex-1 px-4 py-3 outline-none"
          />
          <button type="submit" className="bg-brand-700 px-5 font-semibold text-white hover:bg-brand-800">
            Rechercher
          </button>
        </div>
      </form>

      {detectedChips.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2" aria-label="Filtres détectés">
          <span className="text-xs font-medium text-stone-500">Filtres détectés :</span>
          {detectedChips.map((chip, i) =>
            chip.removeKey ? (
              <Link
                key={i}
                href={
                  chip.removeKey.startsWith("attr:")
                    ? buildUrl({ ...sp, attribut: attributes.filter((a) => a !== chip.removeKey.slice(5)) as string[] }, {})
                    : buildUrl(sp, { [chip.removeKey]: null, q: chip.removeKey === "categorie" || chip.removeKey === "zone" || chip.removeKey === "budget" ? "" : q })
                }
                className="chip hover:border-red-300 hover:text-red-700"
                title="Retirer ce filtre"
              >
                {chip.label} ✕
              </Link>
            ) : (
              <span key={i} className="chip">{chip.label}</span>
            )
          )}
        </div>
      )}

      {needsWhen && (
        <div className="card mb-4 flex flex-wrap items-center gap-2 border-brand-200 bg-brand-50/50 p-3 text-sm">
          <span className="font-medium">Vous cherchez cet endroit pour aujourd&apos;hui, ce week-end ou une autre date ?</span>
          {["aujourd'hui", "ce week-end", "autre date"].map((w) => (
            <Link key={w} href={buildUrl(sp, { quand: w })} className="chip hover:border-brand-600">{w}</Link>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <details className="relative">
          <summary className="btn-secondary cursor-pointer list-none">Filtres</summary>
          <form action="/recherche" method="get" className="absolute left-0 top-12 z-30 w-72 space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl">
            <input type="hidden" name="q" value={q} />
            <div>
              <label className="label" htmlFor="f-zone">Zone</label>
              <select id="f-zone" name="zone" defaultValue={effectiveZone ?? ""} className="input">
                <option value="">Toutes les zones</option>
                {allZones.map((z) => <option key={z.id} value={z.slug}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-budget">Budget max. par personne (MAD)</label>
              <input id="f-budget" name="budget" type="number" min={0} defaultValue={effectiveBudget ?? ""} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="f-note">Note publique minimale</label>
              <select id="f-note" name="note" defaultValue={sp.note ?? ""} className="input">
                <option value="">Indifférent</option>
                <option value="7">7 et plus</option>
                <option value="8">8 et plus</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enfants" value="1" defaultChecked={sp.enfants === "1"} /> Adapté aux enfants</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="verifie" value="1" defaultChecked={sp.verifie === "1"} /> Avec visites vérifiées</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ouvert" value="1" defaultChecked={sp.ouvert === "1"} /> Ouvert maintenant</label>
            <button type="submit" className="btn-primary w-full">Appliquer</button>
          </form>
        </details>
        <span className="text-stone-400">|</span>
        <span className="text-stone-500">Trier :</span>
        {(
          [["pertinence", "Pertinence"], ["note", "Note publique"], ["recents", "Récents"], ["prix", "Prix"]] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={buildUrl(sp, { tri: key })}
            className={`chip ${(sp.tri ?? "pertinence") === key ? "border-brand-600 bg-brand-50 text-brand-800" : "hover:border-brand-600"}`}
          >
            {label}
          </Link>
        ))}
        <Link href={`/comparer${effectiveCategory ? `?categorie=${effectiveCategory}` : ""}`} className="chip hover:border-brand-600">⚖️ Comparer</Link>
      </div>

      <p className="mb-3 text-sm text-stone-500" role="status">
        {results.length} résultat{results.length > 1 ? "s" : ""}
        {q && <> pour « {q} »</>}
        {user ? " — classement personnalisé selon votre profil et votre réseau (la note publique reste identique pour tous)." : " — connectez-vous pour un classement personnalisé selon votre réseau."}
      </p>

      {results.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold">Aucun résultat pour cette recherche</p>
          <p className="mt-2 text-sm text-stone-500">
            Essayez d&apos;élargir la zone ou de retirer un filtre. Vous connaissez une bonne adresse qui manque ?
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/questions/nouvelle" className="btn-primary">Poser la question à la communauté</Link>
            <Link href="/avis/nouveau" className="btn-secondary">Proposer un lieu</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((item) => <PlaceCard key={item.id} item={item} showCompatibility={!!q || detectedChips.length > 0} />)}
        </div>
      )}
    </div>
  );
}
