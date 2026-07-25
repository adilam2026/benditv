import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { answerQuestionAction, voteAnswerAction } from "@/server/actions/user";
import { ActionForm } from "@/components/forms";
import { VoteAnswerButton } from "@/components/question-vote";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const question = await prisma.question.findUnique({ where: { id } });
  return { title: question?.title ?? "Question" };
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      user: { include: { profile: true } },
      answers: {
        orderBy: { votes: "desc" },
        include: { user: { include: { profile: true } } },
      },
    },
  });
  if (!question) notFound();

  const citedSlugs = question.answers.map((a) => a.placeSlug).filter((s): s is string => !!s);
  const citedPlaces = citedSlugs.length
    ? await prisma.place.findMany({
        where: { slug: { in: citedSlugs } },
        include: { ratings: { where: { isCurrent: true } }, category: true, zone: true },
      })
    : [];
  const placeBySlug = new Map(citedPlaces.map((p) => [p.slug, p]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-2 text-xs text-stone-500">
        <Link href="/questions" className="hover:text-brand-700">Questions</Link> / question
      </nav>
      <div className="card p-6">
        <h1 className="text-xl font-extrabold">{question.title}</h1>
        {question.body && <p className="mt-2 text-sm text-stone-600">{question.body}</p>}
        <p className="mt-3 text-xs text-stone-400">
          Posée par {question.user.profile?.displayName ?? question.user.name} le{" "}
          {question.createdAt.toLocaleDateString("fr-FR")}
          {question.zoneSlug && ` · ${question.zoneSlug.replace(/-/g, " ")}`}
        </p>
      </div>

      <h2 className="section-title mb-3 mt-6">
        {question.answers.length} recommandation{question.answers.length > 1 ? "s" : ""}
      </h2>
      <div className="space-y-4">
        {question.answers.map((answer) => {
          const place = answer.placeSlug ? placeBySlug.get(answer.placeSlug) : null;
          return (
            <article key={answer.id} className="card p-4">
              {place && (
                <Link href={`/lieux/${place.slug}`} className="mb-2 flex items-center justify-between rounded-xl bg-brand-50/60 p-3 hover:bg-brand-50">
                  <div>
                    <p className="font-bold text-brand-800">{place.name}</p>
                    <p className="text-xs text-stone-500">{place.category.name} · {place.zone?.name ?? "Casablanca"}</p>
                  </div>
                  <span className="rounded-xl bg-brand-700 px-2 py-1 text-sm font-bold text-white">
                    {(place.ratings[0]?.rating ?? 0).toFixed(1).replace(".", ",")}/10
                  </span>
                </Link>
              )}
              <p className="text-sm text-stone-700">{answer.body}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
                <span>{answer.user.profile?.displayName ?? answer.user.name} · {answer.createdAt.toLocaleDateString("fr-FR")}</span>
                <VoteAnswerButton
                  answerId={answer.id}
                  questionId={question.id}
                  votes={answer.votes}
                  loggedIn={!!user}
                  action={voteAnswerAction}
                />
              </div>
            </article>
          );
        })}
        {question.answers.length === 0 && (
          <div className="card p-6 text-center text-sm text-stone-500">Pas encore de réponse. Vous connaissez une bonne adresse ?</div>
        )}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-3 font-bold">Recommander une adresse</h2>
        {user ? (
          <ActionForm action={answerQuestionAction} submitLabel="Publier ma recommandation">
            <input type="hidden" name="questionId" value={question.id} />
            <div>
              <label className="label" htmlFor="placeSlug">Lieu recommandé (identifiant de la fiche, facultatif)</label>
              <input id="placeSlug" name="placeSlug" className="input" placeholder="Ex. : la-table-du-phare (visible dans l'adresse de la fiche)" />
            </div>
            <div>
              <label className="label" htmlFor="body">Pourquoi cette adresse ?</label>
              <textarea id="body" name="body" rows={3} required minLength={10} className="input" placeholder="Contexte, points forts, budget constaté…" />
            </div>
          </ActionForm>
        ) : (
          <p className="text-sm text-stone-500">
            <Link href="/connexion" className="font-medium text-brand-700 hover:underline">Connectez-vous</Link> pour répondre.
          </p>
        )}
      </div>
    </div>
  );
}
