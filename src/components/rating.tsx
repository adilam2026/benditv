// Affichage de la note publique, du niveau de confiance et du score
// de compatibilité — trois notions volontairement distinctes.

export function RatingBadge({ rating, size = "md" }: { rating: number; size?: "md" | "lg" }) {
  const color =
    rating >= 8 ? "bg-brand-700" : rating >= 6.5 ? "bg-brand-600" : rating >= 5 ? "bg-accent-600" : "bg-stone-500";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl font-bold text-white ${color} ${
        size === "lg" ? "px-3 py-1.5 text-xl" : "px-2 py-1 text-sm"
      }`}
      aria-label={`Note publique ${rating.toFixed(1)} sur 10`}
    >
      {rating.toFixed(1).replace(".", ",")}
      <span className={size === "lg" ? "ml-0.5 text-sm font-medium opacity-80" : "ml-0.5 text-[10px] font-medium opacity-80"}>
        /10
      </span>
    </span>
  );
}

const CONF_STYLES: Record<string, string> = {
  faible: "bg-stone-100 text-stone-600 border-stone-200",
  moyenne: "bg-accent-100 text-accent-700 border-amber-200",
  elevee: "bg-brand-100 text-brand-800 border-brand-200",
  "tres-elevee": "bg-brand-100 text-brand-900 border-brand-200",
};
const CONF_LABELS: Record<string, string> = {
  faible: "Confiance faible",
  moyenne: "Confiance moyenne",
  elevee: "Confiance élevée",
  "tres-elevee": "Confiance très élevée",
};

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CONF_STYLES[confidence] ?? CONF_STYLES.faible}`}>
      {CONF_LABELS[confidence] ?? "Confiance inconnue"}
    </span>
  );
}

export function CompatibilityBadge({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-700"
      title="Score personnalisé selon votre recherche — distinct de la note publique"
    >
      {value} % compatible
    </span>
  );
}

export function TrendBadge({ trend }: { trend: number }) {
  if (Math.abs(trend) < 0.3) return null;
  const up = trend > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-brand-700" : "text-red-700"}`}>
      {up ? "▲" : "▼"} {up ? "en progression" : "en baisse"} ({trend > 0 ? "+" : ""}
      {trend.toFixed(1).replace(".", ",")})
    </span>
  );
}

export function ScoreBar({ label, score, count }: { label: string; score: number; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 truncate text-sm text-stone-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100" role="img" aria-label={`${label} : ${score.toFixed(1)} sur 10`}>
        <div
          className={`h-full rounded-full ${score >= 7.5 ? "bg-brand-600" : score >= 5.5 ? "bg-accent-600" : "bg-red-400"}`}
          style={{ width: `${Math.min(100, score * 10)}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-sm font-semibold text-stone-800">
        {score.toFixed(1).replace(".", ",")}
      </span>
      {count !== undefined && <span className="w-12 shrink-0 text-right text-xs text-stone-400">({count})</span>}
    </div>
  );
}
