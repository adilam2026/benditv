import { describe, expect, it } from "vitest";
import { parseQuery, suggestCategory } from "@/server/services/classification";

describe("compréhension de requête", () => {
  it("extrait catégorie, zone, groupe, ambiance, équipement et budget", () => {
    const parsed = parseQuery(
      "Je cherche un restaurant calme à Dar Bouazza pour deux adultes et deux enfants avec parking, moins de 150 DH par personne."
    );
    expect(parsed.categorySlug).toBe("restaurant");
    expect(parsed.zoneSlug).toBe("dar-bouazza");
    expect(parsed.adults).toBe(2);
    expect(parsed.children).toBe(2);
    expect(parsed.withChildren).toBe(true);
    expect(parsed.attributes).toContain("calme");
    expect(parsed.attributes).toContain("parking");
    expect(parsed.budgetMaxPerPerson).toBe(150);
  });

  it("comprend une spécialité (sardines grillées)", () => {
    const parsed = parseQuery("Où manger de bonnes sardines grillées ?");
    expect(parsed.specialty).toBe("sardines-grillees");
    expect(parsed.categorySlug).toBe("poisson-fruits-de-mer");
  });

  it("gère les fautes d'accent et les variantes", () => {
    const parsed = parseQuery("resto sympa a ain diab");
    expect(parsed.categorySlug).toBe("restaurant");
    expect(parsed.zoneSlug).toBe("ain-diab");
  });

  it("comprend la darija en caractères latins", () => {
    const parsed = parseQuery("fin nakol makla mzyana m3a drari");
    expect(parsed.categorySlug).toBe("restaurant");
    expect(parsed.withChildren).toBe(true);
  });

  it("détecte le contexte match", () => {
    const parsed = parseQuery("où regarder le match dans une bonne ambiance");
    expect(parsed.categorySlug).toBe("lieu-match");
    expect(parsed.context).toBe("match");
  });

  it("détecte le tapissier automobile", () => {
    const parsed = parseQuery("je cherche un tapissier automobile");
    expect(parsed.categorySlug).toBe("tapissier-automobile");
  });

  it("suggère une catégorie pour un synonyme", () => {
    expect(suggestCategory("endroit pour manger")).toBe("restaurant");
    expect(suggestCategory("qahwa")).toBe("cafe");
  });
});
