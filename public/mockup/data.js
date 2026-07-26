/* RECOFIABLE — MAQUETTE — Données fictives locales.
   Aucune donnée réelle. Tout est généré ici, en mémoire, pour la démonstration. */

const CATEGORY_GROUPS = [
  { id: "manger", label: "Manger", icon: "utensils", cats: ["restaurant", "cafe"] },
  { id: "enfants", label: "Sortir avec les enfants", icon: "kids", cats: ["parc", "activite-enfant"] },
  { id: "pro", label: "Trouver un professionnel", icon: "briefcase", cats: ["pediatre", "service"] },
  { id: "activite", label: "Faire une activité", icon: "sparkle", cats: ["sport", "nautique"] },
  { id: "services", label: "Services près de moi", icon: "wrench", cats: ["service", "coiffeur"] },
  { id: "decouvrir", label: "Découvrir autour de moi", icon: "compass", cats: [] },
];

// Groupes de critères par catégorie (4 critères principaux max affichés)
const CRITERIA_SETS = {
  restaurant: [
    ["qualite", "Qualité des plats"],
    ["proprete", "Propreté"],
    ["delai", "Délai de service"],
    ["prix", "Rapport qualité-prix"],
  ],
  cafe: [
    ["qualite", "Qualité"],
    ["proprete", "Propreté"],
    ["calme", "Calme"],
    ["prix", "Rapport qualité-prix"],
  ],
  parc: [
    ["securite", "Sécurité"],
    ["proprete", "Propreté"],
    ["age", "Adapté à l'âge"],
    ["equipements", "Équipements"],
  ],
  "activite-enfant": [
    ["securite", "Sécurité"],
    ["encadrement", "Encadrement"],
    ["age", "Adapté à l'âge"],
    ["prix", "Rapport qualité-prix"],
  ],
  pediatre: [
    ["accueil", "Accueil"],
    ["ponctualite", "Ponctualité"],
    ["disponibilite", "Disponibilité"],
    ["tarifs", "Tarifs transparents"],
  ],
  coiffeur: [
    ["qualite", "Qualité du résultat"],
    ["ponctualite", "Ponctualité"],
    ["prix", "Prix"],
    ["communication", "Communication"],
  ],
  service: [
    ["qualite", "Qualité"],
    ["ponctualite", "Ponctualité"],
    ["prix", "Prix"],
    ["communication", "Communication"],
  ],
  sport: [
    ["proprete", "Propreté"],
    ["accueil", "Accueil"],
    ["espace", "Espace"],
    ["prix", "Rapport qualité-prix"],
  ],
  nautique: [
    ["securite", "Sécurité"],
    ["encadrement", "Encadrement"],
    ["materiel", "Matériel"],
    ["prix", "Rapport qualité-prix"],
  ],
};

const IMAGES_BY_CAT = {
  restaurant: ["assets/restaurant-1.svg", "assets/restaurant-2.svg", "assets/restaurant-3.svg"],
  cafe: ["assets/cafe-1.svg", "assets/restaurant-3.svg"],
  parc: ["assets/parc-1.svg", "assets/parc-2.svg"],
  "activite-enfant": ["assets/parc-2.svg", "assets/parc-1.svg"],
  pediatre: ["assets/pediatre-1.svg"],
  coiffeur: ["assets/coiffeur-1.svg", "assets/coiffeur-2.svg"],
  service: ["assets/service-1.svg", "assets/service-2.svg"],
  sport: ["assets/sport-1.svg"],
  nautique: ["assets/nautique-1.svg"],
};

const ZONE_MAP_POS = {
  "Dar Bouazza": { x: 24, y: 78 },
  "Ain Diab": { x: 52, y: 30 },
  "Maârif": { x: 62, y: 52 },
  "Californie": { x: 72, y: 46 },
  "Bouskoura": { x: 40, y: 88 },
  "Centre-ville": { x: 58, y: 20 },
  "Sidi Maârouf": { x: 66, y: 68 },
};
const ZONES = Object.keys(ZONE_MAP_POS);

// Coordonnées géographiques réelles des quartiers (pour la vraie carte Leaflet).
// Les lieux eux-mêmes restent fictifs ; seule la position sur la carte est réaliste.
const ZONE_LATLNG = {
  "Dar Bouazza": [33.5228, -7.7358],
  "Ain Diab": [33.5852, -7.6641],
  "Maârif": [33.5722, -7.6284],
  "Californie": [33.5595, -7.6152],
  "Bouskoura": [33.4400, -7.6500],
  "Centre-ville": [33.5928, -7.6192],
  "Sidi Maârouf": [33.5231, -7.6564],
};
const USER_LATLNG = [33.5551, -7.6389]; // Position simulée de l'utilisateur (centre de Casablanca)

const NETWORK = [
  { name: "Omar", color: "#0f766e" },
  { name: "Kenza", color: "#b45309" },
  { name: "Hamza", color: "#9d174d" },
  { name: "Sara", color: "#0369a1" },
  { name: "Yassine", color: "#166534" },
  { name: "Imane", color: "#7c3aed" },
  { name: "Rim", color: "#be185d" },
  { name: "Anas", color: "#c2410c" },
];

function rnd(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const R = rnd(2026);
function pick(arr) { return arr[Math.floor(R() * arr.length)]; }
function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(Math.floor(R() * copy.length), 1)[0]);
  return out;
}
function jitter(base, amount) { return Math.max(4, Math.min(96, base + (R() - 0.5) * amount)); }

const REVIEW_TEMPLATES = {
  restaurant: [
    "Service rapide et plats copieux, on reviendra avec plaisir.",
    "Cadre calme, parfait pour un déjeuner en famille.",
    "Un peu d'attente mais les plats en valaient la peine.",
    "Très bon rapport qualité-prix, portions généreuses.",
    "Accueil chaleureux, terrasse agréable en fin de journée.",
  ],
  cafe: [
    "Wi-Fi stable et ambiance calme pour travailler.",
    "Bon café, petite terrasse agréable au soleil.",
    "Un peu bruyant le week-end mais le service reste souriant.",
  ],
  parc: [
    "Les enfants ont adoré les jeux. Nous sommes restés presque deux heures.",
    "Espace ombragé bien pensé, toilettes propres.",
    "Toboggans en bon état, sécurisé pour les petits.",
    "Un peu d'affluence le samedi mais l'espace reste agréable.",
  ],
  "activite-enfant": [
    "Encadrement attentif, les enfants étaient ravis.",
    "Bien organisé pour l'âge de mes enfants (4 et 6 ans).",
  ],
  pediatre: [
    "Peu d'attente et explications claires du cabinet.",
    "Secrétariat réactif, rendez-vous facile à obtenir.",
    "Tarifs affichés clairement, salle d'attente agréable pour les enfants.",
  ],
  coiffeur: [
    "Résultat conforme à ce que j'avais demandé, conseils honnêtes.",
    "Salon propre, rendez-vous respecté à l'heure.",
  ],
  service: [
    "Travail soigné et délai respecté.",
    "Devis clair dès le départ, bonne communication.",
  ],
  sport: ["Salle propre, machines bien entretenues.", "Bonne ambiance et coachs disponibles."],
  nautique: ["Moniteur patient, parfait pour débuter.", "Matériel en bon état, sécurité prise au sérieux."],
};

function buildPlace(id, name, category, zone, quality, extra) {
  const group = category === "restaurant" || category === "cafe" ? "manger"
    : category === "parc" || category === "activite-enfant" ? "enfants"
    : category === "pediatre" ? "pro"
    : category === "sport" || category === "nautique" ? "activite"
    : "services";
  const critSet = CRITERIA_SETS[category];
  const scores = {};
  critSet.forEach(([key]) => { scores[key] = Math.round((quality + (R() - 0.5) * 1.4) * 10) / 10; });
  const reviewsCount = Math.round(20 + R() * 220);
  const confidence = reviewsCount > 120 ? "elevee" : reviewsCount > 40 ? "moyenne" : "faible";
  const networkPeople = pickN(NETWORK, Math.round(R() * 3));
  const base = ZONE_MAP_POS[zone];
  const baseLatLng = ZONE_LATLNG[zone];
  const images = IMAGES_BY_CAT[category];
  const img = pick(images);
  const templates = REVIEW_TEMPLATES[category];
  const reviewAuthors = pickN(["Sara", "Omar", "Kenza", "Hamza", "Yassine", "Imane", "Nadia", "Rim", "Anas", "Ghita"], 3);
  const reviews = reviewAuthors.map((author, i) => ({
    author,
    networkRelation: networkPeople.some((n) => n.name === author) ? "Votre réseau" : null,
    date: ["il y a 2 jours", "il y a 5 jours", "il y a 2 semaines", "il y a 1 mois"][i % 4],
    context: pick(["Seul(e)", "En famille", "Entre amis", "En couple"]),
    rating: Math.round((quality + (R() - 0.5)) * 10) / 10,
    comment: pick(templates),
    photo: R() > 0.7,
    helpful: Math.round(R() * 14),
  }));

  return {
    id,
    name,
    category,
    group,
    zone,
    city: "Casablanca",
    image: img,
    images: images.length > 1 ? images : [img, img],
    rating: Math.round(quality * 10) / 10,
    confidence,
    reviewsCount,
    distanceMin: Math.round(3 + R() * 22),
    priceLevel: extra.priceLevel ?? Math.round(1 + R() * 3),
    priceLabel: extra.priceLabel || null,
    openNow: R() > 0.25,
    tags: extra.tags || [],
    reasons: extra.reasons,
    network: networkPeople,
    criteriaScores: scores,
    horaires: extra.horaires || "9h – 22h",
    affluence: pick(["Faible", "Modérée", "Élevée"]),
    equipements: extra.equipements || [],
    reviews,
    map: { x: jitter(base.x, 14), y: jitter(base.y, 14) },
    lat: baseLatLng[0] + (R() - 0.5) * 0.012,
    lng: baseLatLng[1] + (R() - 0.5) * 0.014,
    description: extra.description || "",
  };
}

const PLACES = [
  // ── Restaurants / cafés (10) ──
  buildPlace("p1", "La Table du Phare", "restaurant", "Dar Bouazza", 8.4, {
    tags: ["calme", "parking", "enfants"],
    reasons: ["Adapté aux familles avec enfants", "Terrasse calme face à l'océan", "Parking disponible sur place"],
    equipements: ["Parking", "Terrasse", "Espace enfants"],
    description: "Cuisine marocaine généreuse, terrasse ombragée face à la mer.",
  }),
  buildPlace("p2", "Sardina Beldia", "restaurant", "Dar Bouazza", 8.8, {
    tags: ["poisson", "petit-budget"],
    priceLabel: "80 MAD/pers.",
    reasons: ["Spécialiste des sardines grillées", "Très bon rapport qualité-prix", "Ambiance simple et conviviale"],
    equipements: ["Terrasse"],
    description: "Petite adresse spécialisée dans le poisson grillé du jour.",
  }),
  buildPlace("p3", "L'Océan Bleu", "restaurant", "Ain Diab", 8.6, {
    tags: ["poisson", "reservation"],
    priceLabel: "260 MAD/pers.",
    reasons: ["Poisson frais du jour", "Vue sur la corniche", "Idéal pour une occasion spéciale"],
    equipements: ["Parking", "Terrasse", "Climatisation"],
    description: "Table de poisson réputée sur la corniche d'Ain Diab.",
  }),
  buildPlace("p4", "Rooftop Almohades", "restaurant", "Ain Diab", 7.8, {
    tags: ["ambiance", "reservation"],
    reasons: ["Vue mer depuis le rooftop", "Ambiance animée en soirée", "Bon choix de tapas"],
    equipements: ["Terrasse", "Réservation"],
  }),
  buildPlace("p5", "Dar Zellij", "restaurant", "Maârif", 8.3, {
    tags: ["calme", "traditionnel"],
    reasons: ["Cuisine marocaine raffinée", "Cadre traditionnel et calme", "Bon pour un dîner en couple"],
    equipements: ["Climatisation", "Réservation"],
  }),
  buildPlace("p6", "Pizzeria Del Mare", "restaurant", "Dar Bouazza", 7.2, {
    tags: ["enfants", "livraison"],
    reasons: ["Adapté aux enfants", "Livraison rapide", "Pizzas au feu de bois"],
    equipements: ["Terrasse", "Espace enfants", "Livraison"],
  }),
  buildPlace("p7", "Grill House Bouskoura", "restaurant", "Bouskoura", 7.3, {
    tags: ["enfants", "parking"],
    reasons: ["Grande salle familiale", "Parking facile", "Bon rapport qualité-prix"],
    equipements: ["Parking", "Espace enfants"],
  }),
  buildPlace("p8", "Café Littoral", "cafe", "Dar Bouazza", 7.9, {
    tags: ["calme", "wifi"],
    reasons: ["Wi-Fi stable pour travailler", "Terrasse calme", "Parking à proximité"],
    equipements: ["Wi-Fi", "Terrasse", "Parking"],
  }),
  buildPlace("p9", "Café des Surfeurs", "cafe", "Ain Diab", 7.4, {
    tags: ["vue-mer"],
    reasons: ["Vue directe sur les vagues", "Petits-déjeuners copieux"],
    equipements: ["Terrasse"],
  }),
  buildPlace("p10", "Le Comptoir du Maârif", "restaurant", "Maârif", 6.8, {
    tags: ["petit-budget"],
    priceLabel: "75 MAD/pers.",
    reasons: ["Petit prix, plat du jour", "Service rapide"],
    equipements: [],
  }),

  // ── Parcs / activités enfants (6) ──
  buildPlace("k1", "Parc Les Petits Explorateurs", "parc", "Dar Bouazza", 8.9, {
    tags: ["enfants-3-5", "toboggans", "ombrage", "toilettes"],
    reasons: ["Adapté aux enfants de 2 à 6 ans", "Plusieurs toboggans et jeux d'eau", "À moins de 10 minutes"],
    equipements: ["Parking", "Toilettes", "Ombragé"],
    priceLabel: "Gratuit",
    description: "Aire de jeux couverte avec toboggans, jeux d'eau et coin ombragé pour les familles.",
  }),
  buildPlace("k2", "Kidoland", "parc", "Californie", 8.1, {
    tags: ["enfants-2-10", "climatisation"],
    priceLabel: "80 MAD",
    reasons: ["Espace couvert et climatisé", "Adapté aux 2-10 ans", "Espace parents avec café"],
    equipements: ["Parking", "Climatisation"],
  }),
  buildPlace("k3", "Parc de Sindibad", "parc", "Ain Diab", 7.0, {
    tags: ["enfants", "parking"],
    priceLabel: "150 MAD",
    reasons: ["Grand parc familial", "Nombreuses attractions", "Parking disponible"],
    equipements: ["Parking", "Espace enfants"],
  }),
  buildPlace("k4", "Happy Jump", "activite-enfant", "Sidi Maârouf", 6.9, {
    tags: ["enfants-4-12", "climatisation"],
    priceLabel: "90 MAD",
    reasons: ["Trampolines sécurisés", "Adapté aux 4-12 ans", "Espace climatisé"],
    equipements: ["Parking", "Climatisation"],
  }),
  buildPlace("k5", "Atelier des Petits Artistes", "activite-enfant", "Maârif", 8.5, {
    tags: ["enfants-4-10", "calme"],
    priceLabel: "120 MAD",
    reasons: ["Ateliers créatifs encadrés", "Petits groupes calmes", "Adapté dès 4 ans"],
    equipements: ["Climatisation"],
  }),
  buildPlace("k6", "Summer Camp Océan", "activite-enfant", "Dar Bouazza", 7.9, {
    tags: ["enfants-6-12", "plein-air"],
    priceLabel: "350 MAD",
    reasons: ["Activités variées en bord de mer", "Encadrement qualifié", "Adapté dès 6 ans"],
    equipements: ["Parking", "Espace enfants"],
  }),

  // ── Pédiatres (5) ──
  buildPlace("d1", "Cabinet Dr Bennani", "pediatre", "Maârif", 8.7, {
    tags: ["rdv-en-ligne", "accessible"],
    priceLabel: "300 MAD",
    reasons: ["Peu d'attente en moyenne", "Explications claires", "Accessible aux poussettes"],
    equipements: ["Accessible", "Salle d'attente enfants"],
    description: "Cabinet de pédiatrie générale. Aucune évaluation médicale : critères d'accueil et d'organisation uniquement.",
  }),
  buildPlace("d2", "Cabinet Dr Ouazzani", "pediatre", "Dar Bouazza", 8.1, {
    tags: ["parking", "disponible-semaine"],
    priceLabel: "250 MAD",
    reasons: ["Rendez-vous disponibles rapidement", "Parking devant le cabinet", "Tarifs affichés clairement"],
    equipements: ["Parking"],
  }),
  buildPlace("d3", "Cabinet Dr Amrani", "pediatre", "Californie", 7.6, {
    tags: ["accessible"],
    priceLabel: "280 MAD",
    reasons: ["Accueil chaleureux", "Bonne communication", "Accessible PMR"],
    equipements: ["Accessible"],
  }),
  buildPlace("d4", "Cabinet Dr Idrissi", "pediatre", "Bouskoura", 7.9, {
    tags: ["rdv-en-ligne"],
    priceLabel: "260 MAD",
    reasons: ["Prise de rendez-vous en ligne", "Ponctualité respectée", "Salle d'attente adaptée"],
    equipements: [],
  }),
  buildPlace("d5", "Cabinet Dr Fassi", "pediatre", "Centre-ville", 8.3, {
    tags: ["disponible-semaine", "accessible"],
    priceLabel: "300 MAD",
    reasons: ["Disponibilités en semaine", "Tarifs transparents", "Accessible en transport"],
    equipements: ["Accessible"],
  }),

  // ── Professionnels de service (5) ──
  buildPlace("s1", "Plomberie Rapide Casa", "service", "Centre-ville", 6.6, {
    tags: ["urgence"],
    priceLabel: "250 MAD",
    reasons: ["Intervention rapide", "Devis clair avant travaux"],
    equipements: [],
  }),
  buildPlace("s2", "Électricité Pro Services", "service", "Bouskoura", 7.7, {
    tags: ["devis-clair"],
    priceLabel: "300 MAD",
    reasons: ["Bonne communication", "Délai respecté", "Devis affiché avant intervention"],
    equipements: [],
  }),
  buildPlace("s3", "Garage Mécanique Atlas", "service", "Maârif", 7.3, {
    tags: ["parking", "devis-clair"],
    priceLabel: "500 MAD",
    reasons: ["Devis affichés", "Parking sur place", "Travail soigné"],
    equipements: ["Parking"],
  }),
  buildPlace("s4", "Menuiserie Bois Noble", "service", "Sidi Maârouf", 8.1, {
    tags: ["sur-mesure"],
    priceLabel: "Sur devis",
    reasons: ["Travail sur mesure soigné", "Bonne communication", "Délai respecté"],
    equipements: [],
  }),
  buildPlace("s5", "Nettoyage Éclat Maison", "service", "Californie", 7.9, {
    tags: ["domicile"],
    priceLabel: "200 MAD",
    reasons: ["Ponctuel et efficace", "Bon rapport qualité-prix"],
    equipements: [],
  }),

  // ── Salons / activités sport (5) ──
  buildPlace("b1", "Salon Nour Coiffure", "coiffeur", "Maârif", 8.4, {
    tags: ["coloration", "reservation"],
    priceLabel: "250 MAD",
    reasons: ["Excellente en coloration", "Équipe expérimentée", "Rendez-vous respectés"],
    equipements: ["Climatisation", "Réservation"],
  }),
  buildPlace("b2", "Barbier du Coin", "coiffeur", "Centre-ville", 8.0, {
    tags: ["rapide"],
    priceLabel: "60 MAD",
    reasons: ["Coupe rapide et soignée", "Ambiance conviviale"],
    equipements: [],
  }),
  buildPlace("b3", "Spa Argan & Roses", "coiffeur", "Ain Diab", 8.5, {
    tags: ["calme", "reservation"],
    priceLabel: "400 MAD",
    reasons: ["Cadre calme et propre", "Réservation facile", "Prestations variées"],
    equipements: ["Réservation"],
  }),
  buildPlace("g1", "Gym'Ocean", "sport", "Dar Bouazza", 8.2, {
    tags: ["propre", "taille-humaine"],
    priceLabel: "350 MAD/mois",
    reasons: ["Salle très propre", "Taille humaine", "Coachs disponibles"],
    equipements: ["Parking", "Climatisation"],
  }),
  buildPlace("n1", "Surf School Dar Bouazza", "nautique", "Dar Bouazza", 8.8, {
    tags: ["debutant", "materiel-fourni"],
    priceLabel: "200 MAD",
    reasons: ["Parfait pour débuter", "Matériel fourni et en bon état", "Moniteurs patients"],
    equipements: ["Parking"],
  }),
];

// ── Questions près de vous ──
const QUESTIONS = [
  { id: "q1", title: "Quel pédiatre est disponible cette semaine à Dar Bouazza ?", zone: "Dar Bouazza", category: "pediatre", date: "il y a 2 jours", answers: 4, tags: ["pediatre", "sante"] },
  { id: "q2", title: "Quel parc est adapté aux enfants de moins de 5 ans ?", zone: "Dar Bouazza", category: "parc", date: "il y a 4 jours", answers: 6, tags: ["parc", "enfants"] },
  { id: "q3", title: "Où manger du poisson ce week-end ?", zone: "Casablanca", category: "restaurant", date: "il y a 1 jour", answers: 3, tags: ["restaurant", "poisson"] },
  { id: "q4", title: "Quel coiffeur réussit les colorations à Casablanca ?", zone: "Maârif", category: "coiffeur", date: "il y a 6 jours", answers: 8, tags: ["coiffeur", "beaute"] },
  { id: "q5", title: "Un plombier fiable et rapide à Bouskoura ?", zone: "Bouskoura", category: "service", date: "il y a 3 jours", answers: 2, tags: ["service", "maison"] },
  { id: "q6", title: "Salle de sport propre et pas trop grande à Dar Bouazza ?", zone: "Dar Bouazza", category: "sport", date: "il y a 5 jours", answers: 5, tags: ["sport"] },
  { id: "q7", title: "Restaurant calme pour un dîner en famille à Ain Diab ?", zone: "Ain Diab", category: "restaurant", date: "il y a 2 jours", answers: 4, tags: ["restaurant", "enfants"] },
  { id: "q8", title: "Activité pour un anniversaire d'enfant de 6 ans ?", zone: "Californie", category: "activite-enfant", date: "il y a 1 semaine", answers: 3, tags: ["enfants", "activite"] },
];

// ── Sujets vivants ──
const TOPICS = [
  {
    id: "t1", title: "Pédiatres à Dar Bouazza", zone: "Dar Bouazza", category: "pediatre",
    updated: "Mis à jour aujourd'hui", freshness: "12 nouvelles contributions cette semaine",
    placeIds: ["d2", "d1"], questionIds: ["q1"], network: ["Sara", "Omar"],
  },
  {
    id: "t2", title: "Parcs pour jeunes enfants à Casablanca", zone: "Casablanca", category: "parc",
    updated: "Mis à jour hier", freshness: "8 nouvelles contributions cette semaine",
    placeIds: ["k1", "k2", "k3"], questionIds: ["q2", "q8"], network: ["Kenza", "Hamza"],
  },
  {
    id: "t3", title: "Restaurants familiaux à Ain Diab", zone: "Ain Diab", category: "restaurant",
    updated: "Mis à jour il y a 3 jours", freshness: "Informations à confirmer",
    placeIds: ["p3", "p4", "p9"], questionIds: ["q7"], network: ["Yassine"],
  },
  {
    id: "t4", title: "Coiffeurs spécialisés en coloration", zone: "Casablanca", category: "coiffeur",
    updated: "Mis à jour aujourd'hui", freshness: "5 nouvelles contributions cette semaine",
    placeIds: ["b1", "b3"], questionIds: ["q4"], network: ["Rim", "Imane"],
  },
];

// ── Profils fictifs de démonstration (personnalisation) ──
const PROFILES = [
  {
    id: "parent", name: "Salma", role: "Parent de deux jeunes enfants", zone: "Dar Bouazza",
    interests: ["pediatre", "parc", "activite-enfant", "restaurant"],
    forYou: [
      { label: "Pour vous aujourd'hui", ids: ["k1", "d2", "p1"] },
      { label: "Près de chez vous", ids: ["p2", "k1", "p6"] },
      { label: "Avec les enfants", ids: ["k1", "k2", "p6", "k6"] },
      { label: "Nouveautés de votre réseau", ids: ["p1", "d1"] },
    ],
  },
  {
    id: "jeune", name: "Yassine", role: "Jeune actif, centre-ville", zone: "Centre-ville",
    interests: ["cafe", "sport", "coiffeur", "restaurant"],
    forYou: [
      { label: "Pour vous aujourd'hui", ids: ["p8", "g1", "b2"] },
      { label: "Près de chez vous", ids: ["b2", "s1"] },
      { label: "Sorties entre amis", ids: ["p4", "p9"] },
      { label: "Les plus appréciés cette semaine", ids: ["p2", "n1"] },
    ],
  },
  {
    id: "famille", name: "Nadia", role: "Famille installée à Bouskoura", zone: "Bouskoura",
    interests: ["service", "sport", "restaurant", "pediatre"],
    forYou: [
      { label: "Pour vous aujourd'hui", ids: ["p7", "s2", "d4"] },
      { label: "Services près de chez vous", ids: ["s2", "s4"] },
      { label: "Avec les enfants", ids: ["k6", "p7"] },
      { label: "Nouveautés de votre réseau", ids: ["s2"] },
    ],
  },
];

// ── Retours pilotes fictifs (mini-administration) ──
const FEEDBACKS_SEED = [
  { id: "f1", type: "amelioration", text: "Ce serait bien de pouvoir filtrer par âge des enfants directement depuis l'accueil.", date: "il y a 2 jours" },
  { id: "f2", type: "blocage", text: "Je n'arrive pas à revenir en arrière depuis la fiche d'un lieu sur mobile.", date: "il y a 4 jours" },
  { id: "f3", type: "amelioration", text: "Afficher la distance directement sur les vignettes de la page d'accueil.", date: "il y a 1 semaine" },
];

// ── Détection très simple de contexte de recherche ──
const KEYWORDS = {
  parc: ["parc", "toboggan", "jeux", "aire de jeux", "jardin"],
  "activite-enfant": ["activité", "anniversaire", "atelier", "camp"],
  pediatre: ["pédiatre", "docteur", "médecin", "enfant malade"],
  restaurant: ["restaurant", "manger", "diner", "déjeuner", "sardine", "poisson", "resto"],
  cafe: ["café", "coffee", "petit-déjeuner"],
  coiffeur: ["coiffeur", "coloration", "coupe", "salon", "barbier"],
  service: ["plombier", "électricien", "mécanicien", "menuisier", "ménage", "nettoyage"],
  sport: ["sport", "salle de sport", "gym", "fitness"],
  nautique: ["surf", "nautique", "plage"],
};
const ATTR_KEYWORDS = {
  enfants: ["enfant", "enfants", "famille"],
  calme: ["calme", "tranquille"],
  parking: ["parking", "garer"],
  "pres-de-moi": ["près de chez moi", "près de moi", "autour de moi"],
  budget: ["pas cher", "petit budget", "économique"],
};

function detectContext(query) {
  const q = (query || "").toLowerCase();
  let category = null;
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => q.includes(w))) { category = cat; break; }
  }
  const chips = [];
  if (category) chips.push({ key: "categorie", label: CATEGORY_LABELS[category] || category });
  for (const [attr, words] of Object.entries(ATTR_KEYWORDS)) {
    if (words.some((w) => q.includes(w))) {
      chips.push({ key: attr, label: attr === "enfants" ? "Enfants" : attr === "calme" ? "Calme" : attr === "parking" ? "Parking" : attr === "pres-de-moi" ? "Près de moi" : "Budget" });
    }
  }
  chips.push({ key: "ouvert", label: "Ouvert aujourd'hui" });
  return { category, chips };
}

const CATEGORY_LABELS = {
  restaurant: "Restaurant", cafe: "Café", parc: "Parc", "activite-enfant": "Activité enfant",
  pediatre: "Pédiatre", coiffeur: "Coiffeur / Beauté", service: "Service à domicile",
  sport: "Sport", nautique: "Activité nautique",
};
