// Score interne de fiabilité d'un contributeur (0..1).
// Jamais exposé tel quel : seuls des badges lisibles sont publics.
// Un nouvel utilisateur n'est pas pénalisé pour sa seule nouveauté :
// il démarre à un niveau neutre et une preuve forte compense l'ancienneté.

export type TrustInput = {
  accountAgeDays: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  contributions: number;
  verifiedContributions: number;
  distinctPlaces: number;
  confirmedFlags: number; // signalements confirmés contre l'utilisateur
  deletedByModeration: number;
  duplicateTexts: number;
  helpfulVotes: number;
};

export function computeTrustScore(input: TrustInput): number {
  let score = 0.5; // départ neutre

  if (input.emailVerified) score += 0.05;
  if (input.phoneVerified) score += 0.05;

  // Ancienneté : bonus plafonné, jamais un malus
  score += Math.min(0.1, input.accountAgeDays / 3650);

  // Volume et diversité
  score += Math.min(0.12, input.contributions * 0.01);
  score += Math.min(0.08, input.distinctPlaces * 0.01);

  // Taux de vérification — une preuve forte compense la nouveauté
  if (input.contributions > 0) {
    score += 0.15 * (input.verifiedContributions / input.contributions);
  }

  // Utilité perçue
  score += Math.min(0.05, input.helpfulVotes * 0.005);

  // Malus factuels
  score -= input.confirmedFlags * 0.1;
  score -= input.deletedByModeration * 0.08;
  score -= input.duplicateTexts * 0.05;

  return Math.max(0, Math.min(1, score));
}

export type BadgeDef = { code: string; label: string };

export function computeBadges(input: TrustInput & { familyReviews?: number; foodReviews?: number; photos?: number; detailed?: number }): BadgeDef[] {
  const badges: BadgeDef[] = [];
  if (input.contributions <= 3) badges.push({ code: "new", label: "Nouveau contributeur" });
  if (input.verifiedContributions >= 1) badges.push({ code: "verified-visit", label: "Visite confirmée" });
  if (input.contributions >= 10) badges.push({ code: "regular", label: "Contributeur régulier" });
  if (input.contributions >= 25 && input.distinctPlaces >= 15)
    badges.push({ code: "local-expert", label: "Expert local" });
  if ((input.detailed ?? 0) >= 5) badges.push({ code: "detailed", label: "Avis détaillés" });
  if ((input.photos ?? 0) >= 10) badges.push({ code: "photos", label: "Photos utiles" });
  if ((input.familyReviews ?? 0) >= 5) badges.push({ code: "family", label: "Spécialiste famille" });
  if ((input.foodReviews ?? 0) >= 10) badges.push({ code: "food", label: "Spécialiste restauration" });
  return badges;
}
