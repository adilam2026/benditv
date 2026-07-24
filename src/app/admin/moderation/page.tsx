import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { moderationDecisionAction } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Modération" };

const REASON_LABELS: Record<string, string> = {
  "faux-avis": "Faux avis", conflit: "Conflit d'intérêts", injurieux: "Contenu injurieux",
  "donnees-perso": "Donnée personnelle", photo: "Photo non autorisée", pub: "Publicité",
  "hors-sujet": "Hors sujet", incorrect: "Information incorrecte", harcelement: "Harcèlement",
  dangereux: "Contenu dangereux",
};

export default async function ModerationPage() {
  const [reports, pendingReviews, appeals] = await Promise.all([
    prisma.moderationReport.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      include: {
        reporter: true,
        review: { include: { user: true, place: true } },
        place: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { status: "PENDING_MODERATION" },
      include: { user: true, place: true, fraudSignals: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appeal.findMany({
      where: { status: "open" },
      include: { user: true, decision: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-extrabold">Modération</h1>

      <section>
        <h2 className="section-title mb-3">Avis en attente de publication ({pendingReviews.length})</h2>
        <div className="space-y-3">
          {pendingReviews.map((review) => (
            <article key={review.id} className="card border-amber-200 p-4">
              <p className="text-sm">
                <strong>{review.user.name}</strong> sur{" "}
                <Link href={`/lieux/${review.place.slug}`} className="font-medium text-brand-700 hover:underline">{review.place.name}</Link>
                <span className="ml-2 text-xs text-stone-400">risque {(review.riskScore * 100).toFixed(0)} %</span>
              </p>
              {review.comment && <p className="mt-1 rounded-lg bg-stone-50 p-2 text-sm text-stone-600">« {review.comment} »</p>}
              {review.fraudSignals.length > 0 && (
                <ul className="mt-1 text-xs text-amber-700">
                  {review.fraudSignals.map((s) => <li key={s.id}>⚠️ {s.detail}</li>)}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [["restore", "Publier"], ["ask-proof", "Demander une preuve"], ["suspend", "Suspendre"]] as const
                ).map(([action, label]) => (
                  <form key={action} action={moderationDecisionAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="action" value={action} />
                    <input type="hidden" name="reason" value={`Décision de modération : ${label.toLowerCase()}`} />
                    <button type="submit" className={action === "restore" ? "btn-primary" : "btn-secondary"}>{label}</button>
                  </form>
                ))}
              </div>
            </article>
          ))}
          {pendingReviews.length === 0 && <p className="card p-4 text-sm text-stone-500">Aucun avis en attente.</p>}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Signalements ouverts ({reports.length})</h2>
        <div className="space-y-3">
          {reports.map((report) => (
            <article key={report.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="chip mr-2">{REASON_LABELS[report.reason] ?? report.reason}</span>
                  <strong>{report.targetKind === "review" ? "Avis" : report.targetKind === "place" ? "Fiche" : report.targetKind === "photo" ? "Photo" : "Réponse pro"}</strong>
                  {report.review && <> de {report.review.user.name} sur {report.review.place.name}</>}
                  {report.place && !report.review && <> : {report.place.name}</>}
                </p>
                <span className="text-xs text-stone-400">par {report.reporter.name} · {report.createdAt.toLocaleDateString("fr-FR")}</span>
              </div>
              {report.detail && <p className="mt-1 text-sm text-stone-600">{report.detail}</p>}
              {report.review?.comment && (
                <p className="mt-1 rounded-lg bg-stone-50 p-2 text-sm text-stone-600">« {report.review.comment} »</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [["suspend", "Suspendre le contenu"], ["ask-proof", "Demander une preuve"], ["dismiss", "Rejeter le signalement"]] as const
                ).map(([action, label]) => (
                  <form key={action} action={moderationDecisionAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    {report.reviewId && <input type="hidden" name="reviewId" value={report.reviewId} />}
                    <input type="hidden" name="action" value={action} />
                    <input type="hidden" name="reason" value={`Signalement ${REASON_LABELS[report.reason] ?? report.reason} : ${label.toLowerCase()}`} />
                    <button type="submit" className={action === "suspend" ? "btn-primary" : "btn-secondary"}>{label}</button>
                  </form>
                ))}
              </div>
            </article>
          ))}
          {reports.length === 0 && <p className="card p-4 text-sm text-stone-500">Aucun signalement ouvert.</p>}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Recours ({appeals.length})</h2>
        <div className="space-y-3">
          {appeals.map((appeal) => (
            <article key={appeal.id} className="card p-4 text-sm">
              <p><strong>{appeal.user.name}</strong> conteste : « {appeal.decision.reason} »</p>
              <p className="mt-1 text-stone-600">{appeal.body}</p>
              <p className="mt-1 text-xs text-stone-400">{appeal.createdAt.toLocaleDateString("fr-FR")}</p>
            </article>
          ))}
          {appeals.length === 0 && <p className="card p-4 text-sm text-stone-500">Aucun recours ouvert.</p>}
        </div>
      </section>
    </div>
  );
}
