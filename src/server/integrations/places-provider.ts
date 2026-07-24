// Abstraction "Provider de lieux" pour un éventuel import depuis une
// API officielle de points d'intérêt (licence et attribution requises).
// PLACES_PROVIDER=demo (défaut) : fournisseur local de données fictives.
//
// Cette plateforme n'aspire pas Google Maps, ne copie pas les avis
// Google ou Facebook et ne contourne les conditions d'aucune
// plateforme : seul un connecteur autorisé et sous licence peut être
// branché ici.

export type ExternalPlace = {
  externalId: string;
  name: string;
  categoryHint: string;
  address: string;
  citySlug: string;
  zoneSlug?: string;
  lat?: number;
  lng?: number;
};

export interface PlacesProvider {
  readonly name: string;
  search(query: string, citySlug: string): Promise<ExternalPlace[]>;
}

class DemoPlacesProvider implements PlacesProvider {
  readonly name = "demo";
  async search(query: string, citySlug: string): Promise<ExternalPlace[]> {
    // Données fictives clairement identifiées, pour démonstration d'import.
    return [
      {
        externalId: "demo-ext-1",
        name: `${query} — Exemple importé (fictif)`,
        categoryHint: query,
        address: "Adresse fictive de démonstration",
        citySlug,
      },
    ];
  }
}

export function getPlacesProvider(): PlacesProvider {
  const provider = process.env.PLACES_PROVIDER ?? "demo";
  if (provider === "demo") return new DemoPlacesProvider();
  throw new Error(
    `Fournisseur de lieux "${provider}" non configuré. Seules les API autorisées et sous licence peuvent être branchées.`
  );
}
