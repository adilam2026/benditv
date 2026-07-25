import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { RatingBadge, ConfidenceBadge, ScoreBar, TrendBadge } from "@/components/rating";
import {
  FavoriteButton,
  ShareButton,
  AddToListButton,
  ReportDialog,
  QuoteReservationButtons,
  HelpfulButton,
} from "@/components/place-actions";
import { ratingExplanation } from "@/server/services/rating";
import { summarizeExperiences, AI_SUMMARY_DISCLAIMER } from "@/server/integrations/ai";
import { trackEvent } from "@/server/services/audit";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const LEVEL_LABELS: Record<string, string> = {
  DECLARED: "Expérience déclarée",
  COHERENT: "Expérience cohérente",
  VISIT_CONFIRMED: "Visite confirmée",
  TRANSACTION_CONFIRMED: "Achat confirmé",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = await prisma.place.findUnique({ where: { slug }, include: { category: true, zone: true } });
  if (!place) return { title: "Lieu introuvable" };
  return {
    title: `${place.name} — ${place.category.name}${place.zone ? ` à ${place.zone.name}` : ""}`,
    description: place.description ?? undefined,
    alternates: { canonical: `/lieux/${slug}` },
  };
}

function fmtMin(min: number): string {
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

export default async function PlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ avis?: string }>;
}) {
  const { slug } = await params;
  const { avis: reviewFilter } = await searchParams;
  const user = await getCurrentUser();

  const place = await prisma.place.findUnique({
    where: { slug },
    include: {
      category: { include: { criteria: { include: { criterion: true }, orderBy: { sortOrder: "asc" } } } },
      zone: true,
      city: true,
      photos: { where: { hidden: false } },
      hours: { orderBy: { dayOfWeek: "asc" } },
      attributes: { include: { definition: true } },
      services: true,
      prices: true,
      history: { orderBy: { createdAt: "desc" }, take: 8 },
      specialtiesJoin: { include: { specialty: true } },
      tags: { include: { tag: true } },
      ratings: { where: { isCurrent: true }, take: 1 },
      criterionScores: { include: { criterion: true }, orderBy: { score: "desc" } },
      fraudWaves: { where: { status: "detected" } },
      offers: { where: { active: true, endsAt: { gte: new Date() } } },
    },
  });
  if (!place || place.status === "ARCHIVED" || place.status === "MERGED") notFound();

  const snapshot = place.ratings[0] ?? null;
  await trackEvent("click", user?.id, { placeId: place.id });

  // Expériences avec filtres
  const reviewWhere = {
    placeId: place.id,
    status: "PUBLISHED" as const,
    visibility: "PUBLIC" as const,
    ...(reviewFilter === "verifiees" && { verification: { level: { in: ["VISIT_CONFIRMED", "TRANSACTION_CONFIRMED"] as ("VISIT_CONFIRMED" | "TRANSACTION_CONFIRMED")[] } } }),
    ...(reviewFilter === "photos" && { photos: { some: {} } }),
  };
  const reviews = await prisma.review.findMany({
    where: reviewWhere,
    include: {
      user: { include: { profile: { include: { badges: true } } } },
      answers: { include: { criterion: true } },
      verification: true,
      photos: { where: { hidden: false } },
      proResponse: true,
    },
    orderBy:
      reviewFilter === "recentes" ? { visitedAt: "desc" } : [{ helpfulCount: "desc" }, { visitedAt: "desc" }],
    take: 20,
  });

  // Réseau de l'utilisateur : avis séparés (jamais mêlés à la note publique)
  let networkReviews: typeof reviews = [];
  if (user) {
    const follows = await prisma.follow.findMany({
      where: { followerId: user.id, status: "ACCEPTED" },
      select: { followedId: true },
    });
    const ids = follows.map((f) => f.followedId);
    if (ids.length > 0) {
      networkReviews = await prisma.review.findMany({
        where: { placeId: place.id, userId: { in: ids }, status: "PUBLISHED", visibility: { in: ["PUBLIC", "NETWORK"] } },
        include: {
          user: { include: { profile: { include: { badges: true } } } },
          answers: { include: { criterion: true } },
          verification: true,
          photos: { where: { hidden: false } },
          proResponse: true,
        },
        take: 5,
      });
    }
  }

  const isFavorite = user
    ? !!(await prisma.favorite.findUnique({ where: { userId_placeId: { userId: user.id, placeId: place.id } } }))
    : false;
  const userLists = user
    ? await prisma.list.findMany({ where: { ownerId: user.id }, select: { id: true, title: true } })
    : [];

  const strengths = place.criterionScores.filter((c) => c.score >= 7.5 && c.count >= 3).slice(0, 4);
  const weaknesses = [...place.criterionScores].filter((c) => c.score <= 5.5 && c.count >= 3).slice(-3);
  const bestForContexts = [...new Set(reviews.filter((r) => r.context).map((r) => r.context as string))].slice(0, 3);
  const summary = summarizeExperiences({
    placeName: place.name,
    reviewCount: snapshot?.reviewCount ?? 0,
    strengths: strengths.map((s) => s.criterion.name.toLowerCase()),
    weaknesses: weaknesses.map((w) => w.criterion.name.toLowerCase()),
    bestFor: bestForContexts.map((c) => (c === "famille" ? "les sorties en famille" : c === "couple" ? "les sorties en couple" : c === "amis" ? "les sorties entre amis" : c === "travail" ? "les repas de travail" : "les visites en solo")),
  });

  const reviewAvg = (r: (typeof reviews)[number]) => {
    const scored = r.answers.filter((a) => a.score !== null);
    return scored.length ? scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length : null;
  };
  const networkAvg =
    networkReviews.length > 0
      ? networkReviews.map(reviewAvg).filter((x): x is number => x !== null)
      : [];
  const networkMean = networkAvg.length ? networkAvg.reduce((a, b) => a + b, 0) / networkAvg.length : null;

  const communityPhotos = place.photos.filter((p) => p.source === "community");
  const proPhotos = place.photos.filter((p) => p.source === "professional");
  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/lieux/${place.slug}`;
  const isHealth = ["pediatre", "gastro-enterologue", "orl", "dentiste", "pharmacie", "laboratoire", "clinique"].includes(place.category.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* En-tête */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-stone-500">
              <Link href={`/categories/${place.category.slug}`} className="hover:text-brand-700">{place.category.name}</Link>
              {place.zone && <> · <Link href={`/villes/casablanca?zone=${place.zone.slug}`} className="hover:text-brand-700">{place.zone.name}</Link></>} · {place.city.name}
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-extrabold">
              {place.name}
              {place.verified && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800" title="Informations vérifiées par la plateforme">
                  ✓ Informations vérifiées
                </span>
              )}
              {place.claimed && !place.verified && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">Fiche revendiquée</span>
              )}
            </h1>
            <p className="mt-1 text-sm text-stone-500">{place.address}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <RatingBadge rating={snapshot?.rating ?? 0} size="lg" />
              <div>
                <ConfidenceBadge confidence={snapshot?.confidence ?? "faible"} />
                <p className="mt-1 text-xs text-stone-500">
                  {snapshot?.reviewCount ?? 0} expérience{(snapshot?.reviewCount ?? 0) > 1 ? "s" : ""} ·{" "}
                  {snapshot?.verifiedCount ?? 0} vérifiée{(snapshot?.verifiedCount ?? 0) > 1 ? "s" : ""}{" "}
                  <TrendBadge trend={snapshot?.trend ?? 0} />
                </p>
              </div>
            </div>
            {snapshot && <p className="mt-2 max-w-xl text-xs text-stone-500">{ratingExplanation({ ...snapshot, confidence: snapshot.confidence as "faible" | "moyenne" | "elevee" | "tres-elevee", effectiveCount: 0, rawAverage: snapshot.rawAverage })}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <QuoteReservationButtons
              placeId={place.id}
              loggedIn={!!user}
              showReservation={place.tags.some((t) => t.tag.slug === "reservation")}
              showQuote={!!place.organizationId}
            />
            <FavoriteButton placeId={place.id} path={`/lieux/${place.slug}`} isFavorite={isFavorite} loggedIn={!!user} />
            <AddToListButton placeId={place.id} path={`/lieux/${place.slug}`} lists={userLists} loggedIn={!!user} />
            <ShareButton title={place.name} url={pageUrl} />
            <ReportDialog targetKind="place" placeId={place.id} loggedIn={!!user} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {place.phone && <a href={`tel:${place.phone}`} className="chip hover:border-brand-600">📞 {place.phone}</a>}
          {place.whatsapp && (
            <a href={`https://wa.me/${place.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="chip hover:border-brand-600">
              💬 WhatsApp
            </a>
          )}
          {place.website && <a href={place.website} target="_blank" rel="noopener noreferrer" className="chip hover:border-brand-600">🌐 Site web</a>}
          <a
            href={`https://www.openstreetmap.org/?query=${encodeURIComponent(place.address ?? place.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="chip hover:border-brand-600"
          >
            🗺️ Itinéraire
          </a>
          <Link href={`/avis/nouveau?lieu=${place.slug}`} className="chip border-brand-600 bg-brand-50 font-semibold text-brand-800 hover:bg-brand-100">
            ✍️ Partager mon expérience
          </Link>
        </div>
      </div>

      {place.fraudWaves.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ Une activité inhabituelle a été détectée sur cette fiche. Certaines contributions récentes ne sont pas
          encore intégrées à la note, le temps des vérifications.
        </div>
      )}

      {/* Galerie */}
      {place.photos.length > 0 && (
        <section className="mt-6" aria-label="Galerie">
          <h2 className="section-title mb-3">Photos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {communityPhotos.slice(0, 2).map((photo) => (
              <figure key={photo.id} className="relative">
                <div className="relative h-32 overflow-hidden rounded-xl">
                  <Image src={photo.url} alt={photo.caption ?? `Photo communautaire de ${place.name}`} fill className="object-cover" unoptimized />
                </div>
                <figcaption className="mt-1 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Communauté · {photo.createdAt.toLocaleDateString("fr-FR")}</span>
                  <ReportDialog targetKind="photo" placeId={place.id} loggedIn={!!user} compact />
                </figcaption>
              </figure>
            ))}
            {proPhotos.slice(0, 2).map((photo) => (
              <figure key={photo.id} className="relative">
                <div className="relative h-32 overflow-hidden rounded-xl">
                  <Image src={photo.url} alt={photo.caption ?? `Photo du professionnel ${place.name}`} fill className="object-cover" unoptimized />
                </div>
                <figcaption className="mt-1 text-[11px] text-stone-400">Professionnel · {photo.createdAt.toLocaleDateString("fr-FR")}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Synthèse */}
          <section className="card p-5">
            <h2 className="section-title mb-2">Synthèse</h2>
            {place.description && <p className="text-sm text-stone-600">{place.description}</p>}
            <p className="mt-2 text-sm text-stone-700">{summary}</p>
            <p className="mt-1 text-xs italic text-stone-400">{AI_SUMMARY_DISCLAIMER}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {place.avgPricePerPerson && <span className="chip">💰 ≈ {place.avgPricePerPerson} MAD / personne</span>}
              {place.specialtiesJoin.map((s) => <span key={s.id} className="chip">⭐ {s.specialty.name}</span>)}
              {place.tags.map((t) => <span key={t.id} className="chip">{t.tag.name}</span>)}
            </div>
          </section>

          {/* Notes par critère */}
          <section className="card p-5">
            <h2 className="section-title mb-1">Notes par critère</h2>
            <p className="mb-3 text-xs text-stone-500">
              Note publique identique pour tous · dispersion {snapshot?.dispersion.toFixed(2).replace(".", ",") ?? "—"} ·{" "}
              {snapshot?.recentCount ?? 0} expérience{(snapshot?.recentCount ?? 0) > 1 ? "s" : ""} sur 12 mois
              {snapshot && snapshot.excludedCount > 0 && ` · ${snapshot.excludedCount} contribution${snapshot.excludedCount > 1 ? "s" : ""} écartée${snapshot.excludedCount > 1 ? "s" : ""} du calcul`}
            </p>
            {place.criterionScores.length === 0 ? (
              <p className="text-sm text-stone-500">Pas encore de critères notés pour ce lieu.</p>
            ) : (
              <div className="space-y-2">
                {place.criterionScores.map((cs) => (
                  <ScoreBar key={cs.id} label={cs.criterion.name} score={cs.score} count={cs.count} />
                ))}
              </div>
            )}
            {isHealth && (
              <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
                Les critères santé portent uniquement sur l&apos;organisation et l&apos;accueil. La plateforme ne note
                jamais l&apos;efficacité médicale et n&apos;établit aucun classement médical.
              </p>
            )}
          </section>

          {/* Expériences */}
          <section aria-label="Expériences">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title">Expériences ({reviews.length})</h2>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {([["", "Plus utiles"], ["recentes", "Plus récentes"], ["verifiees", "Vérifiées"], ["photos", "Avec photos"]] as const).map(([key, label]) => (
                  <Link
                    key={key}
                    href={`/lieux/${place.slug}${key ? `?avis=${key}` : ""}#experiences`}
                    className={`chip ${(reviewFilter ?? "") === key ? "border-brand-600 bg-brand-50 text-brand-800" : "hover:border-brand-600"}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div id="experiences" className="space-y-4">
              {reviews.length === 0 && (
                <div className="card p-6 text-center text-sm text-stone-500">
                  Aucune expérience pour ce filtre.{" "}
                  <Link href={`/avis/nouveau?lieu=${place.slug}`} className="font-medium text-brand-700 hover:underline">
                    Soyez le premier à contribuer.
                  </Link>
                </div>
              )}
              {reviews.map((review) => {
                const avg = reviewAvg(review);
                return (
                  <article key={review.id} className="card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {review.user.profile?.displayName ?? review.user.name}
                          {review.user.profile?.badges.slice(0, 2).map((b) => (
                            <span key={b.id} className="ml-1.5 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">{b.label}</span>
                          ))}
                        </p>
                        <p className="text-xs text-stone-400">
                          Visite : {review.visitedAt.toLocaleDateString("fr-FR")}
                          {review.context && ` · ${review.context}`}
                          {review.groupType && ` · ${review.groupType}`}
                          {review.pricePaid ? ` · ${review.pricePaid} MAD payés` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {avg !== null && <RatingBadge rating={avg} />}
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500" title="Niveau de vérification">
                          {LEVEL_LABELS[review.verification?.level ?? "DECLARED"]}
                        </span>
                      </div>
                    </div>
                    {review.comment && <p className="mt-2 text-sm text-stone-700">{review.comment}</p>}
                    {review.tip && <p className="mt-1 text-sm text-brand-800">💡 {review.tip}</p>}
                    {review.photos.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {review.photos.map((photo) => (
                          <div key={photo.id} className="relative h-16 w-24 overflow-hidden rounded-lg">
                            <Image src={photo.url} alt="Photo jointe à l'expérience (démonstration)" fill className="object-cover" unoptimized />
                          </div>
                        ))}
                      </div>
                    )}
                    {review.proResponse && (
                      <div className="mt-3 rounded-xl border-l-4 border-brand-600 bg-brand-50/60 p-3">
                        <p className="text-xs font-bold text-brand-800">Réponse du professionnel</p>
                        <p className="mt-1 text-sm text-stone-700">{review.proResponse.body}</p>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-4">
                      <HelpfulButton reviewId={review.id} path={`/lieux/${place.slug}`} count={review.helpfulCount} loggedIn={!!user} />
                      <ReportDialog targetKind="review" reviewId={review.id} loggedIn={!!user} compact />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Réseau */}
          <section className="card p-5">
            <h2 className="mb-2 font-bold">Votre réseau</h2>
            {!user ? (
              <p className="text-sm text-stone-500">
                <Link href="/connexion" className="text-brand-700 hover:underline">Connectez-vous</Link> pour voir les avis
                de vos proches sur ce lieu.
              </p>
            ) : networkReviews.length === 0 ? (
              <p className="text-sm text-stone-500">Personne de votre réseau n&apos;a encore testé ce lieu.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-stone-700">
                  <strong>{networkReviews.length}</strong> personne{networkReviews.length > 1 ? "s" : ""} de votre réseau{" "}
                  {networkReviews.length > 1 ? "l'ont" : "l'a"} testé
                  {networkMean !== null && (
                    <> — note moyenne du réseau : <strong>{networkMean.toFixed(1).replace(".", ",")}/10</strong></>
                  )}
                </p>
                <p className="text-xs text-stone-400">
                  Ces avis personnalisent votre classement, mais ne modifient jamais la note publique.
                </p>
                {networkReviews.map((r) => (
                  <div key={r.id} className="rounded-xl bg-stone-50 p-3 text-sm">
                    <p className="font-semibold">{r.user.profile?.displayName ?? r.user.name}</p>
                    {r.comment && <p className="mt-0.5 text-stone-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Informations pratiques */}
          <section className="card p-5">
            <h2 className="mb-2 font-bold">Informations pratiques</h2>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Horaires</h3>
            <ul className="mt-1 space-y-0.5 text-sm text-stone-600">
              {place.hours.length === 0 && <li>Horaires non renseignés</li>}
              {place.hours.map((h) => (
                <li key={h.id} className="flex justify-between">
                  <span>{DAYS[h.dayOfWeek]}</span>
                  <span>{fmtMin(h.openMin)} – {fmtMin(h.closeMin)}</span>
                </li>
              ))}
            </ul>
            {place.attributes.length > 0 && (
              <>
                <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Équipements et services</h3>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {place.attributes.map((attr) => (
                    <li key={attr.id} className="chip" title={`Source : ${attr.source === "professional" ? "déclaré par le professionnel" : attr.source === "platform" ? "vérifié par la plateforme" : "confirmé par la communauté"}`}>
                      {attr.definition.name}
                      {attr.source === "professional" ? " · pro" : attr.source === "platform" ? " · ✓" : " · commu."}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {place.services.length > 0 && (
              <>
                <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Prestations</h3>
                <ul className="mt-1 space-y-1 text-sm text-stone-600">
                  {place.services.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>{s.name}</span>
                      {s.price != null && <span>{s.price} MAD</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Historique */}
          {place.history.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-2 font-bold">Historique de la fiche</h2>
              <ul className="space-y-2 text-sm text-stone-600">
                {place.history.map((h) => (
                  <li key={h.id}>
                    <span className="text-xs text-stone-400">{h.createdAt.toLocaleDateString("fr-FR")}</span> — {h.detail}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
