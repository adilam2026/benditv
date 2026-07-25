import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { APP_CONFIG } from "@/config/app";
import { RatingBadge, ConfidenceBadge } from "@/components/rating";

const EXAMPLES = [
  "Je cherche un restaurant calme à Dar Bouazza pour dîner avec deux enfants",
  "Où manger de bonnes sardines grillées ?",
  "Je cherche un pédiatre de confiance près de chez moi",
  "Quel salon de coiffure fait une bonne coloration et un bon lissage ?",
  "Je cherche une salle de sport propre et à taille humaine",
  "Quel traiteur peut organiser une table de 12 personnes avec service ?",
];

export default async function HomePage() {
  const [universes, topPlaces, questions, stats] = await Promise.all([
    prisma.category.findMany({ where: { kind: "universe" }, orderBy: { sortOrder: "asc" } }),
    prisma.place.findMany({
      where: { status: "ACTIVE", ratings: { some: { isCurrent: true, confidence: { in: ["elevee", "tres-elevee"] } } } },
      include: { category: true, zone: true, ratings: { where: { isCurrent: true } } },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.question.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { _count: { select: { answers: true } } },
    }),
    Promise.all([prisma.place.count(), prisma.review.count({ where: { status: "PUBLISHED" } })]),
  ]);
  const [placeCount, reviewCount] = stats;
  const sortedTop = topPlaces
    .map((p) => ({ ...p, rating: p.ratings[0]?.rating ?? 0, confidence: p.ratings[0]?.confidence ?? "faible" }))
    .sort((a, b) => b.rating - a.rating);

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-transparent px-4 pb-10 pt-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold leading-tight text-stone-900 sm:text-4xl">
            {APP_CONFIG.slogan.replace(".", "")}
          </h1>
          <p className="mt-3 text-stone-500">
            {placeCount} lieux et professionnels · {reviewCount} expériences structurées · notes expliquées, résistantes aux faux avis.
          </p>
          <form action="/recherche" method="get" role="search" className="mt-7">
            <div className="flex overflow-hidden rounded-2xl border-2 border-brand-700 bg-white shadow-lg focus-within:ring-2 focus-within:ring-brand-600/30">
              <input
                type="search"
                name="q"
                placeholder="Que cherchez-vous aujourd'hui ?"
                aria-label="Que cherchez-vous aujourd'hui ?"
                className="min-w-0 flex-1 px-4 py-3.5 text-base outline-none"
              />
              <button type="submit" className="bg-brand-700 px-5 font-semibold text-white transition hover:bg-brand-800">
                Rechercher
              </button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {EXAMPLES.slice(0, 4).map((ex) => (
              <Link key={ex} href={`/recherche?q=${encodeURIComponent(ex)}`} className="chip hover:border-brand-600 hover:text-brand-700">
                {ex.length > 52 ? ex.slice(0, 52) + "…" : ex}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="section-title mb-4">Explorer par univers</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {universes.map((u) => (
            <Link key={u.id} href={`/categories/${u.slug}`} className="card flex items-center gap-3 p-4 transition hover:border-brand-600">
              <span className="text-2xl" aria-hidden>{u.icon}</span>
              <span className="text-sm font-semibold">{u.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Notes fiables du moment</h2>
          <Link href="/recherche" className="text-sm font-medium text-brand-700 hover:underline">Tout voir</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTop.map((p) => (
            <Link key={p.id} href={`/lieux/${p.slug}`} className="card p-4 transition hover:border-brand-600">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-xs text-stone-500">{p.category.name} · {p.zone?.name ?? "Casablanca"}</p>
                </div>
                <RatingBadge rating={p.rating} />
              </div>
              <div className="mt-2"><ConfidenceBadge confidence={p.confidence} /></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-6">
            <h2 className="mb-2 font-bold">🔎 Une note, des faits</h2>
            <p className="text-sm text-stone-600">
              Chaque expérience répond à des questions concrètes : propreté, délais, prix payé, accueil des enfants…
              La note publique est calculée statistiquement, jamais achetée.
            </p>
            <Link href="/confiance" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
              Comprendre la notation
            </Link>
          </div>
          <div className="card p-6">
            <h2 className="mb-2 font-bold">🛡️ Résistant aux faux avis</h2>
            <p className="text-sm text-stone-600">
              Vagues suspectes, textes copiés, comptes jetables : nos contrôles écartent les contributions douteuses
              du calcul et l&apos;affichent publiquement.
            </p>
            <Link href="/anti-fraude" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
              Notre dispositif anti-fraude
            </Link>
          </div>
          <div className="card p-6">
            <h2 className="mb-2 font-bold">👥 Votre réseau compte</h2>
            <p className="text-sm text-stone-600">
              Les avis de vos proches personnalisent l&apos;ordre de vos résultats — sans jamais modifier la note
              publique, identique pour tous.
            </p>
            <Link href="/fonctionnement" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
              Comment ça marche
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Questions de la communauté</h2>
          <Link href="/questions" className="text-sm font-medium text-brand-700 hover:underline">Toutes les questions</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {questions.map((q) => (
            <Link key={q.id} href={`/questions/${q.id}`} className="card p-4 transition hover:border-brand-600">
              <p className="font-semibold">{q.title}</p>
              <p className="mt-2 text-xs text-stone-500">
                {q._count.answers} réponse{q._count.answers > 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
