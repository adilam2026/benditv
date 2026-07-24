import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Mes questions" };

export default async function MyQuestionsPage() {
  const user = await requireUser();
  const questions = await prisma.question.findMany({
    where: { userId: user.id },
    include: { _count: { select: { answers: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Mes questions</h1>
        <Link href="/questions/nouvelle" className="btn-primary">Poser une question</Link>
      </div>
      <div className="space-y-3">
        {questions.map((q) => (
          <Link key={q.id} href={`/questions/${q.id}`} className="card block p-4 transition hover:border-brand-600">
            <p className="font-semibold">{q.title}</p>
            <p className="mt-1 text-xs text-stone-400">
              {q.createdAt.toLocaleDateString("fr-FR")} · {q._count.answers} réponse{q._count.answers > 1 ? "s" : ""}
            </p>
          </Link>
        ))}
        {questions.length === 0 && (
          <div className="card p-8 text-center text-sm text-stone-500">Vous n&apos;avez pas encore posé de question.</div>
        )}
      </div>
    </div>
  );
}
