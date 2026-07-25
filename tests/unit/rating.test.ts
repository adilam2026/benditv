import { describe, expect, it } from "vitest";
import {
  computeRating,
  recencyWeight,
  contributionWeight,
  ratingExplanation,
  type RatingInput,
} from "@/server/services/rating";

const now = new Date("2026-07-01T12:00:00Z");

function input(overrides: Partial<RatingInput> = {}): RatingInput {
  return {
    score: 8,
    createdAt: new Date("2026-06-01T12:00:00Z"),
    verificationLevel: 0,
    contributorTrust: 0.5,
    fraudWeight: 1,
    ...overrides,
  };
}

describe("moyenne bayésienne", () => {
  it("empêche 2 notes parfaites de dépasser un lieu avec beaucoup d'avis fiables", () => {
    const twoPerfect = computeRating(
      [input({ score: 10 }), input({ score: 10 })],
      6.5, 12, now
    );
    const manyGood = computeRating(
      Array.from({ length: 120 }, (_, i) =>
        input({ score: 8.6, verificationLevel: 2, createdAt: new Date(now.getTime() - i * 3 * 86400_000) })
      ),
      6.5, 12, now
    );
    expect(manyGood.rating).toBeGreaterThan(twoPerfect.rating);
  });

  it("tire une note vers le prior de la catégorie quand le volume est faible", () => {
    const result = computeRating([input({ score: 10 })], 6.5, 12, now);
    expect(result.rating).toBeLessThan(8);
    expect(result.rating).toBeGreaterThan(6.5);
  });

  it("retourne le prior sans aucune contribution", () => {
    const result = computeRating([], 6.5, 12, now);
    expect(result.rating).toBe(6.5);
    expect(result.confidence).toBe("faible");
  });
});

describe("récence", () => {
  it("réduit de moitié le poids après un an", () => {
    const fresh = recencyWeight(now, now);
    const oneYear = recencyWeight(new Date(now.getTime() - 365 * 86400_000), now);
    expect(fresh).toBeCloseTo(1, 5);
    expect(oneYear).toBeCloseTo(0.5, 2);
  });
});

describe("poids d'une contribution", () => {
  it("exclut totalement une contribution neutralisée par l'anti-fraude", () => {
    expect(contributionWeight(input({ fraudWeight: 0 }), now)).toBe(0);
  });

  it("valorise la vérification", () => {
    const declared = contributionWeight(input({ verificationLevel: 0 }), now);
    const confirmed = contributionWeight(input({ verificationLevel: 3 }), now);
    expect(confirmed).toBeGreaterThan(declared);
  });

  it("ne réduit pas à néant un nouveau contributeur", () => {
    const newcomer = contributionWeight(input({ contributorTrust: 0.5 }), now);
    const veteran = contributionWeight(input({ contributorTrust: 1 }), now);
    expect(newcomer).toBeGreaterThan(veteran * 0.6);
  });
});

describe("confiance", () => {
  it("monte avec le volume et la vérification", () => {
    const small = computeRating([input()], 6.5, 12, now);
    const large = computeRating(
      Array.from({ length: 200 }, (_, i) =>
        input({ verificationLevel: 2, createdAt: new Date(now.getTime() - (i % 300) * 86400_000) })
      ),
      6.5, 12, now
    );
    expect(large.confidenceScore).toBeGreaterThan(small.confidenceScore);
    expect(["elevee", "tres-elevee"]).toContain(large.confidence);
    expect(small.confidence).toBe("faible");
  });
});

describe("explication de la note", () => {
  it("décrit le nombre d'expériences retenues et écartées", () => {
    const result = computeRating(
      [input(), input({ verificationLevel: 2 }), input({ fraudWeight: 0 })],
      6.5, 12, now
    );
    const text = ratingExplanation(result);
    expect(text).toContain("2 expériences");
    expect(text).toContain("écartée");
  });
});
