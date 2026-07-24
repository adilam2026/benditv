import { describe, expect, it } from "vitest";
import { detectWave, assessReview, type FraudReviewInput } from "@/server/services/fraud";

const base = new Date("2026-07-01T10:00:00Z");

function review(overrides: Partial<FraudReviewInput> = {}): FraudReviewInput {
  return {
    id: Math.random().toString(36).slice(2),
    userId: Math.random().toString(36).slice(2),
    score: 7,
    text: "Bonne expérience, service correct et cadre agréable pour un déjeuner.",
    createdAt: base,
    accountAgeDaysAtReview: 200,
    userTotalReviews: 12,
    userDistinctPlaces: 10,
    ...overrides,
  };
}

describe("détection de vague", () => {
  it("détecte une rafale de notes extrêmes de comptes récents avec textes identiques", () => {
    const organic = Array.from({ length: 10 }, (_, i) =>
      review({ createdAt: new Date(base.getTime() - (i + 10) * 7 * 86400_000), score: 6 + (i % 3) })
    );
    const wave = Array.from({ length: 8 }, (_, i) =>
      review({
        createdAt: new Date(base.getTime() + i * 10 * 60_000),
        score: 10,
        accountAgeDaysAtReview: 1,
        userDistinctPlaces: 1,
        text: "Promoteur très sérieux, livraison dans les délais, je recommande vivement.",
      })
    );
    const result = detectWave([...organic, ...wave]);
    expect(result.detected).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(0.5);
    expect(result.reviewCount).toBeGreaterThanOrEqual(8);
  });

  it("ne signale pas une activité organique régulière", () => {
    const organic = Array.from({ length: 20 }, (_, i) =>
      review({ createdAt: new Date(base.getTime() - i * 5 * 86400_000), score: 5 + (i % 5) })
    );
    expect(detectWave(organic).detected).toBe(false);
  });
});

describe("évaluation d'une contribution", () => {
  it("accepte une contribution normale à plein poids", () => {
    const assessment = assessReview(review(), []);
    expect(assessment.decision).toBe("accept");
    expect(assessment.weight).toBe(1);
  });

  it("neutralise un texte copié d'un autre avis du même lieu", () => {
    const text = "Ce salon est incroyable, équipe au top, je recommande à 100 % les yeux fermés.";
    const sibling = review({ text });
    const copy = review({ text });
    const assessment = assessReview(copy, [sibling]);
    expect(assessment.weight).toBeLessThan(1);
    expect(assessment.signals.some((s) => s.kind === "duplicate-text")).toBe(true);
  });

  it("réduit le poids d'un compte jetable mono-lieu à note extrême", () => {
    const assessment = assessReview(
      review({ accountAgeDaysAtReview: 1, userDistinctPlaces: 1, score: 10 }),
      []
    );
    expect(assessment.riskScore).toBeGreaterThan(0);
    expect(assessment.weight).toBeLessThan(1);
  });
});
