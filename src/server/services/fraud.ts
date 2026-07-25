// Moteur anti-fraude — détection de vagues, textes dupliqués, notes
// extrêmes concentrées, comptes mono-lieu. Produit un score de risque
// par contribution et des décisions graduées, toujours journalisées.

import { trigramSimilarity } from "@/lib/text";

export type FraudReviewInput = {
  id: string;
  userId: string;
  score: number; // 0..10
  text: string | null;
  createdAt: Date;
  accountAgeDaysAtReview: number;
  userTotalReviews: number;
  userDistinctPlaces: number;
};

export type FraudAssessment = {
  reviewId: string;
  riskScore: number; // 0..1
  signals: { kind: string; severity: number; detail: string }[];
  decision: "accept" | "reduce-weight" | "neutralize" | "moderate";
  weight: number; // poids appliqué au calcul de note
};

export type WaveDetection = {
  detected: boolean;
  startedAt: Date | null;
  reviewCount: number;
  avgRating: number;
  riskScore: number;
  reason: string;
};

// Détection de vague : volume anormal sur une fenêtre courte,
// avec concentration de notes extrêmes ou textes similaires.
export function detectWave(
  reviews: FraudReviewInput[],
  windowHours = 48,
  baselinePerWeek = 3
): WaveDetection {
  const sorted = [...reviews].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const windowMs = windowHours * 3600_000;
  let best: { start: number; count: number } = { start: -1, count: 0 };

  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (
      j < sorted.length &&
      sorted[j].createdAt.getTime() - sorted[i].createdAt.getTime() <= windowMs
    )
      j++;
    const count = j - i;
    if (count > best.count) best = { start: i, count };
  }

  const expected = Math.max(2, (baselinePerWeek * windowHours) / (7 * 24));
  if (best.count < Math.max(5, expected * 4)) {
    return { detected: false, startedAt: null, reviewCount: 0, avgRating: 0, riskScore: 0, reason: "" };
  }

  const wave = sorted.slice(best.start, best.start + best.count);
  const avg = wave.reduce((s, r) => s + r.score, 0) / wave.length;
  const extremeShare =
    wave.filter((r) => r.score >= 9 || r.score <= 2).length / wave.length;
  const newAccountShare =
    wave.filter((r) => r.accountAgeDaysAtReview < 7).length / wave.length;
  const singlePlaceShare =
    wave.filter((r) => r.userDistinctPlaces <= 1).length / wave.length;

  let textSim = 0;
  const texts = wave.map((r) => r.text).filter((t): t is string => !!t && t.length > 15);
  let pairs = 0;
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      textSim += trigramSimilarity(texts[i], texts[j]);
      pairs++;
    }
  const avgSim = pairs > 0 ? textSim / pairs : 0;

  const riskScore = Math.min(
    1,
    0.3 + extremeShare * 0.3 + newAccountShare * 0.2 + singlePlaceShare * 0.15 + avgSim * 0.5
  );

  const reasons: string[] = [`${best.count} contributions en ${windowHours} h`];
  if (extremeShare > 0.6) reasons.push("concentration de notes extrêmes");
  if (newAccountShare > 0.4) reasons.push("comptes très récents");
  if (avgSim > 0.35) reasons.push("textes très similaires");
  if (singlePlaceShare > 0.6) reasons.push("comptes n'évaluant qu'un seul lieu");

  return {
    detected: riskScore >= 0.5,
    startedAt: wave[0].createdAt,
    reviewCount: best.count,
    avgRating: Math.round(avg * 10) / 10,
    riskScore: Math.round(riskScore * 100) / 100,
    reason: reasons.join(", "),
  };
}

export function assessReview(
  review: FraudReviewInput,
  siblingsOnPlace: FraudReviewInput[],
  userOtherTexts: string[] = []
): FraudAssessment {
  const signals: FraudAssessment["signals"] = [];

  // Compte mono-lieu très récent avec note extrême
  if (
    review.accountAgeDaysAtReview < 3 &&
    review.userDistinctPlaces <= 1 &&
    (review.score >= 9.5 || review.score <= 1.5)
  ) {
    signals.push({
      kind: "single-place",
      severity: 0.5,
      detail: "Compte récent, un seul lieu évalué, note extrême",
    });
  }

  // Texte quasi identique à un autre avis du même lieu
  if (review.text && review.text.length > 15) {
    for (const sib of siblingsOnPlace) {
      if (sib.id === review.id || !sib.text) continue;
      const sim = trigramSimilarity(review.text, sib.text);
      if (sim > 0.6) {
        signals.push({
          kind: "duplicate-text",
          severity: 0.7,
          detail: `Texte très proche d'une autre contribution (similarité ${(sim * 100).toFixed(0)} %)`,
        });
        break;
      }
    }
    for (const other of userOtherTexts) {
      if (trigramSimilarity(review.text, other) > 0.75) {
        signals.push({
          kind: "duplicate-text",
          severity: 0.5,
          detail: "Texte dupliqué depuis une autre contribution du même compte",
        });
        break;
      }
    }
  }

  // Rafale : plusieurs avis du même utilisateur sur le même lieu en peu de temps
  const sameUser = siblingsOnPlace.filter(
    (s) =>
      s.userId === review.userId &&
      s.id !== review.id &&
      Math.abs(s.createdAt.getTime() - review.createdAt.getTime()) < 7 * 86400_000
  );
  if (sameUser.length > 0) {
    signals.push({
      kind: "burst",
      severity: 0.6,
      detail: "Plusieurs contributions rapprochées sur le même lieu",
    });
  }

  const riskScore = Math.min(1, signals.reduce((s, x) => s + x.severity, 0));

  let decision: FraudAssessment["decision"] = "accept";
  let weight = 1;
  if (riskScore >= 0.8) {
    decision = "moderate";
    weight = 0;
  } else if (riskScore >= 0.6) {
    decision = "neutralize";
    weight = 0;
  } else if (riskScore >= 0.35) {
    decision = "reduce-weight";
    weight = 0.4;
  }

  return { reviewId: review.id, riskScore: Math.round(riskScore * 100) / 100, signals, decision, weight };
}
