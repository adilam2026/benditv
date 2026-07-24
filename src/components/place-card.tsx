import Link from "next/link";
import Image from "next/image";
import type { SearchResultItem } from "@/server/services/search";
import { RatingBadge, ConfidenceBadge, CompatibilityBadge, TrendBadge } from "@/components/rating";

export function PlaceCard({ item, showCompatibility = true }: { item: SearchResultItem; showCompatibility?: boolean }) {
  return (
    <article className="card flex flex-col gap-3 p-4 sm:flex-row">
      <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-32 sm:w-44">
        {item.photoUrl ? (
          <Image src={item.photoUrl} alt={`Photo de ${item.name} (démonstration)`} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl" aria-hidden>📍</div>
        )}
        {item.sponsored && (
          <span className="absolute left-2 top-2 rounded-md bg-stone-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Sponsorisé
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold">
              <Link href={`/lieux/${item.slug}`} className="hover:text-brand-700">{item.name}</Link>
            </h3>
            <p className="text-xs text-stone-500">
              {item.categoryName}
              {item.zoneName ? ` · ${item.zoneName}` : ""} · {item.cityName}
              {item.avgPricePerPerson ? ` · ≈ ${item.avgPricePerPerson} MAD/pers.` : item.priceLevel ? ` · ${"".padStart(item.priceLevel, "€").replace(/€/g, "$")}`.replace(/\$/g, "·") : ""}
              {item.openNow !== null && (
                <span className={item.openNow ? " text-brand-700" : " text-red-600"}>
                  {" "}· {item.openNow ? "Ouvert" : "Fermé"}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RatingBadge rating={item.rating} />
            {showCompatibility && <CompatibilityBadge value={item.compatibility} />}
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <ConfidenceBadge confidence={item.confidence} />
          <span>
            {item.reviewCount} expérience{item.reviewCount > 1 ? "s" : ""}
            {item.verifiedCount > 0 && ` · ${item.verifiedCount} vérifiée${item.verifiedCount > 1 ? "s" : ""}`}
          </span>
          <TrendBadge trend={item.trend} />
        </div>
        {item.strengths.length > 0 && (
          <p className="mt-1.5 text-sm text-stone-700">
            <span className="font-medium text-brand-800">Points forts :</span> {item.strengths.join(", ")}.
          </p>
        )}
        {item.caution && <p className="mt-0.5 text-sm text-accent-700">{item.caution}</p>}
        {item.networkCount > 0 && (
          <p className="mt-0.5 text-sm font-medium text-brand-700">
            👥 {item.networkCount} personne{item.networkCount > 1 ? "s" : ""} de votre réseau {item.networkCount > 1 ? "l'ont" : "l'a"} testé.
          </p>
        )}
        {item.hasWave && (
          <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">
            ⚠️ Une activité inhabituelle a été détectée sur cette fiche. Certaines contributions récentes ne sont pas encore intégrées à la note.
          </p>
        )}
        <details className="mt-1.5">
          <summary className="cursor-pointer text-xs font-medium text-stone-400 hover:text-brand-700">
            Pourquoi ce résultat ?
          </summary>
          <p className="mt-1 text-xs text-stone-600">{item.reason}</p>
        </details>
      </div>
    </article>
  );
}
