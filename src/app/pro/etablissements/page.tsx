import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { getProOrganization } from "@/server/actions/pro";
import { RatingBadge } from "@/components/rating";

export const metadata: Metadata = { title: "Mes établissements" };

export default async function ProPlacesPage() {
  const user = await requireRole("PROFESSIONAL");
  const org = await getProOrganization(user.id);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Mes établissements</h1>
      <div className="space-y-3">
        {(org?.places ?? []).map((p) => (
          <Link key={p.id} href={`/pro/etablissements/${p.id}`} className="card flex items-center justify-between p-4 transition hover:border-brand-600">
            <div>
              <p className="font-bold">{p.name}</p>
              <p className="text-xs text-stone-500">{p.category.name} · {p.zone?.name ?? "Casablanca"} · {p.verified ? "✓ vérifié" : p.claimed ? "revendiqué" : "non vérifié"}</p>
            </div>
            <RatingBadge rating={p.ratings[0]?.rating ?? 0} />
          </Link>
        ))}
        {(org?.places ?? []).length === 0 && (
          <div className="card p-6 text-sm text-stone-500">
            Aucun établissement. <Link href="/pro/revendication" className="font-medium text-brand-700 hover:underline">Revendiquer une fiche</Link>
          </div>
        )}
      </div>
    </div>
  );
}
