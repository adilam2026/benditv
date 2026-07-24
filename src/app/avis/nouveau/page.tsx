import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { ReviewForm, type CriterionView } from "@/components/review-form";
import { proposePlaceAction } from "@/server/actions/review";
import { ActionForm } from "@/components/forms";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Partager une expérience" };

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ lieu?: string; q?: string; creer?: string }>;
}) {
  const { lieu, q, creer } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion`);

  if (lieu) {
    const place = await prisma.place.findUnique({
      where: { slug: lieu },
      include: {
        category: {
          include: {
            criteria: {
              include: { criterion: { include: { options: { orderBy: { sortOrder: "asc" } } } } },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
    if (place) {
      const criteria: CriterionView[] = place.category.criteria.map((cc) => ({
        id: cc.criterion.id,
        slug: cc.criterion.slug,
        name: cc.criterion.name,
        type: cc.criterion.type,
        required: cc.criterion.required || cc.required,
        options: cc.criterion.options.map((o) => ({ value: o.value, label: o.label })),
      }));
      return (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <h1 className="mb-1 text-2xl font-extrabold">Partager une expérience</h1>
          <p className="mb-6 text-sm text-stone-500">
            {place.name} · {place.category.name} — l&apos;avis express se termine en 20 à 40 secondes.
          </p>
          <ReviewForm placeId={place.id} placeName={place.name} criteria={criteria} />
        </div>
      );
    }
  }

  // Étape 1 : choisir ou créer le lieu
  const results = q
    ? await prisma.place.findMany({
        where: { status: "ACTIVE", name: { contains: q, mode: "insensitive" } },
        include: { category: true, zone: true },
        take: 10,
      })
    : [];
  const [categories, zonesList] = await Promise.all([
    prisma.category.findMany({ where: { kind: "category", active: true }, orderBy: { name: "asc" } }),
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">Partager une expérience</h1>
      <p className="mb-6 text-sm text-stone-500">Étape 1 : de quel lieu ou professionnel s&apos;agit-il ?</p>
      <form action="/avis/nouveau" method="get" role="search" className="mb-4 flex gap-2">
        <input
          type="search" name="q" defaultValue={q ?? ""} className="input"
          placeholder="Nom du lieu ou du professionnel" aria-label="Rechercher un lieu"
        />
        <button type="submit" className="btn-primary shrink-0">Chercher</button>
      </form>
      {q && (
        <div className="mb-6 space-y-2">
          {results.map((p) => (
            <Link key={p.id} href={`/avis/nouveau?lieu=${p.slug}`} className="card block p-4 hover:border-brand-600">
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-stone-500">{p.category.name} · {p.zone?.name ?? "Casablanca"}</p>
            </Link>
          ))}
          {results.length === 0 && (
            <div className="card p-4 text-sm text-stone-600">
              Aucun lieu trouvé pour « {q} ».{" "}
              <Link href={`/avis/nouveau?creer=1&q=${encodeURIComponent(q)}`} className="font-medium text-brand-700 hover:underline">
                Créer la fiche
              </Link>
            </div>
          )}
        </div>
      )}
      {(creer === "1" || (q && results.length === 0)) && (
        <div className="card p-6">
          <h2 className="mb-3 font-bold">Proposer un nouveau lieu</h2>
          <ActionForm action={proposePlaceAction} submitLabel="Créer la fiche et continuer">
            <div>
              <label className="label" htmlFor="np-name">Nom</label>
              <input id="np-name" name="name" defaultValue={q ?? ""} required className="input" />
            </div>
            <div>
              <label className="label" htmlFor="np-cat">Catégorie</label>
              <select id="np-cat" name="categorySlug" required className="input">
                <option value="">Choisir…</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="np-zone">Zone</label>
              <select id="np-zone" name="zoneSlug" required className="input">
                <option value="">Choisir…</option>
                {zonesList.map((z) => <option key={z.id} value={z.slug}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="np-addr">Adresse (facultatif)</label>
              <input id="np-addr" name="address" className="input" />
            </div>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
