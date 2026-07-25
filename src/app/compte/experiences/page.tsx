import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { deleteReviewAction } from "@/server/actions/review";

export const metadata: Metadata = { title: "Mes expériences" };

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Publiée",
  PENDING_MODERATION: "En modération",
  NEUTRALIZED: "Neutralisée (contrôles)",
  SUSPENDED: "Suspendue",
  DRAFT: "Brouillon",
  EXCLUDED: "Exclue du calcul",
};

export default async function MyReviewsPage() {
  const user = await requireUser();
  const reviews = await prisma.review.findMany({
    where: { userId: user.id, status: { not: "DELETED" } },
    include: { place: true, verification: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Mes expériences ({reviews.length})</h1>
        <Link href="/avis/nouveau" className="btn-primary">✍️ Nouvelle expérience</Link>
      </div>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/lieux/${r.place.slug}`} className="font-bold hover:text-brand-700">{r.place.name}</Link>
                <p className="text-xs text-stone-400">
                  Visite du {r.visitedAt.toLocaleDateString("fr-FR")} · {r.verification?.method ?? "Expérience déclarée"} ·{" "}
                  visibilité {r.visibility === "PUBLIC" ? "publique" : r.visibility === "NETWORK" ? "réseau" : "privée"}
                </p>
              </div>
              <span className={`chip ${r.status === "PUBLISHED" ? "border-brand-200 bg-brand-50 text-brand-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                {STATUS_LABELS[r.status] ?? r.status}
              </span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-stone-600">{r.comment}</p>}
            <div className="mt-2 flex gap-3 text-sm">
              <Link href={`/avis/nouveau?lieu=${r.place.slug}`} className="font-medium text-brand-700 hover:underline">Modifier</Link>
              <form action={deleteReviewAction}>
                <input type="hidden" name="reviewId" value={r.id} />
                <button type="submit" className="font-medium text-red-700 hover:underline">Supprimer</button>
              </form>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="card p-8 text-center text-sm text-stone-500">
            Vous n&apos;avez pas encore partagé d&apos;expérience.
          </div>
        )}
      </div>
    </div>
  );
}
