import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { decideProposalAction } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Catégories et propositions" };

export default async function AdminCategoriesPage() {
  await requireRole("ADMIN");
  const [universes, proposals, categories] = await Promise.all([
    prisma.category.findMany({
      where: { kind: "universe" },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          orderBy: { name: "asc" },
          include: { _count: { select: { places: true, synonyms: true, criteria: true } } },
        },
      },
    }),
    prisma.categoryProposal.findMany({ orderBy: [{ status: "asc" }, { requestCount: "desc" }] }),
    prisma.category.findMany({ where: { kind: "category" }, orderBy: { name: "asc" } }),
  ]);
  const pending = proposals.filter((p) => p.status === "PENDING");
  const decided = proposals.filter((p) => p.status !== "PENDING");

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-extrabold">Catégories et propositions</h1>

      <section>
        <h2 className="section-title mb-3">Propositions en attente ({pending.length})</h2>
        <div className="space-y-3">
          {pending.map((p) => (
            <article key={p.id} className="card p-4">
              <p className="font-bold">« {p.term} »</p>
              <p className="text-xs text-stone-400">{p.context} · {p.requestCount} demande{p.requestCount > 1 ? "s" : ""}</p>
              <form action={decideProposalAction} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="proposalId" value={p.id} />
                <div>
                  <label className="label" htmlFor={`decision-${p.id}`}>Décision</label>
                  <select id={`decision-${p.id}`} name="decision" className="input max-w-56">
                    <option value="accept">Créer la catégorie</option>
                    <option value="merge">Fusionner (synonyme)</option>
                    <option value="tag">Convertir en tag</option>
                    <option value="specialty">Convertir en spécialité</option>
                    <option value="reject">Rejeter</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor={`cat-${p.id}`}>Catégorie cible (fusion/spécialité)</label>
                  <select id={`cat-${p.id}`} name="categorySlug" className="input max-w-56">
                    <option value="">—</option>
                    {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary">Appliquer</button>
              </form>
            </article>
          ))}
          {pending.length === 0 && <p className="card p-4 text-sm text-stone-500">Aucune proposition en attente.</p>}
        </div>
        {decided.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-stone-500">Historique des décisions ({decided.length})</summary>
            <ul className="card mt-2 divide-y divide-stone-100 text-sm">
              {decided.map((p) => (
                <li key={p.id} className="flex justify-between p-3">
                  <span>« {p.term} »</span>
                  <span className="text-xs text-stone-400">{p.status}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section>
        <h2 className="section-title mb-3">Arbre des catégories</h2>
        <div className="space-y-4">
          {universes.map((u) => (
            <div key={u.id} className="card p-4">
              <p className="font-bold">{u.icon} {u.name}</p>
              <ul className="mt-2 grid gap-1 text-sm text-stone-600 sm:grid-cols-2">
                {u.children.map((c) => (
                  <li key={c.id} className="flex justify-between rounded-lg bg-stone-50 px-3 py-1.5">
                    <span>{c.name}</span>
                    <span className="text-xs text-stone-400">
                      {c._count.places} fiches · {c._count.synonyms} syn. · {c._count.criteria} critères
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
