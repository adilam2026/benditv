// Recherche + classement personnalisé.
// La note publique est identique pour tous ; la personnalisation
// (réseau, préférences, compatibilité) n'influence que l'ordre
// d'affichage et les explications — jamais la note.

import { prisma } from "@/lib/prisma";
import { parseQuery, type ParsedQuery } from "./classification";
import { CONFIDENCE_LABELS } from "./rating";
import type { Prisma } from "@prisma/client";

export type SearchFilters = {
  categorySlug?: string | null;
  zoneSlug?: string | null;
  citySlug?: string | null;
  budgetMax?: number | null;
  attributes?: string[];
  withChildren?: boolean;
  minRating?: number | null;
  verifiedOnly?: boolean;
  openNow?: boolean;
  sort?: "pertinence" | "note" | "recents" | "prix";
};

export type SearchResultItem = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  zoneName: string | null;
  cityName: string;
  photoUrl: string | null;
  priceLevel: number | null;
  avgPricePerPerson: number | null;
  rating: number;
  confidence: string;
  confidenceLabel: string;
  reviewCount: number;
  verifiedCount: number;
  recentCount: number;
  trend: number;
  compatibility: number; // 0..100 — personnalisé, distinct de la note
  strengths: string[];
  caution: string | null;
  networkCount: number;
  networkAvg: number | null;
  reason: string;
  sponsored: boolean;
  openNow: boolean | null;
  hasWave: boolean;
  attributes: string[];
};

const STRENGTH_LABELS: Record<string, string> = {
  proprete: "propreté élevée",
  accueil: "accueil apprécié",
  "qualite-plats": "plats de qualité",
  "delai-service": "service rapide",
  "rapport-qualite-prix": "bon rapport qualité-prix",
  calme: "ambiance calme",
  "accueil-enfants": "bien adapté aux enfants",
  parking: "parking disponible",
  toilettes: "toilettes propres",
  ponctualite: "ponctualité",
  qualite: "travail de qualité",
  communication: "bonne communication",
  "respect-devis": "devis respecté",
  securite: "sécurité",
  encadrement: "bon encadrement",
  "clarte-explications": "explications claires",
  organisation: "bonne organisation",
  "transparence-tarifs": "tarifs transparents",
  proprete_salle: "propreté élevée",
  accessibilite: "bonne accessibilité",
};

function minutesNow(): { day: number; minutes: number } {
  const now = new Date();
  return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
}

export async function searchPlaces(
  rawQuery: string,
  filters: SearchFilters = {},
  userId: string | null = null,
  limit = 30
): Promise<{ parsed: ParsedQuery; results: SearchResultItem[] }> {
  const parsed = parseQuery(rawQuery || "");

  const categorySlug = filters.categorySlug ?? parsed.categorySlug;
  const zoneSlug = filters.zoneSlug ?? parsed.zoneSlug;
  const citySlug = filters.citySlug ?? parsed.citySlug;
  const budgetMax = filters.budgetMax ?? parsed.budgetMaxPerPerson;
  const wantedAttributes = [
    ...new Set([...(filters.attributes ?? []), ...parsed.attributes]),
  ];
  const withChildren = filters.withChildren ?? parsed.withChildren;

  const where: Prisma.PlaceWhereInput = { status: "ACTIVE" };
  if (categorySlug) {
    where.category = {
      OR: [{ slug: categorySlug }, { parent: { slug: categorySlug } }],
    };
  }
  if (zoneSlug) where.zone = { slug: zoneSlug };
  if (citySlug && !zoneSlug) where.city = { slug: citySlug };
  if (parsed.specialty) {
    where.specialtiesJoin = { some: { specialty: { slug: parsed.specialty } } };
  }
  if (filters.minRating) {
    where.ratings = { some: { isCurrent: true, rating: { gte: filters.minRating } } };
  }

  // Sans catégorie détectée mais avec des mots-clés : recherche textuelle
  if (!categorySlug && !parsed.specialty && rawQuery.trim()) {
    const kw = parsed.keywords.filter((k) => k.length >= 3).slice(0, 5);
    if (kw.length > 0) {
      where.OR = kw.flatMap((k) => [
        { name: { contains: k, mode: "insensitive" as const } },
        { description: { contains: k, mode: "insensitive" as const } },
        { category: { name: { contains: k, mode: "insensitive" as const } } },
      ]);
    }
  }

  const places = await prisma.place.findMany({
    where,
    include: {
      category: true,
      zone: true,
      city: true,
      photos: { where: { hidden: false }, take: 1, orderBy: { createdAt: "asc" } },
      ratings: { where: { isCurrent: true }, take: 1 },
      criterionScores: { include: { criterion: true } },
      tags: { include: { tag: true } },
      hours: true,
      fraudWaves: { where: { status: "detected" } },
      sponsored: { where: { active: true, endsAt: { gte: new Date() } } },
    },
    take: 120,
  });

  // Réseau de l'utilisateur (influence uniquement le classement personnalisé)
  let networkUserIds: string[] = [];
  if (userId) {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId, status: "ACCEPTED" },
      select: { followedId: true },
    });
    networkUserIds = follows.map((f) => f.followedId);
  }
  const networkReviews =
    networkUserIds.length > 0
      ? await prisma.review.groupBy({
          by: ["placeId"],
          where: {
            userId: { in: networkUserIds },
            status: "PUBLISHED",
            placeId: { in: places.map((p) => p.id) },
          },
          _count: { id: true },
        })
      : [];
  const networkAvgRows =
    networkUserIds.length > 0
      ? await prisma.reviewCriterionAnswer.groupBy({
          by: ["reviewId"],
          where: {
            review: {
              userId: { in: networkUserIds },
              status: "PUBLISHED",
              placeId: { in: places.map((p) => p.id) },
            },
          },
          _avg: { score: true },
        })
      : [];
  void networkAvgRows;
  const networkCountByPlace = new Map(networkReviews.map((r) => [r.placeId, r._count.id]));

  const prefs = userId
    ? await prisma.userPreference.findUnique({ where: { userId } })
    : null;

  const { day, minutes } = minutesNow();

  const scored: SearchResultItem[] = places.map((p) => {
    const snapshot = p.ratings[0];
    const rating = snapshot?.rating ?? 0;
    const tagSlugs = p.tags.map((t) => t.tag.slug);

    // ── Score de compatibilité (personnalisé) ──
    let compat = 45;
    const reasons: string[] = [];

    if (categorySlug) {
      compat += 12;
    }
    if (zoneSlug && p.zone?.slug === zoneSlug) {
      compat += 12;
      reasons.push(`situé à ${p.zone.name}`);
    }
    if (budgetMax && p.avgPricePerPerson) {
      if (p.avgPricePerPerson <= budgetMax) {
        compat += 10;
        reasons.push(`budget moyen d'environ ${p.avgPricePerPerson} MAD par personne, dans votre budget`);
      } else {
        compat -= 18;
      }
    }
    let matchedAttrs = 0;
    for (const attr of wantedAttributes) {
      if (tagSlugs.includes(attr)) {
        matchedAttrs++;
        const label = STRENGTH_LABELS[attr] ?? attr.replace(/-/g, " ");
        reasons.push(label);
      }
    }
    if (wantedAttributes.length > 0) {
      compat += Math.round((matchedAttrs / wantedAttributes.length) * 16) - 6;
    }

    const kidScore = p.criterionScores.find((c) => c.criterion.slug === "accueil-enfants");
    if (withChildren) {
      if (kidScore && kidScore.score >= 7) {
        compat += 10;
        reasons.push("note élevée sur l'accueil des enfants");
      } else if (kidScore && kidScore.score < 5) {
        compat -= 10;
      }
    }

    // Note publique et confiance (facteurs communs, non personnalisés)
    compat += Math.round((rating - 6.5) * 3);
    compat += Math.round((snapshot?.confidenceScore ?? 0) * 8);
    if (snapshot && snapshot.recentCount > 5) compat += 3;

    // Affinité réseau — classement uniquement
    const networkCount = networkCountByPlace.get(p.id) ?? 0;
    if (networkCount > 0) {
      compat += Math.min(8, networkCount * 2);
      reasons.push(
        `${networkCount} personne${networkCount > 1 ? "s" : ""} de votre réseau ${networkCount > 1 ? "l'ont" : "l'a"} testé`
      );
    }

    // Préférences personnelles
    if (prefs?.favoriteCategories?.includes(p.category.slug)) compat += 3;
    if (prefs?.budgetLevel && p.priceLevel && p.priceLevel <= prefs.budgetLevel) compat += 2;

    // Ouverture
    let openNow: boolean | null = null;
    if (p.hours.length > 0) {
      openNow = p.hours.some(
        (h) => h.dayOfWeek === day && h.openMin <= minutes && h.closeMin >= minutes
      );
      if (openNow) compat += 2;
    }

    compat = Math.max(5, Math.min(99, compat));

    // Points forts / vigilance à partir des scores par critère
    const sortedCrit = [...p.criterionScores].sort((a, b) => b.score - a.score);
    const strengths = sortedCrit
      .filter((c) => c.score >= 7.5 && c.count >= 3)
      .slice(0, 3)
      .map((c) => STRENGTH_LABELS[c.criterion.slug] ?? c.criterion.name.toLowerCase());
    const weak = sortedCrit.filter((c) => c.score <= 5.5 && c.count >= 3).pop();
    const caution = weak
      ? `Point de vigilance : ${(STRENGTH_LABELS[weak.criterion.slug] ?? weak.criterion.name.toLowerCase()).replace(/élevée|apprécié|bonne? /g, "").trim()} (${weak.score.toFixed(1).replace(".", ",")}/10)`
      : null;

    const reason =
      reasons.length > 0
        ? `Ce résultat apparaît car ${reasons.slice(0, 3).join(", ")}.`
        : `Résultat proposé sur la base de la note publique (${rating.toFixed(1).replace(".", ",")}/10) et de la confiance ${snapshot ? CONFIDENCE_LABELS[snapshot.confidence as keyof typeof CONFIDENCE_LABELS]?.toLowerCase().replace("confiance ", "") : "inconnue"}.`;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      zoneName: p.zone?.name ?? null,
      cityName: p.city.name,
      photoUrl: p.photos[0]?.url ?? null,
      priceLevel: p.priceLevel,
      avgPricePerPerson: p.avgPricePerPerson,
      rating,
      confidence: snapshot?.confidence ?? "faible",
      confidenceLabel:
        CONFIDENCE_LABELS[(snapshot?.confidence ?? "faible") as keyof typeof CONFIDENCE_LABELS],
      reviewCount: snapshot?.reviewCount ?? 0,
      verifiedCount: snapshot?.verifiedCount ?? 0,
      recentCount: snapshot?.recentCount ?? 0,
      trend: snapshot?.trend ?? 0,
      compatibility: compat,
      strengths,
      caution,
      networkCount,
      networkAvg: null,
      reason,
      sponsored: p.sponsored.length > 0,
      openNow,
      hasWave: p.fraudWaves.length > 0,
      attributes: tagSlugs,
    };
  });

  // Filtres post-score
  let results = scored;
  if (filters.verifiedOnly) results = results.filter((r) => r.verifiedCount > 0);
  if (filters.openNow) results = results.filter((r) => r.openNow === true);

  // Tri : les sponsorisés sont signalés mais ne prennent pas la première
  // place sans mention — on les affiche à leur rang mérité + badge.
  const sort = filters.sort ?? "pertinence";
  results.sort((a, b) => {
    if (sort === "note") return b.rating - a.rating;
    if (sort === "recents") return b.recentCount - a.recentCount;
    if (sort === "prix") return (a.avgPricePerPerson ?? 9999) - (b.avgPricePerPerson ?? 9999);
    return b.compatibility - a.compatibility;
  });

  return { parsed, results: results.slice(0, limit) };
}
