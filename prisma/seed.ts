// Seed RECOFIABLE — TOUTES LES DONNÉES CRÉÉES ICI SONT FICTIVES.
// Les lieux, avis, personnes et statistiques sont générés pour la
// démonstration et ne décrivent aucun établissement réel.

import { PrismaClient, VerificationLevel } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

// ── Aléatoire déterministe ──────────────────────────────────────
let seedState = 42;
function rand(): number {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400_000);
}

// ── Images de démonstration (SVG locaux) ────────────────────────
const DEMO_COLORS: Record<string, string> = {
  restaurant: "#0f766e", cafe: "#92400e", sante: "#0369a1", beaute: "#9d174d",
  enfants: "#ca8a04", sport: "#166534", maison: "#57534e", autre: "#334155",
};
function ensureDemoImages() {
  const dir = path.join(process.cwd(), "public", "demo");
  mkdirSync(dir, { recursive: true });
  for (const [key, color] of Object.entries(DEMO_COLORS)) {
    const file = path.join(dir, `${key}.svg`);
    if (existsSync(file)) continue;
    writeFileSync(
      file,
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="${color}"/><rect width="640" height="400" fill="url(#g)" opacity="0.35"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.25"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/></linearGradient></defs><text x="320" y="190" font-family="sans-serif" font-size="28" fill="#ffffff" text-anchor="middle" font-weight="bold">Photo de démonstration</text><text x="320" y="228" font-family="sans-serif" font-size="18" fill="#ffffffcc" text-anchor="middle">Image fictive — RECOFIABLE</text></svg>`
    );
  }
}
function demoImage(kind: string): string {
  return `/demo/${DEMO_COLORS[kind] ? kind : "autre"}.svg`;
}

async function main() {
  console.log("Seed RECOFIABLE — création des données de démonstration (fictives)…");
  ensureDemoImages();

  // ── Nettoyage (ordre inverse des dépendances) ────────────────
  await prisma.$transaction([
    prisma.auditLog.deleteMany(), prisma.analyticsEvent.deleteMany(),
    prisma.searchLog.deleteMany(), prisma.recommendationLog.deleteMany(),
    prisma.notification.deleteMany(), prisma.invoice.deleteMany(),
    prisma.subscription.deleteMany(), prisma.lead.deleteMany(),
    prisma.quoteRequest.deleteMany(), prisma.reservation.deleteMany(),
    prisma.sponsoredPlacement.deleteMany(), prisma.offer.deleteMany(),
    prisma.missionContribution.deleteMany(), prisma.mission.deleteMany(),
    prisma.answerVote.deleteMany(), prisma.questionAnswer.deleteMany(),
    prisma.question.deleteMany(), prisma.appeal.deleteMany(),
    prisma.moderationDecision.deleteMany(), prisma.moderationReport.deleteMany(),
    prisma.fraudSignal.deleteMany(), prisma.fraudWave.deleteMany(),
    prisma.fraudCase.deleteMany(), prisma.placeCriterionScore.deleteMany(),
    prisma.ratingSnapshot.deleteMany(), prisma.professionalResponse.deleteMany(),
    prisma.reviewVote.deleteMany(), prisma.reviewRevision.deleteMany(),
    prisma.reviewVerification.deleteMany(), prisma.reviewEvidence.deleteMany(),
    prisma.reviewPhoto.deleteMany(), prisma.reviewCriterionAnswer.deleteMany(),
    prisma.review.deleteMany(), prisma.listCollaborator.deleteMany(),
    prisma.listItem.deleteMany(), prisma.list.deleteMany(),
    prisma.favorite.deleteMany(), prisma.placeClaim.deleteMany(),
    prisma.placeTag.deleteMany(), prisma.placeSpecialty.deleteMany(),
    prisma.placeHistory.deleteMany(), prisma.placePrice.deleteMany(),
    prisma.placeService.deleteMany(), prisma.placeAttribute.deleteMany(),
    prisma.placePhoto.deleteMany(), prisma.placeHours.deleteMany(),
    prisma.placeLocation.deleteMany(), prisma.placeTranslation.deleteMany(),
    prisma.place.deleteMany(), prisma.professionalMember.deleteMany(),
    prisma.professionalOrganization.deleteMany(),
    prisma.categoryCriterion.deleteMany(), prisma.criterionOption.deleteMany(),
    prisma.criterion.deleteMany(), prisma.attributeDefinition.deleteMany(),
    prisma.tag.deleteMany(), prisma.specialty.deleteMany(),
    prisma.categoryProposal.deleteMany(), prisma.categorySynonym.deleteMany(),
    prisma.categoryTranslation.deleteMany(), prisma.category.deleteMany(),
    prisma.userBadge.deleteMany(), prisma.trustScore.deleteMany(),
    prisma.socialConnection.deleteMany(), prisma.userConsent.deleteMany(),
    prisma.userPreference.deleteMany(), prisma.userProfile.deleteMany(),
    prisma.circleMember.deleteMany(), prisma.circle.deleteMany(),
    prisma.follow.deleteMany(), prisma.block.deleteMany(),
    prisma.passwordResetToken.deleteMany(), prisma.session.deleteMany(),
    prisma.account.deleteMany(), prisma.user.deleteMany(),
    prisma.zone.deleteMany(), prisma.city.deleteMany(),
    prisma.country.deleteMany(), prisma.subscriptionPlan.deleteMany(),
    prisma.systemSetting.deleteMany(),
  ]);

  // ── Géographie ───────────────────────────────────────────────
  const morocco = await prisma.country.create({
    data: { code: "MA", name: "Maroc", currency: "MAD" },
  });
  const casablanca = await prisma.city.create({
    data: { countryId: morocco.id, slug: "casablanca", name: "Casablanca" },
  });
  const zoneDefs = [
    ["dar-bouazza", "Dar Bouazza", 33.516, -7.755],
    ["ain-diab", "Ain Diab", 33.594, -7.669],
    ["bouskoura", "Bouskoura", 33.455, -7.654],
    ["maarif", "Maârif", 33.585, -7.632],
    ["californie", "Californie", 33.541, -7.632],
    ["oasis", "Oasis", 33.556, -7.629],
    ["sidi-maarouf", "Sidi Maârouf", 33.522, -7.653],
    ["centre-ville", "Centre-ville", 33.596, -7.618],
  ] as const;
  const zones: Record<string, string> = {};
  for (const [slug, name, lat, lng] of zoneDefs) {
    const z = await prisma.zone.create({
      data: { cityId: casablanca.id, slug, name, lat, lng },
    });
    zones[slug] = z.id;
  }

  // ── Taxonomie ────────────────────────────────────────────────
  const universes: [string, string, string][] = [
    ["restauration-sorties", "Restauration et sorties", "🍽️"],
    ["enfants-famille", "Enfants et famille", "🧒"],
    ["services-quotidien", "Services du quotidien", "🛠️"],
    ["beaute-bien-etre", "Beauté et bien-être", "💇"],
    ["sante", "Santé", "🩺"],
    ["loisirs-sport", "Loisirs et sport", "⚽"],
    ["maison-automobile", "Maison et automobile", "🏠"],
    ["voyage", "Voyage", "✈️"],
    ["immobilier", "Immobilier", "🏢"],
    ["education-formation", "Éducation et formation", "📚"],
  ];
  const universeIds: Record<string, string> = {};
  for (let i = 0; i < universes.length; i++) {
    const [slug, name, icon] = universes[i];
    const u = await prisma.category.create({
      data: { slug, name, kind: "universe", icon, sortOrder: i },
    });
    universeIds[slug] = u.id;
  }

  const categoryDefs: [string, string, string, string[]][] = [
    // [slug, nom, univers, synonymes]
    ["restaurant", "Restaurant", "restauration-sorties", ["resto", "restau", "restaurants", "endroit pour manger", "matam"]],
    ["cafe", "Café", "restauration-sorties", ["coffee", "qahwa", "kahwa"]],
    ["salon-de-the", "Salon de thé", "restauration-sorties", ["atay"]],
    ["patisserie", "Pâtisserie", "restauration-sorties", ["gateaux", "halwa"]],
    ["glacier", "Glacier", "restauration-sorties", ["glaces", "ice cream"]],
    ["traiteur", "Traiteur", "restauration-sorties", ["buffet"]],
    ["snack", "Snack", "restauration-sorties", ["fast food", "sandwich"]],
    ["poisson-fruits-de-mer", "Poisson et fruits de mer", "restauration-sorties", ["hout", "sardines"]],
    ["rooftop", "Rooftop", "restauration-sorties", ["toit terrasse"]],
    ["lieu-match", "Lieu pour regarder les matchs", "restauration-sorties", ["match", "ecran geant"]],
    ["aire-de-jeux", "Aire de jeux", "enfants-famille", ["jeux enfants", "kidzone"]],
    ["activite-enfant", "Activité enfant", "enfants-famille", ["sortie enfant"]],
    ["summer-camp", "Summer camp", "enfants-famille", ["camp d ete", "colonie"]],
    ["creche", "Crèche", "enfants-famille", ["garderie", "nursery", "rawda"]],
    ["parc", "Parc", "enfants-famille", ["jardin", "espace vert"]],
    ["atelier-creatif", "Atelier créatif", "enfants-famille", ["atelier enfants"]],
    ["imprimerie", "Imprimerie", "services-quotidien", ["imprimeur", "impression"]],
    ["pressing", "Pressing", "services-quotidien", ["nettoyage a sec"]],
    ["couturier", "Couturier", "services-quotidien", ["couture", "khiyat"]],
    ["photographe", "Photographe", "services-quotidien", ["shooting", "tswira"]],
    ["reparateur", "Réparateur", "services-quotidien", ["reparation"]],
    ["prestataire-evenementiel", "Prestataire événementiel", "services-quotidien", ["evenementiel"]],
    ["coiffeur", "Coiffeur", "beaute-bien-etre", ["salon de coiffure", "coloration", "lissage", "halaq"]],
    ["salon-de-beaute", "Salon de beauté", "beaute-bien-etre", ["esthetique", "onglerie"]],
    ["spa", "Spa", "beaute-bien-etre", ["hammam", "sauna"]],
    ["barbier", "Barbier", "beaute-bien-etre", ["barbe"]],
    ["massage", "Massage", "beaute-bien-etre", []],
    ["pediatre", "Pédiatre", "sante", ["docteur enfant", "tbib d drari"]],
    ["gastro-enterologue", "Gastro-entérologue", "sante", ["gastro"]],
    ["orl", "ORL", "sante", []],
    ["dentiste", "Dentiste", "sante", ["tbib snan"]],
    ["pharmacie", "Pharmacie", "sante", ["saydalia"]],
    ["laboratoire", "Laboratoire", "sante", ["analyses"]],
    ["clinique", "Clinique", "sante", []],
    ["salle-de-sport", "Salle de sport", "loisirs-sport", ["gym", "fitness", "musculation"]],
    ["club-sportif", "Club sportif", "loisirs-sport", []],
    ["piscine", "Piscine", "loisirs-sport", ["natation", "msbah"]],
    ["terrain-de-football", "Terrain de football", "loisirs-sport", ["five", "foot a 5"]],
    ["velo", "Vélo", "loisirs-sport", ["cyclisme"]],
    ["activite-nautique", "Activité nautique", "loisirs-sport", ["surf", "kayak"]],
    ["menuisier", "Menuisier", "maison-automobile", ["najjar"]],
    ["tapissier-automobile", "Tapissier automobile", "maison-automobile", ["sellerie auto", "tapissier"]],
    ["mecanicien", "Mécanicien", "maison-automobile", ["garage auto", "mikanisyan"]],
    ["electricien", "Électricien", "maison-automobile", []],
    ["plombier", "Plombier", "maison-automobile", ["fuite d eau"]],
    ["decoration", "Décoration", "maison-automobile", []],
    ["nettoyage", "Nettoyage", "maison-automobile", ["menage"]],
    ["agence-de-voyages", "Agence de voyages", "voyage", ["voyage organise"]],
    ["hotel", "Hôtel", "voyage", ["riad"]],
    ["excursion", "Excursion", "voyage", []],
    ["transport-touristique", "Transport touristique", "voyage", []],
    ["promoteur", "Promoteur immobilier", "immobilier", ["programme immobilier"]],
    ["agence-immobiliere", "Agence immobilière", "immobilier", ["samsar"]],
    ["residence", "Résidence", "immobilier", []],
    ["syndic", "Syndic", "immobilier", []],
    ["professeur-particulier", "Professeur particulier", "education-formation", ["cours particulier"]],
    ["ecole", "École", "education-formation", []],
    ["centre-de-langues", "Centre de langues", "education-formation", ["cours d anglais"]],
    ["soutien-scolaire", "Soutien scolaire", "education-formation", ["aide aux devoirs"]],
  ];
  const categoryIds: Record<string, string> = {};
  for (const [slug, name, universe, synonyms] of categoryDefs) {
    const c = await prisma.category.create({
      data: {
        slug, name, kind: "category", parentId: universeIds[universe],
        translations: { create: [{ locale: "fr", name }] },
        synonyms: { create: synonyms.map((term) => ({ term, locale: "fr" })) },
      },
    });
    categoryIds[slug] = c.id;
  }

  // Spécialités (restauration)
  const specialtyDefs: [string, string, string][] = [
    ["sardines-grillees", "Sardines grillées", "poisson-fruits-de-mer"],
    ["poisson-grille", "Poisson grillé", "poisson-fruits-de-mer"],
    ["tajine", "Tajine", "restaurant"],
    ["couscous", "Couscous", "restaurant"],
    ["pizza", "Pizza", "restaurant"],
    ["sushi", "Sushi", "restaurant"],
    ["coloration", "Coloration", "coiffeur"],
    ["lissage", "Lissage", "coiffeur"],
  ];
  const specialtyIds: Record<string, string> = {};
  for (const [slug, name, cat] of specialtyDefs) {
    const s = await prisma.specialty.create({
      data: { slug, name, categoryId: categoryIds[cat] },
    });
    specialtyIds[slug] = s.id;
  }

  // Tags (attributs / contextes)
  const tagDefs: [string, string, string][] = [
    ["calme", "Calme", "attribute"], ["parking", "Parking", "equipment"],
    ["terrasse", "Terrasse", "equipment"], ["espace-enfants", "Espace enfants", "equipment"],
    ["wifi", "Wi-Fi", "equipment"], ["climatisation", "Climatisation", "equipment"],
    ["livraison", "Livraison", "service"], ["reservation", "Réservation", "service"],
    ["accessibilite", "Accessible PMR", "equipment"], ["ambiance-match", "Ambiance match", "context"],
    ["propre", "Très propre", "attribute"], ["a-taille-humaine", "À taille humaine", "attribute"],
  ];
  const tagIds: Record<string, string> = {};
  for (const [slug, name, kind] of tagDefs) {
    const t = await prisma.tag.create({ data: { slug, name, kind } });
    tagIds[slug] = t.id;
  }

  // Définitions d'attributs pratiques
  const attrDefs: [string, string][] = [
    ["paiement-carte", "Paiement par carte"], ["wifi", "Wi-Fi"],
    ["terrasse", "Terrasse"], ["parking", "Parking"],
    ["espace-enfants", "Espace enfants"], ["accessibilite", "Accès PMR"],
    ["livraison", "Livraison"], ["reservation", "Réservation"],
    ["climatisation", "Climatisation"], ["langues", "Langues parlées"],
  ];
  const attrDefIds: Record<string, string> = {};
  for (const [slug, name] of attrDefs) {
    const a = await prisma.attributeDefinition.create({
      data: { slug, name, kind: slug === "langues" ? "text" : "boolean" },
    });
    attrDefIds[slug] = a.id;
  }

  // ── Critères ─────────────────────────────────────────────────
  type CritDef = {
    slug: string; name: string; type: "SCALE" | "SINGLE_CHOICE" | "YES_NO" | "AMOUNT";
    options?: [string, string, number | null][]; required?: boolean; showCondition?: string;
  };
  const scale = (slug: string, name: string, required = false): CritDef => ({
    slug, name, type: "SCALE", required,
  });
  const critDefs: CritDef[] = [
    scale("proprete", "Propreté", true),
    scale("accueil", "Accueil", true),
    scale("qualite-plats", "Qualité des plats", true),
    {
      slug: "delai-commande", name: "Délai avant prise de commande", type: "SINGLE_CHOICE",
      options: [["<5", "Moins de 5 minutes", 9.5], ["5-10", "5 à 10 minutes", 8], ["10-20", "10 à 20 minutes", 5.5], [">20", "Plus de 20 minutes", 3]],
    },
    {
      slug: "delai-service", name: "Délai avant réception des plats", type: "SINGLE_CHOICE",
      options: [["<10", "Moins de 10 minutes", 9.5], ["10-20", "Entre 10 et 20 minutes", 8], ["20-40", "Entre 20 et 40 minutes", 5.5], [">40", "Plus de 40 minutes", 2.5]],
    },
    scale("rapport-qualite-prix", "Rapport qualité-prix", true),
    scale("conformite-photos", "Conformité entre les photos et la réalité"),
    scale("calme", "Calme"),
    scale("niveau-sonore", "Niveau sonore supportable"),
    scale("accueil-enfants", "Accueil des enfants", false),
    { slug: "parking-facile", name: "Stationnement facile", type: "YES_NO", options: [["oui", "Oui", 9], ["non", "Non", 3]] },
    scale("toilettes", "Qualité des toilettes"),
    { slug: "accessibilite-pmr", name: "Accessible aux personnes à mobilité réduite", type: "YES_NO", options: [["oui", "Oui", 9], ["non", "Non", 3]] },
    { slug: "prix-par-personne", name: "Prix moyen payé par personne (MAD)", type: "AMOUNT" },
    // Services / professionnels
    scale("ponctualite", "Ponctualité", true),
    scale("qualite", "Qualité du travail", true),
    scale("respect-devis", "Respect du devis"),
    scale("communication", "Communication"),
    scale("delai-tenu", "Délai tenu"),
    scale("proprete-apres", "Propreté après intervention"),
    scale("resultat-final", "Résultat final"),
    scale("sav", "Service après-vente"),
    // Activités enfants
    scale("securite", "Sécurité", true),
    scale("encadrement", "Encadrement"),
    scale("adequation-age", "Adéquation à l'âge"),
    scale("qualite-animateurs", "Qualité des animateurs"),
    scale("organisation", "Organisation"),
    scale("espace", "Espace disponible"),
    // Santé — critères prudents et non médicaux uniquement
    scale("clarte-explications", "Clarté des explications"),
    scale("disponibilite", "Disponibilité"),
    scale("transparence-tarifs", "Transparence des tarifs"),
  ];
  const critIds: Record<string, string> = {};
  for (let i = 0; i < critDefs.length; i++) {
    const d = critDefs[i];
    const c = await prisma.criterion.create({
      data: {
        slug: d.slug, name: d.name, type: d.type, required: d.required ?? false,
        sortOrder: i, showCondition: d.showCondition,
        options: d.options
          ? { create: d.options.map(([value, label, score], j) => ({ value, label, score, sortOrder: j })) }
          : undefined,
      },
    });
    critIds[d.slug] = c.id;
  }

  const restaurantCriteria = ["proprete", "accueil", "qualite-plats", "delai-commande", "delai-service", "rapport-qualite-prix", "conformite-photos", "calme", "niveau-sonore", "accueil-enfants", "parking-facile", "toilettes", "accessibilite-pmr", "prix-par-personne"];
  const serviceCriteria = ["ponctualite", "qualite", "respect-devis", "communication", "delai-tenu", "proprete-apres", "resultat-final", "sav", "accueil"];
  const kidsCriteria = ["securite", "encadrement", "proprete", "adequation-age", "qualite-animateurs", "rapport-qualite-prix", "organisation", "espace", "parking-facile"];
  const healthCriteria = ["ponctualite", "accueil", "clarte-explications", "organisation", "disponibilite", "proprete", "accessibilite-pmr", "transparence-tarifs"];
  const beautyCriteria = ["accueil", "proprete", "qualite", "rapport-qualite-prix", "ponctualite", "resultat-final"];
  const sportCriteria = ["proprete", "accueil", "espace", "rapport-qualite-prix", "organisation", "parking-facile"];

  const foodCats = ["restaurant", "cafe", "salon-de-the", "patisserie", "glacier", "traiteur", "snack", "poisson-fruits-de-mer", "rooftop", "lieu-match"];
  const kidsCats = ["aire-de-jeux", "activite-enfant", "summer-camp", "creche", "parc", "atelier-creatif"];
  const serviceCats = ["imprimerie", "pressing", "couturier", "photographe", "reparateur", "prestataire-evenementiel", "menuisier", "tapissier-automobile", "mecanicien", "electricien", "plombier", "decoration", "nettoyage", "agence-de-voyages", "excursion", "transport-touristique", "promoteur", "agence-immobiliere", "residence", "syndic", "professeur-particulier", "centre-de-langues", "soutien-scolaire", "ecole"];
  const healthCats = ["pediatre", "gastro-enterologue", "orl", "dentiste", "pharmacie", "laboratoire", "clinique"];
  const beautyCats = ["coiffeur", "salon-de-beaute", "spa", "barbier", "massage"];
  const sportCats = ["salle-de-sport", "club-sportif", "piscine", "terrain-de-football", "velo", "activite-nautique", "hotel"];

  const catCriteriaMap: Record<string, string[]> = {};
  for (const c of foodCats) catCriteriaMap[c] = restaurantCriteria;
  for (const c of kidsCats) catCriteriaMap[c] = kidsCriteria;
  for (const c of serviceCats) catCriteriaMap[c] = serviceCriteria;
  for (const c of healthCats) catCriteriaMap[c] = healthCriteria;
  for (const c of beautyCats) catCriteriaMap[c] = beautyCriteria;
  for (const c of sportCats) catCriteriaMap[c] = sportCriteria;

  for (const [cat, crits] of Object.entries(catCriteriaMap)) {
    for (let i = 0; i < crits.length; i++) {
      await prisma.categoryCriterion.create({
        data: { categoryId: categoryIds[cat], criterionId: critIds[crits[i]], sortOrder: i },
      });
    }
  }

  // ── Plans d'abonnement ───────────────────────────────────────
  const plans = await Promise.all([
    prisma.subscriptionPlan.create({ data: { slug: "gratuit", name: "Gratuit", priceMad: 0, maxPhotos: 3, statsLevel: 0, sortOrder: 0, features: ["Fiche de base", "Horaires et coordonnées", "3 photos", "Réponse aux avis", "Statistiques simples"] } }),
    prisma.subscriptionPlan.create({ data: { slug: "presence", name: "Présence", priceMad: 149, maxPhotos: 15, statsLevel: 1, sortOrder: 1, features: ["Jusqu'à 15 photos", "Menu ou catalogue", "Publications", "Bouton WhatsApp", "Statistiques enrichies", "Badge Informations vérifiées (après contrôles)", "Mise à jour prioritaire"] } }),
    prisma.subscriptionPlan.create({ data: { slug: "performance", name: "Performance", priceMad: 399, maxPhotos: 50, statsLevel: 2, sortOrder: 2, features: ["Tableau de bord avancé", "Évolution par critère", "Comparaison avec la catégorie", "Alertes", "Demandes de devis", "Réservation", "Campagnes", "Export"] } }),
    prisma.subscriptionPlan.create({ data: { slug: "reseau", name: "Réseau", priceMad: null, maxPhotos: 100, statsLevel: 3, sortOrder: 3, features: ["Multi-établissements", "Consolidation", "Utilisateurs multiples et rôles", "Export et API", "Rapports", "Accompagnement dédié"] } }),
  ]);

  // ── Utilisateurs ─────────────────────────────────────────────
  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);
  const adminHash = hash("Admin123!");
  const modHash = hash("Moderateur123!");
  const userHash = hash("Utilisateur123!");
  const proHash = hash("Professionnel123!");
  const demoHash = hash("Demo123!");

  async function createUser(
    email: string, name: string, role: "ADMIN" | "MODERATOR" | "USER" | "PROFESSIONAL" | "VERIFIED_CONTRIBUTOR",
    passwordHash: string, zoneSlug?: string, createdDaysAgo = 400
  ) {
    return prisma.user.create({
      data: {
        email, name, role, passwordHash, emailVerified: new Date(),
        createdAt: daysAgo(createdDaysAgo),
        profile: {
          create: {
            displayName: name, cityId: casablanca.id,
            zoneId: zoneSlug ? zones[zoneSlug] : undefined,
            bio: role === "USER" || role === "VERIFIED_CONTRIBUTOR" ? "Profil fictif de démonstration." : undefined,
          },
        },
        preferences: { create: { favoriteCategories: [], preferredZones: [] } },
        consents: { create: [{ kind: "cgu", granted: true, version: "1.0" }, { kind: "confidentialite", granted: true, version: "1.0" }] },
        trustScore: { create: { score: 0.5 } },
      },
    });
  }

  const admin = await createUser("admin@recofiable.demo", "Amina Berrada (démo)", "ADMIN", adminHash, "maarif", 600);
  const moderator = await createUser("moderateur@recofiable.demo", "Yassine El Fassi (démo)", "MODERATOR", modHash, "oasis", 500);
  const mainUser = await createUser("utilisateur@recofiable.demo", "Salma Idrissi (démo)", "USER", userHash, "dar-bouazza", 300);
  const proFree = await createUser("pro-gratuit@recofiable.demo", "Karim Tazi (démo)", "PROFESSIONAL", proHash, "dar-bouazza", 250);
  const proPremium = await createUser("pro-premium@recofiable.demo", "Nadia Alaoui (démo)", "PROFESSIONAL", proHash, "ain-diab", 350);

  const contributorNames = [
    "Omar Bennis", "Leila Chraibi", "Mehdi Benjelloun", "Sara Lahlou", "Youssef Amrani",
    "Imane Kabbaj", "Hamza Sqalli", "Kenza Filali", "Anas Berrada", "Rim Bouazzaoui",
    "Adam Cherkaoui", "Lina Sefrioui", "Reda Mansouri", "Ghita Benkirane", "Ilyas Zniber",
    "Nour El Houda Fassi", "Tarik Bendahmane", "Aya Skalli", "Zakaria Lamrani", "Hind Meknassi",
    "Soufiane Drissi", "Malak Tahiri", "Ayoub Regragui", "Douae Chami",
  ];
  const contributors = [];
  for (let i = 0; i < contributorNames.length; i++) {
    const name = contributorNames[i];
    const role = i < 8 ? "VERIFIED_CONTRIBUTOR" : "USER";
    const u = await createUser(
      `${slugify(name)}@exemple.demo`, `${name} (démo)`, role as "USER",
      demoHash, pick([...Object.keys(zones)]), randInt(20, 700)
    );
    contributors.push(u);
  }
  const allReviewers = [mainUser, ...contributors];

  // Réseau : la démo suit plusieurs contributeurs, cercles
  for (const target of contributors.slice(0, 8)) {
    await prisma.follow.create({ data: { followerId: mainUser.id, followedId: target.id, status: "ACCEPTED" } });
  }
  await prisma.follow.create({ data: { followerId: contributors[9].id, followedId: mainUser.id, status: "PENDING" } });
  await prisma.follow.create({ data: { followerId: contributors[10].id, followedId: mainUser.id, status: "ACCEPTED" } });
  for (const [i, target] of contributors.slice(0, 5).entries()) {
    await prisma.follow.create({ data: { followerId: target.id, followedId: contributors[(i + 5) % contributors.length].id, status: "ACCEPTED" } });
  }
  const familyCircle = await prisma.circle.create({ data: { ownerId: mainUser.id, name: "Famille", kind: "famille" } });
  const friendsCircle = await prisma.circle.create({ data: { ownerId: mainUser.id, name: "Amis", kind: "amis" } });
  await prisma.circleMember.createMany({
    data: [
      { circleId: familyCircle.id, userId: contributors[0].id },
      { circleId: familyCircle.id, userId: contributors[1].id },
      { circleId: friendsCircle.id, userId: contributors[2].id },
      { circleId: friendsCircle.id, userId: contributors[3].id },
      { circleId: friendsCircle.id, userId: contributors[4].id },
    ],
  });

  // ── Organisations professionnelles ───────────────────────────
  const orgFree = await prisma.professionalOrganization.create({
    data: { name: "Chez Karim SARL (démo)", members: { create: { userId: proFree.id, role: "owner" } } },
  });
  const orgPremium = await prisma.professionalOrganization.create({
    data: { name: "Groupe Océan Bleu (démo)", members: { create: { userId: proPremium.id, role: "owner" } } },
  });
  const subFree = await prisma.subscription.create({
    data: { organizationId: orgFree.id, planId: plans[0].id, status: "ACTIVE", startedAt: daysAgo(200) },
  });
  void subFree;
  const subPremium = await prisma.subscription.create({
    data: { organizationId: orgPremium.id, planId: plans[2].id, status: "ACTIVE", startedAt: daysAgo(150) },
  });
  for (let m = 4; m >= 0; m--) {
    await prisma.invoice.create({
      data: {
        subscriptionId: subPremium.id,
        number: `DEMO-2026-${String(200 + m)}`,
        amountMad: 399, status: "paid", issuedAt: daysAgo(m * 30 + 5), isDemo: true,
      },
    });
  }

  // ── Lieux ────────────────────────────────────────────────────
  type PlaceDef = {
    name: string; cat: string; zone: string; price?: number; level?: number;
    tags?: string[]; specialties?: string[]; img: string; desc: string;
    org?: string; claimed?: boolean; verified?: boolean;
    quality: number; // 4..9 — niveau de base des expériences générées
  };
  const P = (name: string, cat: string, zone: string, quality: number, img: string, desc: string, extra: Partial<PlaceDef> = {}): PlaceDef =>
    ({ name, cat, zone, quality, img, desc, ...extra });

  const placeDefs: PlaceDef[] = [
    // Restauration — Dar Bouazza
    P("La Table du Phare", "restaurant", "dar-bouazza", 8.4, "restaurant", "Cuisine familiale face à l'océan, plats marocains et grillades. Établissement fictif de démonstration.", { price: 120, level: 2, tags: ["calme", "parking", "terrasse", "espace-enfants", "reservation"], specialties: ["tajine"], org: "free", claimed: true, verified: true }),
    P("Sardina Beldia", "poisson-fruits-de-mer", "dar-bouazza", 8.8, "restaurant", "Petite adresse spécialisée dans les sardines grillées et la friture du jour. Fictif — démonstration.", { price: 80, level: 1, tags: ["terrasse", "a-taille-humaine"], specialties: ["sardines-grillees", "poisson-grille"] }),
    P("Riad des Vagues", "restaurant", "dar-bouazza", 7.6, "restaurant", "Restaurant avec patio ombragé, couscous le vendredi. Fictif — démonstration.", { price: 140, level: 2, tags: ["calme", "parking", "reservation"], specialties: ["couscous", "tajine"] }),
    P("Pizzeria Del Mare", "restaurant", "dar-bouazza", 7.2, "restaurant", "Pizzas au feu de bois, ambiance décontractée. Fictif — démonstration.", { price: 95, level: 2, tags: ["terrasse", "livraison", "espace-enfants"], specialties: ["pizza"] }),
    P("Café Littoral", "cafe", "dar-bouazza", 7.9, "cafe", "Café calme avec terrasse et Wi-Fi, idéal pour travailler. Fictif — démonstration.", { price: 35, level: 1, tags: ["calme", "wifi", "terrasse", "parking"] }),
    P("Glacier Vague d'Été", "glacier", "dar-bouazza", 8.2, "restaurant", "Glaces artisanales, ouvert tard en été. Fictif — démonstration.", { price: 30, level: 1, tags: ["terrasse", "espace-enfants"] }),
    P("Snack Chez Bouchaib", "snack", "dar-bouazza", 6.4, "restaurant", "Snack rapide, sandwichs et jus. Fictif — démonstration.", { price: 45, level: 1, tags: ["livraison"] }),
    // Restauration — Ain Diab
    P("L'Océan Bleu", "poisson-fruits-de-mer", "ain-diab", 8.6, "restaurant", "Table de poisson réputée sur la corniche, arrivage du jour. Fictif — démonstration.", { price: 260, level: 3, tags: ["parking", "terrasse", "reservation", "climatisation"], specialties: ["poisson-grille", "sardines-grillees"], org: "premium", claimed: true, verified: true }),
    P("Rooftop Almohades", "rooftop", "ain-diab", 7.8, "restaurant", "Rooftop avec vue mer, tapas et jus frais. Fictif — démonstration.", { price: 180, level: 3, tags: ["terrasse", "reservation"] }),
    P("Brasserie de la Corniche", "restaurant", "ain-diab", 7.1, "restaurant", "Grande brasserie animée, plats internationaux. Fictif — démonstration.", { price: 160, level: 3, tags: ["parking", "climatisation", "ambiance-match"] }),
    P("Sushi Marsa", "restaurant", "ain-diab", 8.1, "restaurant", "Comptoir à sushis, produits frais. Fictif — démonstration.", { price: 220, level: 3, tags: ["livraison", "reservation", "climatisation"], specialties: ["sushi"] }),
    P("Café des Surfeurs", "cafe", "ain-diab", 7.4, "cafe", "Café face aux vagues, petits déjeuners copieux. Fictif — démonstration.", { price: 45, level: 2, tags: ["terrasse", "wifi"] }),
    // Restauration — Maârif / Centre / autres
    P("Dar Zellij", "restaurant", "maarif", 8.3, "restaurant", "Cuisine marocaine raffinée dans un décor traditionnel. Fictif — démonstration.", { price: 190, level: 3, tags: ["calme", "reservation", "climatisation"], specialties: ["tajine", "couscous"] }),
    P("Le Comptoir du Maârif", "restaurant", "maarif", 6.8, "restaurant", "Bistrot de quartier, plat du jour à petit prix. Fictif — démonstration.", { price: 75, level: 1, tags: ["a-taille-humaine"] }),
    P("Pâtisserie Amande & Miel", "patisserie", "maarif", 8.7, "restaurant", "Pâtisserie marocaine et viennoiseries. Fictif — démonstration.", { price: 25, level: 1, tags: ["propre"] }),
    P("Salon de thé Menthe Fraîche", "salon-de-the", "centre-ville", 7.5, "cafe", "Salon de thé historique du centre-ville. Fictif — démonstration.", { price: 30, level: 1, tags: ["calme", "wifi"] }),
    P("Le Stade Café", "lieu-match", "maarif", 7.7, "cafe", "Grand écran, ambiance garantie les soirs de match. Fictif — démonstration.", { price: 40, level: 1, tags: ["ambiance-match", "climatisation"] }),
    P("Traiteur Dar Diafa", "traiteur", "californie", 8.0, "restaurant", "Traiteur pour réceptions, tables de 10 à 200 personnes avec service. Fictif — démonstration.", { price: 250, level: 3, tags: ["reservation"] }),
    P("Café Oasis Garden", "cafe", "oasis", 7.0, "cafe", "Café de quartier avec petite terrasse ombragée. Fictif — démonstration.", { price: 30, level: 1, tags: ["terrasse", "calme"] }),
    P("Grill House Bouskoura", "restaurant", "bouskoura", 7.3, "restaurant", "Grillades et brochettes, grande salle familiale. Fictif — démonstration.", { price: 110, level: 2, tags: ["parking", "espace-enfants"] }),
    // Enfants et famille
    P("Kidoland", "aire-de-jeux", "californie", 8.1, "enfants", "Aire de jeux couverte pour les 2-10 ans, espace parents. Fictif — démonstration.", { price: 80, level: 2, tags: ["espace-enfants", "parking", "climatisation"] }),
    P("Atelier des Petits Artistes", "atelier-creatif", "maarif", 8.5, "enfants", "Ateliers peinture et poterie pour enfants dès 4 ans. Fictif — démonstration.", { price: 120, level: 2, tags: ["a-taille-humaine", "calme"] }),
    P("Summer Camp Océan", "summer-camp", "dar-bouazza", 7.9, "enfants", "Camp d'été multi-activités en bord de mer. Fictif — démonstration.", { price: 350, level: 3, tags: ["espace-enfants", "parking"] }),
    P("Crèche Les Poussins", "creche", "oasis", 8.2, "enfants", "Crèche bilingue à taille humaine. Fictif — démonstration.", { price: 2500, level: 3, tags: ["a-taille-humaine", "propre"] }),
    P("Parc de Sindibad (fictif)", "parc", "ain-diab", 7.0, "enfants", "Parc d'attractions familial. Version fictive de démonstration.", { price: 150, level: 2, tags: ["parking", "espace-enfants"] }),
    P("Happy Jump", "aire-de-jeux", "sidi-maarouf", 6.9, "enfants", "Trampolines et structures gonflables. Fictif — démonstration.", { price: 90, level: 2, tags: ["parking", "climatisation"] }),
    // Services du quotidien
    P("Imprimerie Express Maârif", "imprimerie", "maarif", 8.0, "maison", "Impression couleur, reliure de rapports, petits prix étudiants. Fictif — démonstration.", { price: 50, level: 1, tags: ["a-taille-humaine"] }),
    P("Pressing du Rond-Point", "pressing", "oasis", 7.4, "maison", "Pressing de quartier, délais rapides. Fictif — démonstration.", { price: 40, level: 1, tags: [] }),
    P("Studio Photo Lumière", "photographe", "centre-ville", 8.3, "maison", "Photos d'identité, shootings famille et événements. Fictif — démonstration.", { price: 300, level: 2, tags: ["reservation"] }),
    P("Couture Fil d'Or", "couturier", "maarif", 8.6, "maison", "Retouches et caftans sur mesure. Fictif — démonstration.", { price: 150, level: 2, tags: ["a-taille-humaine"] }),
    P("Événements Andalous", "prestataire-evenementiel", "californie", 7.6, "maison", "Organisation de mariages et anniversaires. Fictif — démonstration.", { price: 5000, level: 4, tags: ["reservation"] }),
    // Beauté
    P("Salon Nour Coiffure", "coiffeur", "maarif", 8.4, "beaute", "Coloration et lissage, équipe expérimentée. Fictif — démonstration.", { price: 250, level: 2, tags: ["reservation", "climatisation"], specialties: ["coloration", "lissage"] }),
    P("Barbier du Coin", "barbier", "centre-ville", 8.0, "beaute", "Barbe et coupe à l'ancienne. Fictif — démonstration.", { price: 60, level: 1, tags: ["a-taille-humaine"] }),
    P("Spa Argan & Roses", "spa", "ain-diab", 8.5, "beaute", "Hammam traditionnel et massages à l'huile d'argan. Fictif — démonstration.", { price: 400, level: 3, tags: ["calme", "reservation", "propre"] }),
    P("Beauté des Ongles", "salon-de-beaute", "californie", 7.2, "beaute", "Onglerie et soins esthétiques. Fictif — démonstration.", { price: 120, level: 2, tags: ["reservation"] }),
    // Santé
    P("Dr Fictif Bennani — Pédiatre", "pediatre", "maarif", 8.7, "sante", "Cabinet de pédiatrie. Praticien fictif créé pour la démonstration ; aucune évaluation médicale n'est proposée.", { price: 300, level: 2, tags: ["accessibilite", "calme"] }),
    P("Dr Fictif Ouazzani — Pédiatre", "pediatre", "dar-bouazza", 8.1, "sante", "Cabinet de pédiatrie proche de Dar Bouazza. Praticien fictif de démonstration.", { price: 250, level: 2, tags: ["parking"] }),
    P("Cabinet Dentaire Sourire", "dentiste", "oasis", 7.9, "sante", "Cabinet dentaire. Fictif — démonstration ; critères d'accueil et d'organisation uniquement.", { price: 400, level: 2, tags: ["accessibilite"] }),
    P("Pharmacie de la Plage", "pharmacie", "dar-bouazza", 8.3, "sante", "Pharmacie de garde fréquente, équipe disponible. Fictif — démonstration.", { price: 0, level: 1, tags: ["parking", "accessibilite"] }),
    P("Laboratoire BioAtlas", "laboratoire", "maarif", 7.8, "sante", "Analyses médicales, résultats en ligne. Fictif — démonstration.", { price: 200, level: 2, tags: ["accessibilite", "parking"] }),
    P("Clinique Les Palmiers (fictive)", "clinique", "californie", 7.5, "sante", "Clinique pluridisciplinaire fictive de démonstration.", { price: 0, level: 3, tags: ["parking", "accessibilite"] }),
    // Sport / loisirs
    P("Atlas Fitness Club", "salle-de-sport", "sidi-maarouf", 7.6, "sport", "Salle de sport avec coachs et cours collectifs. Fictif — démonstration.", { price: 300, level: 2, tags: ["parking", "climatisation", "propre"] }),
    P("Gym'Ocean", "salle-de-sport", "dar-bouazza", 8.2, "sport", "Salle à taille humaine, très propre, coaching personnalisé. Fictif — démonstration.", { price: 350, level: 2, tags: ["a-taille-humaine", "propre", "parking"] }),
    P("Five Stars Foot", "terrain-de-football", "bouskoura", 7.8, "sport", "Terrains de foot à 5 éclairés. Fictif — démonstration.", { price: 60, level: 1, tags: ["parking", "reservation"] }),
    P("Piscine Aqua Salé", "piscine", "californie", 7.1, "sport", "Piscine semi-olympique, créneaux famille. Fictif — démonstration.", { price: 70, level: 2, tags: ["parking", "espace-enfants"] }),
    P("Surf School Dar Bouazza", "activite-nautique", "dar-bouazza", 8.8, "sport", "École de surf pour petits et grands. Fictif — démonstration.", { price: 200, level: 2, tags: ["parking"] }),
    // Maison / auto
    P("Menuiserie Bois Noble", "menuisier", "sidi-maarouf", 8.1, "maison", "Cuisines et dressings sur mesure. Fictif — démonstration.", { price: 8000, level: 3, tags: [] }),
    P("Sellerie Auto Prestige", "tapissier-automobile", "sidi-maarouf", 8.5, "maison", "Tapisserie automobile cuir et tissu, sièges et ciels de toit. Fictif — démonstration.", { price: 2500, level: 3, tags: ["parking"] }),
    P("Garage Mécanique Atlas", "mecanicien", "oasis", 7.3, "maison", "Entretien toutes marques, devis affichés. Fictif — démonstration.", { price: 500, level: 2, tags: ["parking"] }),
    P("Électricité Pro Services", "electricien", "bouskoura", 7.7, "maison", "Dépannage et installations électriques. Fictif — démonstration.", { price: 300, level: 2, tags: [] }),
    P("Plomberie Rapide Casa", "plombier", "centre-ville", 6.6, "maison", "Interventions d'urgence 7 j/7. Fictif — démonstration.", { price: 250, level: 2, tags: [] }),
    P("Nettoyage Éclat Maison", "nettoyage", "californie", 7.9, "maison", "Ménage à domicile et fin de chantier. Fictif — démonstration.", { price: 200, level: 2, tags: [] }),
    // Voyage / immobilier / éducation
    P("Agence Horizon Voyages", "agence-de-voyages", "centre-ville", 7.7, "autre", "Omra, circuits et billetterie. Fictif — démonstration.", { price: 0, level: 2, tags: [] }),
    P("Hôtel Riad Amwaj (fictif)", "hotel", "ain-diab", 8.0, "autre", "Hôtel de charme en bord de mer. Fictif — démonstration.", { price: 900, level: 3, tags: ["parking", "reservation", "climatisation"] }),
    P("Promoteur Al Boughaz (fictif)", "promoteur", "bouskoura", 6.2, "autre", "Programmes résidentiels. Promoteur fictif créé pour la démonstration.", { price: 0, level: 3, tags: [] }),
    P("Agence Immo Littoral", "agence-immobiliere", "dar-bouazza", 7.4, "autre", "Vente et location sur la côte. Fictif — démonstration.", { price: 0, level: 2, tags: [] }),
    P("Syndic Confiance Plus", "syndic", "californie", 6.8, "autre", "Gestion de copropriétés. Fictif — démonstration.", { price: 0, level: 2, tags: [] }),
    P("Centre de Langues Polyglotte", "centre-de-langues", "maarif", 8.3, "autre", "Anglais, espagnol et allemand, petits groupes. Fictif — démonstration.", { price: 1200, level: 2, tags: ["a-taille-humaine", "climatisation"] }),
    P("Soutien Scolaire Réussite", "soutien-scolaire", "oasis", 8.0, "autre", "Accompagnement primaire et collège. Fictif — démonstration.", { price: 150, level: 2, tags: ["a-taille-humaine"] }),
    P("École Les Cèdres (fictive)", "ecole", "bouskoura", 7.6, "autre", "École privée fictive de démonstration.", { price: 3000, level: 3, tags: ["parking"] }),
    P("Prof de Maths M. Fictif Alami", "professeur-particulier", "maarif", 8.6, "autre", "Cours particuliers de mathématiques lycée. Fictif — démonstration.", { price: 200, level: 2, tags: [] }),
    P("Club Vélo Casablanca", "velo", "ain-diab", 7.9, "sport", "Sorties vélo encadrées le week-end. Fictif — démonstration.", { price: 100, level: 1, tags: [] }),
    P("Réparateur Multiservices Sidi Maârouf", "reparateur", "sidi-maarouf", 7.2, "maison", "Petit électroménager et téléphonie. Fictif — démonstration.", { price: 150, level: 1, tags: [] }),
    P("Excursions Atlas Découverte", "excursion", "centre-ville", 8.4, "autre", "Excursions d'une journée au départ de Casablanca. Fictif — démonstration.", { price: 450, level: 2, tags: ["reservation"] }),
    P("Résidence Les Dunes (fictive)", "residence", "dar-bouazza", 7.0, "autre", "Résidence balnéaire fictive de démonstration.", { price: 0, level: 3, tags: ["parking"] }),
  ];

  const placeRecords: { id: string; def: PlaceDef; slug: string }[] = [];
  for (const def of placeDefs) {
    const slug = slugify(def.name);
    const place = await prisma.place.create({
      data: {
        slug, name: def.name, categoryId: categoryIds[def.cat],
        cityId: casablanca.id, zoneId: zones[def.zone],
        description: def.desc,
        priceLevel: def.level ?? null,
        avgPricePerPerson: def.price && def.price > 0 ? def.price : null,
        phone: "+212 6 00 00 00 00",
        whatsapp: def.tags?.includes("reservation") ? "+212600000000" : null,
        address: `Adresse fictive, ${def.zone.replace(/-/g, " ")}, Casablanca`,
        claimed: def.claimed ?? false,
        verified: def.verified ?? false,
        organizationId: def.org === "free" ? orgFree.id : def.org === "premium" ? orgPremium.id : null,
        createdAt: daysAgo(randInt(100, 600)),
        location: { create: { lat: 33.45 + rand() * 0.2, lng: -7.8 + rand() * 0.25 } },
        photos: {
          create: [
            { url: demoImage(def.img), source: "community", caption: "Photo fictive de démonstration" },
            { url: demoImage(def.img), source: def.claimed ? "professional" : "community", caption: "Photo fictive de démonstration" },
          ],
        },
        tags: { create: (def.tags ?? []).map((t) => ({ tagId: tagIds[t] })) },
        specialtiesJoin: {
          create: (def.specialties ?? []).map((s) => ({ specialtyId: specialtyIds[s] })),
        },
        attributes: {
          create: (def.tags ?? [])
            .filter((t) => attrDefIds[t])
            .map((t) => ({ definitionId: attrDefIds[t], value: "true", source: def.claimed ? "professional" : "community" })),
        },
        hours: {
          create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            dayOfWeek: day,
            openMin: def.cat === "cafe" ? 7 * 60 : 9 * 60,
            closeMin: def.cat === "glacier" || def.cat === "lieu-match" ? 24 * 60 - 1 : 22 * 60,
          })),
        },
      },
    });
    placeRecords.push({ id: place.id, def, slug });
  }

  // Historique de quelques fiches
  await prisma.placeHistory.createMany({
    data: [
      { placeId: placeRecords[0].id, kind: "renovation", detail: "Rénovation de la terrasse (donnée fictive)", createdAt: daysAgo(90) },
      { placeId: placeRecords[7].id, kind: "menu", detail: "Nouveau menu poissons du jour (donnée fictive)", createdAt: daysAgo(45) },
      { placeId: placeRecords[13].id, kind: "proprietaire", detail: "Changement de propriétaire (donnée fictive)", createdAt: daysAgo(200) },
    ],
  });

  // ── Expériences ──────────────────────────────────────────────
  const foodComments = [
    "Plats copieux et service souriant, la terrasse est agréable en fin de journée.",
    "Nous sommes venus en famille un samedi midi : accueil chaleureux et enfants bien installés.",
    "Le service a pris un peu de temps mais les plats en valaient la peine.",
    "Très bon rapport qualité-prix, portions généreuses.",
    "Cadre propre et calme, idéal pour discuter tranquillement.",
    "Les photos correspondent à la réalité, c'est assez rare pour être signalé.",
    "Un peu bruyant aux heures de pointe, mieux vaut venir tôt.",
    "Parking facile juste devant, un vrai plus dans le quartier.",
    "L'addition est un peu montée avec les suppléments, à surveiller.",
    "Poisson très frais, on sent l'arrivage du jour.",
  ];
  const serviceComments = [
    "Travail soigné et délai respecté, je recommande pour ce type de prestation.",
    "Bon contact et devis clair dès le départ.",
    "Le prix final était légèrement supérieur au devis, mais la qualité est là.",
    "Ponctuel et efficace, chantier laissé propre.",
    "Bonne communication tout au long de la prestation.",
    "Le résultat final dépasse mes attentes.",
    "Petit retard au rendez-vous mais prestation sérieuse.",
  ];
  const kidsComments = [
    "Encadrement attentif et locaux propres, les enfants ont adoré.",
    "Bien adapté aux 4-8 ans, les animateurs sont patients.",
    "Un peu d'attente à l'entrée le week-end, venez tôt.",
    "Espace sécurisé et personnel vigilant.",
    "Très bonne organisation pour l'anniversaire de ma fille.",
  ];
  const healthComments = [
    "Cabinet bien organisé, peu d'attente et explications claires.",
    "Accueil agréable et secrétariat réactif.",
    "Tarifs affichés clairement, rendez-vous facile à obtenir.",
    "Salle d'attente propre, jouets pour les enfants.",
    "Un peu d'attente ce jour-là, mais bonne écoute.",
  ];
  const beautyComments = [
    "Coloration réussie et conseils honnêtes sur l'entretien.",
    "Salon propre, matériel désinfecté devant vous.",
    "Résultat conforme à ce que j'avais demandé.",
    "Prise de rendez-vous simple par téléphone, horaires respectés.",
  ];
  const sportComments = [
    "Salle propre et machines bien entretenues.",
    "Vestiaires corrects, affluence raisonnable le matin.",
    "Coachs disponibles et de bon conseil.",
    "Bonne ambiance, matériel un peu vieillissant sur certaines zones.",
  ];
  const commentPools: Record<string, string[]> = {};
  for (const c of foodCats) commentPools[c] = foodComments;
  for (const c of kidsCats) commentPools[c] = kidsComments;
  for (const c of serviceCats) commentPools[c] = serviceComments;
  for (const c of healthCats) commentPools[c] = healthComments;
  for (const c of beautyCats) commentPools[c] = beautyComments;
  for (const c of sportCats) commentPools[c] = sportComments;

  const contexts = ["famille", "couple", "amis", "solo", "travail"];
  const levels: VerificationLevel[] = ["DECLARED", "COHERENT", "VISIT_CONFIRMED", "TRANSACTION_CONFIRMED"];
  const levelLabels: Record<VerificationLevel, string> = {
    DECLARED: "Expérience déclarée",
    COHERENT: "Expérience cohérente",
    VISIT_CONFIRMED: "Visite confirmée",
    TRANSACTION_CONFIRMED: "Achat confirmé",
  };

  // Critères par catégorie, avec leurs options chargées
  const criteriaByCategory = new Map<string, { id: string; slug: string; type: string; options: { value: string; score: number | null }[] }[]>();
  for (const [cat, critSlugs] of Object.entries(catCriteriaMap)) {
    const rows = [];
    for (const cs of critSlugs) {
      const options = await prisma.criterionOption.findMany({ where: { criterionId: critIds[cs] } });
      const def = critDefs.find((d) => d.slug === cs)!;
      rows.push({ id: critIds[cs], slug: cs, type: def.type, options: options.map((o) => ({ value: o.value, score: o.score })) });
    }
    criteriaByCategory.set(cat, rows);
  }

  let totalReviews = 0;
  const reviewsByUser = new Map<string, number>();
  for (const { id: placeId, def } of placeRecords) {
    const crits = criteriaByCategory.get(def.cat) ?? [];
    const count = randInt(4, 9);
    const usedUsers = new Set<string>();
    for (let r = 0; r < count; r++) {
      let reviewer = pick(allReviewers);
      let guard = 0;
      while (usedUsers.has(reviewer.id) && guard++ < 10) reviewer = pick(allReviewers);
      if (usedUsers.has(reviewer.id)) continue;
      usedUsers.add(reviewer.id);

      const visitedAt = daysAgo(randInt(3, 500));
      const level = pick([levels[0], levels[0], levels[1], levels[2], levels[2], levels[3]]);
      const context = pick(contexts);
      const noise = () => Math.max(1, Math.min(10, def.quality + (rand() * 3 - 1.5)));

      const answers: { criterionId: string; value: string; score: number | null }[] = [];
      for (const crit of crits) {
        if (crit.type === "SCALE") {
          const s = Math.round(noise() * 2) / 2;
          answers.push({ criterionId: crit.id, value: String(s), score: s });
        } else if (crit.type === "SINGLE_CHOICE" || crit.type === "YES_NO") {
          // choisit une option cohérente avec la qualité du lieu
          const sorted = [...crit.options].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
          const idx = def.quality >= 8 ? (rand() < 0.75 ? 0 : 1)
            : def.quality >= 7 ? Math.min(sorted.length - 1, randInt(0, 2))
            : Math.min(sorted.length - 1, randInt(1, sorted.length - 1));
          const opt = sorted[Math.min(idx, sorted.length - 1)];
          answers.push({ criterionId: crit.id, value: opt.value, score: opt.score });
        } else if (crit.type === "AMOUNT" && def.price) {
          const paid = Math.round(def.price * (0.8 + rand() * 0.5));
          answers.push({ criterionId: crit.id, value: String(paid), score: null });
        }
      }

      const pool = commentPools[def.cat] ?? serviceComments;
      const review = await prisma.review.create({
        data: {
          placeId, userId: reviewer.id, status: "PUBLISHED",
          mode: pick(["express", "express", "guide", "detaille"]),
          visitedAt, context,
          groupType: context === "famille" ? "2 adultes, 2 enfants" : context === "couple" ? "2 adultes" : null,
          comment: pick(pool),
          positives: rand() < 0.5 ? "Voir les critères notés." : null,
          tip: rand() < 0.25 ? "Pensez à réserver le week-end." : null,
          pricePaid: def.price && def.price > 0 ? Math.round(def.price * (0.8 + rand() * 0.5)) : null,
          helpfulCount: randInt(0, 14),
          createdAt: visitedAt,
          answers: { create: answers.map((a) => ({ criterionId: a.criterionId, value: a.value, score: a.score })) },
          verification: { create: { level, method: levelLabels[level] } },
          photos: rand() < 0.3 ? { create: [{ url: demoImage(def.img) }] } : undefined,
        },
      });
      void review;
      totalReviews++;
      reviewsByUser.set(reviewer.id, (reviewsByUser.get(reviewer.id) ?? 0) + 1);
    }
  }
  console.log(`Expériences créées : ${totalReviews}`);

  // ── Anomalie : vague d'avis suspecte sur le promoteur ────────
  const wavePlace = placeRecords.find((p) => p.def.cat === "promoteur")!;
  const fraudCase = await prisma.fraudCase.create({
    data: {
      title: `Vague inhabituelle — ${wavePlace.def.name}`,
      riskScore: 0.82, status: "UNDER_REVIEW",
    },
  });
  const waveText = "Promoteur très sérieux, livraison dans les délais, je recommande vivement ce programme à tout le monde.";
  const waveUsers = [];
  for (let i = 0; i < 7; i++) {
    const u = await createUser(`compte-recent-${i + 1}@exemple.demo`, `Compte Récent ${i + 1} (démo)`, "USER", demoHash, "bouskoura", 2);
    waveUsers.push(u);
  }
  const promoCrits = criteriaByCategory.get("promoteur") ?? [];
  for (let i = 0; i < waveUsers.length; i++) {
    const review = await prisma.review.create({
      data: {
        placeId: wavePlace.id, userId: waveUsers[i].id,
        status: "NEUTRALIZED", weight: 0, riskScore: 0.85,
        visitedAt: daysAgo(2), createdAt: new Date(daysAgo(2).getTime() + i * 4 * 60_000),
        comment: waveText + (i % 2 === 0 ? "" : " Vraiment top."),
        context: "solo",
        answers: {
          create: promoCrits
            .filter((c) => c.type === "SCALE")
            .map((c) => ({ criterionId: c.id, value: "10", score: 10 })),
        },
        verification: { create: { level: "DECLARED", method: "Expérience déclarée" } },
      },
    });
    await prisma.fraudSignal.createMany({
      data: [
        { kind: "burst", severity: 0.6, detail: "7 avis en moins d'une heure", reviewId: review.id, userId: waveUsers[i].id, caseId: fraudCase.id },
        { kind: "duplicate-text", severity: 0.7, detail: "Texte quasi identique aux autres avis de la vague", reviewId: review.id, caseId: fraudCase.id },
        { kind: "single-place", severity: 0.5, detail: "Compte créé il y a 2 jours, un seul lieu évalué", userId: waveUsers[i].id, caseId: fraudCase.id },
      ],
    });
  }
  await prisma.fraudWave.create({
    data: {
      placeId: wavePlace.id, caseId: fraudCase.id, startedAt: daysAgo(2),
      reviewCount: 7, avgRating: 10, riskScore: 0.85, status: "detected",
      note: "Concentration de notes maximales, textes quasi identiques, comptes créés récemment.",
    },
  });

  // ── Avis en modération + signalements ────────────────────────
  const modReview = await prisma.review.create({
    data: {
      placeId: placeRecords[12].id, userId: contributors[15].id,
      status: "PENDING_MODERATION", visitedAt: daysAgo(6),
      comment: "Le gérant est un escroc connu de tout le quartier, fuyez.",
      context: "solo",
      verification: { create: { level: "DECLARED", method: "Expérience déclarée" } },
    },
  });
  await prisma.moderationReport.create({
    data: {
      reporterId: proFree.id, reviewId: modReview.id, targetKind: "review",
      reason: "injurieux", detail: "Accusation grave sans élément factuel.", status: "OPEN",
    },
  });
  await prisma.moderationReport.create({
    data: {
      reporterId: contributors[3].id, placeId: placeRecords[52].id, targetKind: "place",
      reason: "incorrect", detail: "Les horaires affichés ne semblent plus à jour.", status: "OPEN",
    },
  });
  const decidedReport = await prisma.moderationReport.create({
    data: {
      reporterId: contributors[6].id, reviewId: modReview.id, targetKind: "review",
      reason: "faux-avis", detail: "Le compte n'a jamais visité le lieu selon moi.", status: "RESOLVED",
    },
  });
  const decision = await prisma.moderationDecision.create({
    data: {
      reportId: decidedReport.id, moderatorId: moderator.id, action: "ask-proof",
      reason: "Demande de précision envoyée à l'auteur avant toute décision.",
    },
  });
  await prisma.appeal.create({
    data: {
      decisionId: decision.id, userId: contributors[15].id,
      body: "Je maintiens mon expérience et peux fournir mon ticket.", status: "open",
    },
  });

  // ── Réponses professionnelles ────────────────────────────────
  const oceanReviews = await prisma.review.findMany({
    where: { placeId: placeRecords[7].id, status: "PUBLISHED" }, take: 2,
  });
  for (const r of oceanReviews) {
    await prisma.professionalResponse.create({
      data: {
        reviewId: r.id, authorId: proPremium.id,
        body: "Merci pour votre retour détaillé. Nous avons partagé vos remarques avec l'équipe de salle. Au plaisir de vous accueillir à nouveau. (Réponse fictive de démonstration)",
      },
    });
  }

  // ── Recalcul des notes (2 passes pour stabiliser le prior) ───
  const { recomputePlaceRating } = await import("../src/server/services/recompute");
  for (let pass = 0; pass < 2; pass++) {
    for (const { id } of placeRecords) await recomputePlaceRating(id);
  }
  console.log("Notes publiques recalculées (moyenne bayésienne).");

  // ── Scores de confiance des contributeurs ────────────────────
  const { computeTrustScore, computeBadges } = await import("../src/server/services/trust");
  for (const u of allReviewers) {
    const contributions = reviewsByUser.get(u.id) ?? 0;
    const verified = Math.round(contributions * 0.4);
    const input = {
      accountAgeDays: Math.round((Date.now() - u.createdAt.getTime()) / 86400_000),
      emailVerified: true, phoneVerified: rand() < 0.4,
      contributions, verifiedContributions: verified,
      distinctPlaces: contributions, confirmedFlags: 0,
      deletedByModeration: 0, duplicateTexts: 0, helpfulVotes: randInt(0, 20),
    };
    await prisma.trustScore.update({
      where: { userId: u.id },
      data: {
        score: computeTrustScore(input), contributions,
        verifiedRate: contributions ? verified / contributions : 0,
        diversity: contributions,
      },
    });
    const profile = await prisma.userProfile.findUnique({ where: { userId: u.id } });
    if (profile) {
      const badges = computeBadges({ ...input, detailed: Math.round(contributions / 2), photos: randInt(0, 15), familyReviews: randInt(0, 8), foodReviews: randInt(0, 12) });
      for (const b of badges) {
        await prisma.userBadge.upsert({
          where: { profileId_code: { profileId: profile.id, code: b.code } },
          create: { profileId: profile.id, code: b.code, label: b.label },
          update: {},
        });
      }
    }
  }

  // ── Favoris, listes ──────────────────────────────────────────
  const favTargets = [0, 1, 4, 20, 44].map((i) => placeRecords[i]);
  for (const t of favTargets) {
    await prisma.favorite.create({ data: { userId: mainUser.id, placeId: t.id } });
  }
  const list1 = await prisma.list.create({
    data: {
      ownerId: mainUser.id, title: "Sorties avec les enfants",
      description: "Nos adresses testées et approuvées en famille (liste fictive de démonstration).",
      visibility: "public", shareToken: "demo-sorties-enfants",
      items: {
        create: [placeRecords[0], placeRecords[20], placeRecords[24], placeRecords[45]].map((p, i) => ({
          placeId: p.id, sortOrder: i, note: i === 0 ? "Parfait le samedi midi" : null,
        })),
      },
      collaborators: { create: { userId: contributors[0].id } },
    },
  });
  void list1;
  await prisma.list.create({
    data: {
      ownerId: mainUser.id, title: "Restaurants à tester",
      visibility: "private",
      items: { create: [placeRecords[10], placeRecords[12]].map((p, i) => ({ placeId: p.id, sortOrder: i })) },
    },
  });
  await prisma.list.create({
    data: {
      ownerId: contributors[2].id, title: "Bonnes adresses à Dar Bouazza",
      description: "Sélection fictive de démonstration autour de Dar Bouazza.",
      visibility: "public", shareToken: "demo-dar-bouazza",
      items: { create: [placeRecords[0], placeRecords[1], placeRecords[4], placeRecords[5]].map((p, i) => ({ placeId: p.id, sortOrder: i })) },
    },
  });

  // ── Questions communautaires ─────────────────────────────────
  const q1 = await prisma.question.create({
    data: {
      userId: mainUser.id,
      title: "Je cherche un endroit calme à Dar Bouazza pour sortir avec deux enfants",
      body: "Idéalement avec parking et un budget raisonnable, pour un déjeuner de week-end.",
      citySlug: "casablanca", zoneSlug: "dar-bouazza", categorySlug: "restaurant",
      status: "answered", createdAt: daysAgo(20),
    },
  });
  await prisma.questionAnswer.create({
    data: {
      questionId: q1.id, userId: contributors[0].id, placeSlug: placeRecords[0].slug,
      body: "La Table du Phare est parfaite pour ça : terrasse calme, espace enfants et parking juste devant. Comptez environ 120 MAD par personne.",
      votes: 6, createdAt: daysAgo(19),
    },
  });
  await prisma.questionAnswer.create({
    data: {
      questionId: q1.id, userId: contributors[2].id, placeSlug: placeRecords[3].slug,
      body: "La Pizzeria Del Mare marche bien avec les enfants aussi, service rapide.",
      votes: 3, createdAt: daysAgo(18),
    },
  });
  const q2 = await prisma.question.create({
    data: {
      userId: contributors[5].id,
      title: "Où manger de bonnes sardines grillées à Casablanca ?",
      citySlug: "casablanca", categorySlug: "poisson-fruits-de-mer",
      status: "answered", createdAt: daysAgo(12),
    },
  });
  await prisma.questionAnswer.create({
    data: {
      questionId: q2.id, userId: contributors[1].id, placeSlug: placeRecords[1].slug,
      body: "Sardina Beldia à Dar Bouazza : simple, frais et vraiment pas cher.",
      votes: 8, createdAt: daysAgo(11),
    },
  });
  await prisma.question.create({
    data: {
      userId: contributors[8].id,
      title: "Quel tapissier automobile recommandez-vous pour refaire des sièges en cuir ?",
      citySlug: "casablanca", categorySlug: "tapissier-automobile",
      status: "open", createdAt: daysAgo(3),
    },
  });
  await prisma.question.create({
    data: {
      userId: contributors[12].id,
      title: "Ce promoteur immobilier est-il fiable ?",
      body: "Je vois beaucoup d'avis très positifs publiés récemment, est-ce normal ?",
      citySlug: "casablanca", categorySlug: "promoteur",
      status: "open", createdAt: daysAgo(1),
    },
  });

  // ── Missions ─────────────────────────────────────────────────
  const mission1 = await prisma.mission.create({
    data: {
      title: "Quels restaurants accueillent bien les enfants à Dar Bouazza ?",
      objective: "Évaluer l'accueil des enfants (espace, chaises hautes, patience du personnel) dans les restaurants de la zone.",
      citySlug: "casablanca", zoneSlug: "dar-bouazza", categorySlug: "restaurant",
      criteria: "accueil-enfants, espace-enfants, calme",
      startsAt: daysAgo(30), endsAt: daysAgo(-30), targetCount: 20,
      badgeCode: "family", reward: "Badge Spécialiste famille",
    },
  });
  for (const c of contributors.slice(0, 4)) {
    await prisma.missionContribution.create({
      data: { missionId: mission1.id, userId: c.id, note: "Contribution fictive de démonstration" },
    });
  }
  await prisma.mission.create({
    data: {
      title: "Où manger après 22 heures ?",
      objective: "Recenser les adresses réellement ouvertes tard le soir et vérifier leurs horaires.",
      citySlug: "casablanca", categorySlug: "restaurant",
      criteria: "horaires, delai-service",
      startsAt: daysAgo(10), endsAt: daysAgo(-50), targetCount: 15,
    },
  });
  await prisma.mission.create({
    data: {
      title: "Quels prestataires communiquent clairement leurs tarifs ?",
      objective: "Vérifier la transparence des devis et des prix affichés chez les prestataires maison.",
      citySlug: "casablanca", categorySlug: "plombier",
      criteria: "transparence-tarifs, respect-devis",
      startsAt: daysAgo(45), endsAt: daysAgo(15), targetCount: 10, status: "closed",
      summary: "7 prestataires évalués : 4 affichent des tarifs clairs, 3 dépassent régulièrement le devis initial. (Synthèse fictive de démonstration)",
    },
  });

  // ── Revendications ───────────────────────────────────────────
  await prisma.placeClaim.create({
    data: {
      placeId: placeRecords[0].id, userId: proFree.id, roleInOrg: "Gérant",
      proofNote: "Registre de commerce fourni (fictif)", proEmail: "pro-gratuit@recofiable.demo",
      status: "APPROVED", decidedAt: daysAgo(180), createdAt: daysAgo(190),
    },
  });
  await prisma.placeClaim.create({
    data: {
      placeId: placeRecords[7].id, userId: proPremium.id, roleInOrg: "Directrice",
      proofNote: "Justificatifs transmis (fictifs)", proEmail: "pro-premium@recofiable.demo",
      status: "APPROVED", decidedAt: daysAgo(140), createdAt: daysAgo(150),
    },
  });
  await prisma.placeClaim.create({
    data: {
      placeId: placeRecords[31].id, userId: proFree.id, roleInOrg: "Propriétaire",
      proofNote: "En attente de justificatif", status: "PENDING", createdAt: daysAgo(4),
    },
  });

  // ── Sponsoring (signalé), devis, réservations ────────────────
  await prisma.sponsoredPlacement.create({
    data: {
      placeId: placeRecords[9].id, label: "Sponsorisé",
      citySlug: "casablanca", categorySlug: "restaurant",
      startsAt: daysAgo(10), endsAt: daysAgo(-80),
    },
  });
  await prisma.quoteRequest.create({
    data: {
      placeId: placeRecords[17].id, userId: mainUser.id,
      need: "Table de 12 personnes avec service pour un anniversaire",
      budget: 4000, date: daysAgo(-14), message: "Menu marocain de préférence.",
    },
  });
  await prisma.reservation.create({
    data: {
      placeId: placeRecords[7].id, userId: mainUser.id,
      date: daysAgo(-3), partySize: 4, status: "confirmed",
      note: "Table en terrasse si possible.",
    },
  });
  await prisma.lead.createMany({
    data: [
      { organizationId: orgPremium.id, kind: "devis", name: "Salma Idrissi (démo)", email: "utilisateur@recofiable.demo", message: "Demande de devis groupe (fictif)" },
      { organizationId: orgFree.id, kind: "contact", name: "Omar Bennis (démo)", message: "Question sur les horaires du vendredi (fictif)" },
    ],
  });

  // ── Propositions de catégories ───────────────────────────────
  await prisma.categoryProposal.createMany({
    data: [
      { term: "brunch", context: "Recherché 14 fois sans catégorie correspondante", requestCount: 14, status: "PENDING" },
      { term: "coach sportif à domicile", context: "8 recherches, proche de salle-de-sport", requestCount: 8, status: "PENDING" },
      { term: "resto", status: "MERGED", categoryId: categoryIds["restaurant"], decidedAt: daysAgo(60) },
    ],
  });

  // ── Notifications ────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: mainUser.id, kind: "question-reponse", title: "Nouvelle réponse à votre question", body: "Omar Bennis (démo) a recommandé La Table du Phare.", link: `/questions/${q1.id}` },
      { userId: mainUser.id, kind: "avis-utile", title: "Votre avis a été jugé utile", body: "6 personnes ont trouvé votre expérience utile cette semaine." },
      { userId: mainUser.id, kind: "invitation", title: "Invitation à vous suivre", body: "Rim Bouazzaoui (démo) souhaite suivre vos recommandations.", link: "/compte/reseau" },
      { userId: proPremium.id, kind: "nouvel-avis", title: "Nouvel avis sur L'Océan Bleu", link: "/pro" },
      { userId: proPremium.id, kind: "devis", title: "Nouvelle demande de devis", body: "Table de groupe — voir l'espace professionnel.", link: "/pro/demandes" },
      { userId: moderator.id, kind: "signalement", title: "2 signalements en attente", link: "/admin/moderation" },
    ],
  });

  // ── Journaux de recherche / analytics ────────────────────────
  const sampleSearches = [
    "restaurant calme à dar bouazza avec enfants", "sardines grillées",
    "pédiatre près de chez moi", "salon coiffure lissage", "salle de sport propre",
    "traiteur table de 12", "où regarder le match", "imprimeur rapport couleur pas cher",
    "tapissier automobile", "activité enfants ce week-end", "sushi livraison",
    "plombier urgence", "endroit romantique en amoureux",
  ];
  for (const s of sampleSearches) {
    await prisma.searchLog.create({
      data: { rawQuery: s, userId: rand() < 0.5 ? mainUser.id : null, resultCount: randInt(0, 20), createdAt: daysAgo(randInt(0, 30)) },
    });
  }
  await prisma.searchLog.create({ data: { rawQuery: "location de yacht", resultCount: 0, createdAt: daysAgo(2) } });
  await prisma.searchLog.create({ data: { rawQuery: "brunch dimanche", resultCount: 0, createdAt: daysAgo(1) } });
  for (let i = 0; i < 40; i++) {
    await prisma.analyticsEvent.create({
      data: {
        kind: pick(["search", "click", "favorite", "share", "review-start", "review-done", "quote", "signup"]),
        createdAt: daysAgo(randInt(0, 30)),
      },
    });
  }

  // ── Paramètres système ───────────────────────────────────────
  const settings: [string, string][] = [
    ["platform.name", "RECOFIABLE"],
    ["platform.slogan", "Des recommandations adaptées à votre besoin, fondées sur des expériences fiables."],
    ["platform.supportEmail", "support@recofiable.demo"],
    ["platform.country", "MA"],
    ["platform.currency", "MAD"],
    ["platform.locales", "fr,ar"],
    ["platform.colors.primary", "#0f766e"],
    ["platform.colors.accent", "#d97706"],
    ["legal.cgu.version", "1.0"],
    ["legal.privacy.version", "1.0"],
    ["moderation.rules", "Les avis doivent décrire une expérience personnelle, récente et vérifiable. Les contenus injurieux, diffamatoires ou promotionnels sont retirés."],
    ["fraud.burst.windowMinutes", "2880"],
    ["fraud.burst.threshold", "5"],
    ["rating.bayesianWeight", "12"],
  ];
  for (const [key, value] of settings) {
    await prisma.systemSetting.create({ data: { key, value } });
  }

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "seed", detail: "Chargement des données de démonstration (fictives)" },
  });

  const counts = {
    lieux: await prisma.place.count(),
    experiences: await prisma.review.count(),
    utilisateurs: await prisma.user.count(),
    categories: await prisma.category.count(),
  };
  console.log("Seed terminé :", counts);
  console.log("Comptes de démonstration : admin@recofiable.demo / Admin123! — moderateur@recofiable.demo / Moderateur123! — utilisateur@recofiable.demo / Utilisateur123! — pro-gratuit@recofiable.demo / Professionnel123! — pro-premium@recofiable.demo / Professionnel123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
