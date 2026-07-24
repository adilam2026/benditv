import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { getProOrganization, respondReviewAction } from "@/server/actions/pro";
import { RatingBadge } from "@/components/rating";
import { ActionForm } from "@/components/forms";
import { ReportDialog } from "@/components/place-actions";

export const metadata: Metadata = { title: "Avis et réponses" };

export default async function ProReviewsPage() {
  const user = await requireRole("PROFESSIONAL");
  const org = await getProOrganization(user.id);
  const placeIds = org?.places.map((p) => p.id) ?? [];
  const reviews = await prisma.review.findMany({
    where: { placeId: { in: placeIds }, status: "PUBLISHED", visibility: "PUBLIC" },
    include: {
      place: true,
      user: { include: { profile: true } },
      answers: true,
      proResponse: true,
      verification: true,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const avg = (r: (typeof reviews)[number]) => {
    const scored = r.answers.filter((a) => a.score !== null);
    return scored.length ? scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length : null;
  };
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold">Avis sur vos établissements</h1>
      <p className="mb-6 text-sm text-stone-500">
        Vous pouvez répondre publiquement ou contester un avis auprès de la modération — jamais le supprimer.
      </p>
      <div className="space-y-4">
        {reviews.map((review) => {
          const a = avg(review);
          return (
            <article key={review.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{review.place.name}</p>
                  <p className="text-xs text-stone-400">
                    {review.user.profile?.displayName ?? review.user.name} · visite du{" "}
                    {review.visitedAt.toLocaleDateString("fr-FR")} · {review.verification?.method}
                  </p>
                </div>
                {a !== null && <RatingBadge rating={a} />}
              </div>
              {review.comment && <p className="mt-2 text-sm text-stone-700">{review.comment}</p>}
              {review.proResponse ? (
                <div className="mt-3 rounded-xl border-l-4 border-brand-600 bg-brand-50/60 p-3">
                  <p className="text-xs font-bold text-brand-800">Votre réponse publique</p>
                  <p className="mt-1 text-sm">{review.proResponse.body}</p>
                </div>
              ) : (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-brand-700">Répondre publiquement</summary>
                  <div className="mt-2">
                    <ActionForm action={respondReviewAction} submitLabel="Publier ma réponse">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <textarea name="body" rows={3} required minLength={10} className="input" placeholder="Votre réponse, factuelle et courtoise" aria-label="Réponse à l'avis" />
                    </ActionForm>
                  </div>
                </details>
              )}
              <div className="mt-2">
                <ReportDialog targetKind="review" reviewId={review.id} loggedIn compact />
              </div>
            </article>
          );
        })}
        {reviews.length === 0 && <div className="card p-8 text-center text-sm text-stone-500">Aucun avis publié sur vos établissements.</div>}
      </div>
    </div>
  );
}
