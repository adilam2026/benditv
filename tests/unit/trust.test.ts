import { describe, expect, it } from "vitest";
import { computeTrustScore, computeBadges } from "@/server/services/trust";

const newcomer = {
  accountAgeDays: 2,
  emailVerified: true,
  phoneVerified: false,
  contributions: 1,
  verifiedContributions: 1,
  distinctPlaces: 1,
  confirmedFlags: 0,
  deletedByModeration: 0,
  duplicateTexts: 0,
  helpfulVotes: 0,
};

describe("score de fiabilité", () => {
  it("ne pénalise pas un nouveau compte : il démarre au-dessus du neutre avec une preuve", () => {
    expect(computeTrustScore(newcomer)).toBeGreaterThanOrEqual(0.5);
  });

  it("une preuve forte compense la faible ancienneté", () => {
    const withProof = computeTrustScore(newcomer);
    const withoutProof = computeTrustScore({ ...newcomer, verifiedContributions: 0 });
    expect(withProof).toBeGreaterThan(withoutProof);
  });

  it("sanctionne les comportements frauduleux confirmés", () => {
    const honest = computeTrustScore({ ...newcomer, contributions: 20, distinctPlaces: 15 });
    const fraudulent = computeTrustScore({
      ...newcomer, contributions: 20, distinctPlaces: 15, confirmedFlags: 3, duplicateTexts: 4,
    });
    expect(fraudulent).toBeLessThan(honest);
    expect(fraudulent).toBeGreaterThanOrEqual(0);
  });

  it("reste borné entre 0 et 1", () => {
    const maxed = computeTrustScore({
      accountAgeDays: 5000, emailVerified: true, phoneVerified: true,
      contributions: 500, verifiedContributions: 500, distinctPlaces: 300,
      confirmedFlags: 0, deletedByModeration: 0, duplicateTexts: 0, helpfulVotes: 400,
    });
    expect(maxed).toBeLessThanOrEqual(1);
  });
});

describe("badges", () => {
  it("attribue les badges lisibles selon l'activité", () => {
    const badges = computeBadges({
      ...newcomer,
      contributions: 30, distinctPlaces: 20, verifiedContributions: 12,
      familyReviews: 6, foodReviews: 12, photos: 12, detailed: 6,
    });
    const codes = badges.map((b) => b.code);
    expect(codes).toContain("regular");
    expect(codes).toContain("local-expert");
    expect(codes).toContain("family");
    expect(codes).toContain("food");
    expect(codes).not.toContain("new");
  });
});
