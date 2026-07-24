// Recalcul de la note publique et des scores par critère d'un lieu,
// à partir des expériences publiées, du poids anti-fraude et de la
// fiabilité des contributeurs.

import { prisma } from "@/lib/prisma";
import { computeRating, type RatingInput } from "./rating";

const LEVEL_MAP = { DECLARED: 0, COHERENT: 1, VISIT_CONFIRMED: 2, TRANSACTION_CONFIRMED: 3 } as const;

export async function recomputePlaceRating(placeId: string): Promise<void> {
  const reviews = await prisma.review.findMany({
    where: { placeId, status: { in: ["PUBLISHED", "NEUTRALIZED", "EXCLUDED"] }, visibility: "PUBLIC" },
    include: {
      answers: { include: { criterion: true } },
      verification: true,
      user: { include: { trustScore: true } },
    },
  });

  const inputs: RatingInput[] = [];
  const criterionAgg = new Map<string, { total: number; count: number }>();

  for (const review of reviews) {
    const scoredAnswers = review.answers.filter((a) => a.score !== null);
    if (scoredAnswers.length === 0) continue;
    const avgScore =
      scoredAnswers.reduce((s, a) => s + (a.score ?? 0), 0) / scoredAnswers.length;
    const excluded = review.status !== "PUBLISHED";
    inputs.push({
      score: avgScore,
      createdAt: review.visitedAt,
      verificationLevel: LEVEL_MAP[review.verification?.level ?? "DECLARED"],
      contributorTrust: review.user.trustScore?.score ?? 0.5,
      fraudWeight: excluded ? 0 : review.weight,
    });
    if (!excluded && review.weight > 0) {
      for (const answer of scoredAnswers) {
        const agg = criterionAgg.get(answer.criterionId) ?? { total: 0, count: 0 };
        agg.total += answer.score ?? 0;
        agg.count += 1;
        criterionAgg.set(answer.criterionId, agg);
      }
    }
  }

  const place = await prisma.place.findUniqueOrThrow({
    where: { id: placeId },
    select: { categoryId: true },
  });
  // Moyenne de référence de la catégorie (prior bayésien)
  const categoryAvg = await prisma.ratingSnapshot.aggregate({
    where: { isCurrent: true, place: { categoryId: place.categoryId, id: { not: placeId } } },
    _avg: { rawAverage: true },
  });
  const prior = categoryAvg._avg.rawAverage && categoryAvg._avg.rawAverage > 0
    ? categoryAvg._avg.rawAverage
    : 6.5;

  const result = computeRating(inputs, prior);

  await prisma.$transaction([
    prisma.ratingSnapshot.updateMany({
      where: { placeId, isCurrent: true },
      data: { isCurrent: false },
    }),
    prisma.ratingSnapshot.create({
      data: {
        placeId,
        rating: result.rating,
        rawAverage: result.rawAverage,
        confidence: result.confidence,
        confidenceScore: result.confidenceScore,
        reviewCount: result.reviewCount,
        recentCount: result.recentCount,
        verifiedCount: result.verifiedCount,
        excludedCount: result.excludedCount,
        dispersion: result.dispersion,
        trend: result.trend,
      },
    }),
    prisma.placeCriterionScore.deleteMany({ where: { placeId } }),
    prisma.placeCriterionScore.createMany({
      data: [...criterionAgg.entries()].map(([criterionId, agg]) => ({
        placeId,
        criterionId,
        score: Math.round((agg.total / agg.count) * 10) / 10,
        count: agg.count,
      })),
    }),
  ]);
}
