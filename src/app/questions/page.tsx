import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Questions de la communauté",
  description: "Posez votre besoin, la communauté recommande des adresses testées.",
};

export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { include: { profile: true } },
      _count: { select: { answers: true } },
    },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Questions de la communauté</h1>
          <p className="text-sm text-stone-500">Un besoin précis ? La communauté répond avec des adresses testées.</p>
        </div>
        <Link href="/questions/nouvelle" className="btn-primary">Poser une question</Link>
      </div>
      <div className="space-y-3">
        {questions.map((q) => (
          <Link key={q.id} href={`/questions/${q.id}`} className="card block p-4 transition hover:border-brand-600">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{q.title}</p>
                <p className="mt-1 text-xs text-stone-400">
                  {q.user.profile?.displayName ?? q.user.name} · {q.createdAt.toLocaleDateString("fr-FR")}
                  {q.zoneSlug && ` · ${q.zoneSlug.replace(/-/g, " ")}`}
                  {q.categorySlug && ` · ${q.categorySlug.replace(/-/g, " ")}`}
                </p>
              </div>
              <span className={`chip shrink-0 ${q._count.answers > 0 ? "border-brand-200 bg-brand-50 text-brand-800" : ""}`}>
                {q._count.answers} réponse{q._count.answers > 1 ? "s" : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
