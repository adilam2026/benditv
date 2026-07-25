// Compréhension de requête en langage naturel — mode local à base de
// règles et dictionnaires (français, arabe, darija en caractères latins).
// Un adaptateur IA facultatif (src/server/integrations/ai.ts) peut
// enrichir ce service si une clé est fournie ; sans clé, ce mode local
// est utilisé automatiquement.

import { normalize, singularize, tokenize } from "@/lib/text";

export type ParsedQuery = {
  categorySlug: string | null;
  specialty: string | null;
  zoneSlug: string | null;
  citySlug: string | null;
  budgetMaxPerPerson: number | null;
  adults: number | null;
  children: number | null;
  withChildren: boolean;
  attributes: string[]; // slugs de tags : calme, parking, terrasse…
  context: string | null; // famille | couple | amis | match | livraison
  when: string | null; // aujourd'hui | ce-soir | week-end | date
  openLate: boolean;
  keywords: string[];
};

// ── Dictionnaires ───────────────────────────────────────────────

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  restaurant: [
    "restaurant", "resto", "restau", "endroit pour manger", "ou manger", "manger",
    "diner", "dejeuner", "makla", "matam", "مطعم", "restaurants",
  ],
  cafe: ["cafe", "coffee", "qahwa", "kahwa", "قهوة", "cafeteria"],
  "salon-de-the": ["salon de the", "the", "atay"],
  patisserie: ["patisserie", "gateau", "gateaux", "halwa", "حلويات"],
  glacier: ["glacier", "glace", "glaces", "ice cream"],
  traiteur: ["traiteur", "buffet", "table de", "reception"],
  snack: ["snack", "sandwich", "fast food"],
  "poisson-fruits-de-mer": ["poisson", "fruits de mer", "hout", "sardine", "sardines", "crevette", "سمك"],
  rooftop: ["rooftop", "toit terrasse"],
  "lieu-match": ["match", "regarder le match", "voir le match", "diffusion match"],
  "aire-de-jeux": ["aire de jeux", "jeux enfants", "kidzone", "espace de jeux"],
  "activite-enfant": ["activite enfant", "activite pour enfant", "sortie enfant", "activites enfants"],
  "summer-camp": ["summer camp", "camp d ete", "colonie"],
  creche: ["creche", "garderie", "nursery", "rawda"],
  parc: ["parc", "jardin", "espace vert"],
  imprimerie: ["imprimerie", "imprimeur", "imprimer", "impression", "tirage"],
  pressing: ["pressing", "nettoyage a sec", "laverie"],
  photographe: ["photographe", "photo", "shooting", "tswira"],
  coiffeur: ["coiffeur", "coiffure", "salon de coiffure", "coloration", "lissage", "brushing", "halaq", "حلاق"],
  "salon-de-beaute": ["salon de beaute", "esthetique", "onglerie", "manucure"],
  spa: ["spa", "hammam", "sauna"],
  barbier: ["barbier", "barbe"],
  massage: ["massage"],
  pediatre: ["pediatre", "docteur enfant", "medecin enfant", "tbib d drari", "طبيب اطفال"],
  "gastro-enterologue": ["gastro", "gastro enterologue"],
  orl: ["orl", "oreille nez gorge"],
  dentiste: ["dentiste", "dents", "tbib snan", "طبيب اسنان"],
  pharmacie: ["pharmacie", "pharmacien", "saydalia", "صيدلية"],
  laboratoire: ["laboratoire", "analyse", "analyses"],
  clinique: ["clinique", "clinic"],
  "salle-de-sport": ["salle de sport", "gym", "musculation", "fitness", "salle sport"],
  piscine: ["piscine", "nage", "natation", "msbah"],
  "terrain-de-football": ["terrain de foot", "terrain foot", "five", "foot a 5"],
  "activite-nautique": ["surf", "jet ski", "kayak", "nautique"],
  menuisier: ["menuisier", "menuiserie", "najjar"],
  "tapissier-automobile": ["tapissier automobile", "tapissier auto", "sellerie auto", "sellerie voiture", "tapissier"],
  mecanicien: ["mecanicien", "garage auto", "mecanique", "mikanisyan"],
  electricien: ["electricien", "electricite"],
  plombier: ["plombier", "plomberie", "fuite d eau"],
  nettoyage: ["nettoyage", "menage", "femme de menage"],
  "agence-de-voyages": ["agence de voyage", "agence de voyages", "voyage organise"],
  hotel: ["hotel", "riad", "فندق", "outil"],
  promoteur: ["promoteur", "promoteur immobilier", "programme immobilier"],
  "agence-immobiliere": ["agence immobiliere", "immobilier", "appartement a vendre", "samsar"],
  syndic: ["syndic", "syndic de copropriete"],
  "professeur-particulier": ["professeur particulier", "prof particulier", "cours particulier"],
  ecole: ["ecole", "school", "مدرسة"],
  "centre-de-langues": ["centre de langues", "cours d anglais", "cours de francais"],
  "soutien-scolaire": ["soutien scolaire", "aide aux devoirs"],
};

const SPECIALTY_SYNONYMS: Record<string, string[]> = {
  "sardines-grillees": ["sardine", "sardines", "sardines grillees", "sardine grillee"],
  "poisson-grille": ["poisson grille", "friture de poisson"],
  tajine: ["tajine", "tagine", "طاجين"],
  couscous: ["couscous", "seksou", "كسكس"],
  pizza: ["pizza", "pizzeria"],
  sushi: ["sushi", "japonais"],
  coloration: ["coloration", "couleur cheveux"],
  lissage: ["lissage", "keratine", "proteine"],
};

// Catégorie de rattachement de chaque spécialité (une spécialité
// détectée précise la catégorie, ex. "sardines grillées" → poisson)
const SPECIALTY_CATEGORY: Record<string, string> = {
  "sardines-grillees": "poisson-fruits-de-mer",
  "poisson-grille": "poisson-fruits-de-mer",
  tajine: "restaurant",
  couscous: "restaurant",
  pizza: "restaurant",
  sushi: "restaurant",
  coloration: "coiffeur",
  lissage: "coiffeur",
};

const ZONE_SYNONYMS: Record<string, string[]> = {
  "dar-bouazza": ["dar bouazza", "dar bouaza", "darbouazza", "dar bouazzah"],
  "ain-diab": ["ain diab", "ain dieb", "corniche"],
  bouskoura: ["bouskoura", "la ville verte", "ville verte"],
  maarif: ["maarif", "maarif extension", "معاريف"],
  californie: ["californie", "california"],
  oasis: ["oasis", "l oasis"],
  "sidi-maarouf": ["sidi maarouf", "sidi maarouf casablanca"],
  "centre-ville": ["centre ville", "downtown", "centre-ville"],
};

const CITY_SYNONYMS: Record<string, string[]> = {
  casablanca: ["casablanca", "casa", "الدار البيضاء", "kaza"],
};

const ATTRIBUTE_SYNONYMS: Record<string, string[]> = {
  calme: ["calme", "tranquille", "paisible", "pas de bruit", "silencieux", "hadi"],
  parking: ["parking", "stationnement", "se garer", "garer"],
  terrasse: ["terrasse", "exterieur", "espace exterieur", "en plein air"],
  "espace-enfants": ["espace enfant", "espace enfants", "coin enfant", "aire de jeux integree", "kids"],
  wifi: ["wifi", "wi fi", "internet"],
  climatisation: ["climatisation", "clim", "climatise"],
  livraison: ["livraison", "livre a domicile", "a domicile", "delivery"],
  reservation: ["reservation", "reserver"],
  accessibilite: ["accessible", "mobilite reduite", "fauteuil roulant", "pmr", "handicap"],
  "ambiance-match": ["ambiance match", "bonne ambiance", "ecran geant"],
  propre: ["propre", "proprete", "nqi"],
  "a-taille-humaine": ["taille humaine", "petite salle", "pas trop grand", "familial"],
};

const CONTEXT_PATTERNS: [string, RegExp][] = [
  ["famille", /(enfant|enfants|famille|familial|drari|wlad|أطفال)/],
  ["couple", /(couple|amoureux|en amoureux|romantique)/],
  ["amis", /(amis|copains|groupe d amis|s7ab)/],
  ["travail", /(travail|collegues|reunion|dejeuner d affaires)/],
  ["match", /(match|derby)/],
  ["livraison", /(livraison|a domicile|delivery)/],
];

// ── Extraction ──────────────────────────────────────────────────

function findInDict(dicts: Record<string, string[]>, text: string): string | null {
  let best: { slug: string; len: number } | null = null;
  for (const [slug, terms] of Object.entries(dicts)) {
    for (const term of terms) {
      const nTerm = normalize(term);
      if (text.includes(nTerm) && (!best || nTerm.length > best.len)) {
        best = { slug, len: nTerm.length };
      }
    }
  }
  return best?.slug ?? null;
}

export function parseQuery(raw: string): ParsedQuery {
  const text = " " + normalize(raw) + " ";
  const tokens = tokenize(raw).map(singularize);

  let categorySlug = findInDict(CATEGORY_SYNONYMS, text);
  const specialty = findInDict(SPECIALTY_SYNONYMS, text);
  // Une spécialité détectée affine la catégorie
  if (specialty && SPECIALTY_CATEGORY[specialty]) {
    categorySlug = SPECIALTY_CATEGORY[specialty];
  }
  const zoneSlug = findInDict(ZONE_SYNONYMS, text);
  const citySlug = findInDict(CITY_SYNONYMS, text) ?? (zoneSlug ? "casablanca" : null);

  // Budget : "moins de 150 dh", "max 200 dhs par personne", "budget 100"
  let budgetMaxPerPerson: number | null = null;
  const budgetMatch = text.match(
    /(?:moins de|max(?:imum)?|budget(?: de)?|inferieur a|pas plus de|جميع)\s*(\d{2,5})\s*(?:dh|dhs|dirham|dirhams|mad)?/
  );
  const plainDh = text.match(/(\d{2,5})\s*(?:dh|dhs|dirham|dirhams|mad)/);
  if (budgetMatch) budgetMaxPerPerson = parseInt(budgetMatch[1], 10);
  else if (plainDh) budgetMaxPerPerson = parseInt(plainDh[1], 10);

  // Composition du groupe
  const NUMBER_WORDS: Record<string, number> = {
    un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7,
    huit: 8, neuf: 9, dix: 10, douze: 12, jouj: 2, tlata: 3,
  };
  const readNumber = (s: string): number | null => {
    const n = parseInt(s, 10);
    if (!Number.isNaN(n)) return n;
    return NUMBER_WORDS[s] ?? null;
  };
  let adults: number | null = null;
  let children: number | null = null;
  const adultMatch = text.match(/(\d+|[a-z]+)\s*adulte/);
  if (adultMatch) adults = readNumber(adultMatch[1]);
  const childMatch = text.match(/(\d+|[a-z]+)\s*enfant/);
  if (childMatch) children = readNumber(childMatch[1]);
  const tableMatch = text.match(/table de\s*(\d+)/);
  if (tableMatch && adults === null) adults = parseInt(tableMatch[1], 10);
  const personnesMatch = text.match(/(\d+)\s*personnes/);
  if (personnesMatch && adults === null) adults = parseInt(personnesMatch[1], 10);

  const withChildren =
    (children ?? 0) > 0 || /avec (les |mes |des )?enfants?|en famille|m3a drari/.test(text);

  // Attributs
  const attributes: string[] = [];
  for (const [slug, terms] of Object.entries(ATTRIBUTE_SYNONYMS)) {
    if (terms.some((t) => text.includes(normalize(t)))) attributes.push(slug);
  }
  if (withChildren && !attributes.includes("espace-enfants")) {
    // le contexte famille active le filtre "accueil des enfants" côté tri
  }

  // Contexte
  let context: string | null = null;
  for (const [ctx, pattern] of CONTEXT_PATTERNS) {
    if (pattern.test(text)) {
      context = ctx;
      break;
    }
  }
  if (withChildren) context = context ?? "famille";

  // Moment
  let when: string | null = null;
  if (/aujourd hui|aujourdhui|maintenant|daba/.test(text)) when = "aujourd'hui";
  else if (/ce soir|apres 22|tard le soir|de nuit/.test(text)) when = "ce soir";
  else if (/week end|weekend|samedi|dimanche/.test(text)) when = "ce week-end";

  const openLate = /apres 22|tard le soir|apres minuit|de nuit/.test(text);

  return {
    categorySlug,
    specialty,
    zoneSlug,
    citySlug,
    budgetMaxPerPerson,
    adults,
    children,
    withChildren,
    attributes,
    context,
    when,
    openLate,
    keywords: tokens,
  };
}

// Suggestion de rattachement pour un terme inconnu (propositions de
// catégories) : renvoie la catégorie la plus proche ou null.
export function suggestCategory(term: string): string | null {
  return findInDict(CATEGORY_SYNONYMS, " " + normalize(term) + " ");
}

export const KNOWN_ZONES = Object.keys(ZONE_SYNONYMS);
export const KNOWN_ATTRIBUTES = Object.keys(ATTRIBUTE_SYNONYMS);
