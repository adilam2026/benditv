import { describe, expect, it } from "vitest";
import { normalize, singularize, trigramSimilarity, isVagueComment, slugify } from "@/lib/text";

describe("normalisation", () => {
  it("retire les accents et la ponctuation", () => {
    expect(normalize("Pâtisserie « Amande & Miel » !")).toBe("patisserie amande miel");
  });
  it("singularise les pluriels simples", () => {
    expect(singularize("restaurants")).toBe("restaurant");
    expect(singularize("chevaux")).toBe("cheval");
  });
  it("génère des slugs propres", () => {
    expect(slugify("La Table du Phare")).toBe("la-table-du-phare");
  });
});

describe("similarité de textes", () => {
  it("détecte deux textes quasi identiques", () => {
    const a = "Promoteur très sérieux, livraison dans les délais, je recommande vivement.";
    const b = "Promoteur très sérieux, livraison dans les délais, je recommande vivement. Top.";
    expect(trigramSimilarity(a, b)).toBeGreaterThan(0.6);
  });
  it("distingue deux textes différents", () => {
    const a = "Service rapide et plats copieux, terrasse agréable.";
    const b = "Le délai de livraison a dépassé une heure et la commande était incomplète.";
    expect(trigramSimilarity(a, b)).toBeLessThan(0.3);
  });
});

describe("commentaires vagues", () => {
  it("détecte les formules creuses", () => {
    expect(isVagueComment("C'était bien")).toBe(true);
    expect(isVagueComment("top")).toBe(true);
    expect(isVagueComment("je recommande")).toBe(true);
  });
  it("accepte un commentaire précis", () => {
    expect(isVagueComment("Accueil chaleureux mais 30 minutes d'attente pour les plats.")).toBe(false);
  });
});
