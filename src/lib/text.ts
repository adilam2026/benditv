// Outils de normalisation de texte : accents, pluriels simples,
// similarité — utilisés par la classification et l'anti-fraude.

export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`]/g, " ")
    .replace(/[^a-z0-9؀-ۿ\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  return normalize(input)
    .split(/[\s-]+/)
    .filter((t) => t.length > 0);
}

// Singularisation naïve du français (suffisante pour la recherche)
export function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("aux")) return word.slice(0, -3) + "al";
  if (word.endsWith("s") || word.endsWith("x")) return word.slice(0, -1);
  return word;
}

export function slugify(input: string): string {
  return normalize(input).replace(/\s+/g, "-").replace(/-+/g, "-");
}

// Similarité de Jaccard sur trigrammes — détection de textes proches
export function trigramSimilarity(a: string, b: string): number {
  const grams = (s: string) => {
    const n = normalize(s);
    const set = new Set<string>();
    for (let i = 0; i < n.length - 2; i++) set.add(n.slice(i, i + 3));
    return set;
  };
  const ga = grams(a);
  const gb = grams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter++;
  return inter / (ga.size + gb.size - inter);
}

// Détecte un commentaire trop vague ("c'était bien")
const VAGUE_PATTERNS = [
  /^c.?etait (bien|bon|top|super|nul|pas mal)\.?$/,
  /^(tres )?(bien|bon|top|super|excellent|nul|moyen|correct|parfait)\.?$/,
  /^(j.?aime( bien)?|a recommander|je recommande)\.?$/,
  /^(rien a dire|ras|ok|pas mal|mzyan|wa3r|top top)\.?$/,
];

export function isVagueComment(comment: string): boolean {
  const n = normalize(comment);
  if (n.length < 4) return true;
  return VAGUE_PATTERNS.some((p) => p.test(n));
}

export function formatMad(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} MAD`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1).replace(".", ",");
}
