// Moteur de notation — note publique sur 10.
// La note n'est pas une moyenne arithmétique : elle combine une moyenne
// bayésienne (ancrée sur la moyenne de la catégorie), une pondération par
// récence, par niveau de vérification, par fiabilité du contributeur et
// par le poids anti-fraude de chaque contribution.

export type RatingInput = {
  score: number; // 0..10 (moyenne des critères de la contribution)
  createdAt: Date;
  verificationLevel: 0 | 1 | 2 | 3;
  contributorTrust: number; // 0..1
  fraudWeight: number; // 0..1 (0 = exclu)
};

export type RatingResult = {
  rating: number;
  rawAverage: number;
  confidence: "faible" | "moyenne" | "elevee" | "tres-elevee";
  confidenceScore: number; // 0..1
  effectiveCount: number;
  reviewCount: number;
  recentCount: number;
  verifiedCount: number;
  excludedCount: number;
  dispersion: number;
  trend: number;
};

const VERIFICATION_WEIGHT = [0.7, 0.85, 1.0, 1.15] as const;
const HALF_LIFE_DAYS = 365; // une expérience perd la moitié de son poids en 1 an
export const DEFAULT_BAYESIAN_WEIGHT = 12; // "expériences virtuelles" au prior

export function recencyWeight(createdAt: Date, now = new Date()): number {
  const ageDays = Math.max(0, (now.getTime() - createdAt.getTime()) / 86400_000);
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

export function contributionWeight(input: RatingInput, now = new Date()): number {
  if (input.fraudWeight <= 0) return 0;
  const trust = 0.5 + input.contributorTrust * 0.7; // 0.5..1.2 — un nouveau n'est pas écrasé
  return (
    recencyWeight(input.createdAt, now) *
    VERIFICATION_WEIGHT[input.verificationLevel] *
    trust *
    input.fraudWeight
  );
}

export function computeRating(
  inputs: RatingInput[],
  categoryPrior = 6.5,
  bayesianWeight = DEFAULT_BAYESIAN_WEIGHT,
  now = new Date()
): RatingResult {
  const included = inputs.filter((i) => i.fraudWeight > 0);
  const excludedCount = inputs.length - included.length;

  if (included.length === 0) {
    return {
      rating: categoryPrior,
      rawAverage: 0,
      confidence: "faible",
      confidenceScore: 0,
      effectiveCount: 0,
      reviewCount: 0,
      recentCount: 0,
      verifiedCount: 0,
      excludedCount,
      dispersion: 0,
      trend: 0,
    };
  }

  let weightSum = 0;
  let weightedScoreSum = 0;
  for (const input of included) {
    const w = contributionWeight(input, now);
    weightSum += w;
    weightedScoreSum += w * input.score;
  }
  const rawAverage = included.reduce((s, i) => s + i.score, 0) / included.length;
  const weightedAverage = weightSum > 0 ? weightedScoreSum / weightSum : categoryPrior;

  // Moyenne bayésienne : un lieu avec 2 notes parfaites ne dépasse pas
  // mécaniquement un lieu avec des centaines d'avis fiables.
  const rating =
    (weightedAverage * weightSum + categoryPrior * bayesianWeight) /
    (weightSum + bayesianWeight);

  // Dispersion (écart-type simple)
  const variance =
    included.reduce((s, i) => s + Math.pow(i.score - rawAverage, 2), 0) / included.length;
  const dispersion = Math.sqrt(variance);

  const yearAgo = new Date(now.getTime() - 365 * 86400_000);
  const sixMonthsAgo = new Date(now.getTime() - 182 * 86400_000);
  const recent = included.filter((i) => i.createdAt >= yearAgo);
  const last6 = included.filter((i) => i.createdAt >= sixMonthsAgo);
  const older = included.filter((i) => i.createdAt < sixMonthsAgo);
  const avg = (xs: RatingInput[]) =>
    xs.length ? xs.reduce((s, i) => s + i.score, 0) / xs.length : null;
  const a6 = avg(last6);
  const aOld = avg(older);
  const trend = a6 !== null && aOld !== null ? a6 - aOld : 0;

  const verifiedCount = included.filter((i) => i.verificationLevel >= 2).length;

  // Confiance : volume effectif, part vérifiée, récence, dispersion
  const volumeFactor = 1 - Math.exp(-weightSum / 15);
  const verifiedFactor = included.length ? 0.5 + 0.5 * (verifiedCount / included.length) : 0.5;
  const recencyFactor = included.length ? 0.4 + 0.6 * (recent.length / included.length) : 0.4;
  const dispersionFactor = Math.max(0.5, 1 - dispersion / 8);
  const confidenceScore = Math.min(
    1,
    volumeFactor * verifiedFactor * recencyFactor * dispersionFactor * 1.35
  );

  const confidence =
    confidenceScore >= 0.75
      ? "tres-elevee"
      : confidenceScore >= 0.55
        ? "elevee"
        : confidenceScore >= 0.3
          ? "moyenne"
          : "faible";

  return {
    rating: Math.round(rating * 10) / 10,
    rawAverage: Math.round(rawAverage * 10) / 10,
    confidence,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    effectiveCount: Math.round(weightSum * 10) / 10,
    reviewCount: included.length,
    recentCount: recent.length,
    verifiedCount,
    excludedCount,
    dispersion: Math.round(dispersion * 100) / 100,
    trend: Math.round(trend * 10) / 10,
  };
}

export const CONFIDENCE_LABELS: Record<RatingResult["confidence"], string> = {
  faible: "Confiance faible",
  moyenne: "Confiance moyenne",
  elevee: "Confiance élevée",
  "tres-elevee": "Confiance très élevée",
};

export function ratingExplanation(r: RatingResult): string {
  if (r.reviewCount === 0) {
    return "Aucune expérience publiée pour le moment : la note affichée correspond à la moyenne de la catégorie.";
  }
  return `Calcul basé sur ${r.reviewCount} expérience${r.reviewCount > 1 ? "s" : ""}, dont ${r.verifiedCount} vérifiée${r.verifiedCount > 1 ? "s" : ""} et ${r.recentCount} publiée${r.recentCount > 1 ? "s" : ""} au cours des 12 derniers mois.${r.excludedCount > 0 ? ` ${r.excludedCount} contribution${r.excludedCount > 1 ? "s ont" : " a"} été écartée${r.excludedCount > 1 ? "s" : ""} du calcul par nos contrôles.` : ""}`;
}
