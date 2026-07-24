// Adaptateur IA facultatif.
// AI_PROVIDER=local (défaut) : la plateforme fonctionne sans clé grâce
// aux règles et dictionnaires (src/server/services/classification.ts).
// AI_PROVIDER=openai-compatible : permet de brancher une API de modèle
// de langage via AI_API_URL + AI_API_KEY (aucune clé n'est fournie).
// Règle absolue : toute synthèse générée doit s'appuyer uniquement sur
// des données présentes dans la plateforme — jamais de lieu, note,
// horaire ou expérience inventés.

export function aiAvailable(): boolean {
  return (
    (process.env.AI_PROVIDER ?? "local") !== "local" &&
    !!process.env.AI_API_KEY &&
    !!process.env.AI_API_URL
  );
}

// Synthèse locale d'expériences : agrégation factuelle, sans invention.
export function summarizeExperiences(stats: {
  placeName: string;
  reviewCount: number;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
}): string {
  const parts: string[] = [];
  if (stats.strengths.length > 0) {
    parts.push(`Les points les plus souvent salués sont ${stats.strengths.join(", ")}.`);
  }
  if (stats.weaknesses.length > 0) {
    parts.push(`Les points de vigilance mentionnés concernent ${stats.weaknesses.join(", ")}.`);
  }
  if (stats.bestFor.length > 0) {
    parts.push(`Le lieu est surtout recommandé pour : ${stats.bestFor.join(", ")}.`);
  }
  if (parts.length === 0) {
    return "Pas encore assez d'expériences publiées pour établir une synthèse.";
  }
  return parts.join(" ");
}

export const AI_SUMMARY_DISCLAIMER =
  "Résumé généré à partir des expériences publiées sur la plateforme.";
