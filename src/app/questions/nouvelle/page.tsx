import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { createQuestionAction } from "@/server/actions/user";
import { ActionForm } from "@/components/forms";
import { searchPlaces } from "@/server/services/search";
import Link from "next/link";

export const metadata: Metadata = { title: "Poser une question" };

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const { q } = await searchParams;

  // Avant de créer une question : suggérer les résultats existants
  const suggestions = q ? (await searchPlaces(q, {}, user.id, 4)).results : [];
  const zones = await prisma.zone.findMany({ orderBy: { name: "asc" } });
  const categories = await prisma.category.findMany({ where: { kind: "category" }, orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">Poser une question à la communauté</h1>
      <p className="mb-6 text-sm text-stone-500">
        Décrivez votre besoin : la plateforme vérifie d&apos;abord si des adresses correspondent déjà.
      </p>
      <form action="/questions/nouvelle" method="get" className="mb-4 flex gap-2">
        <input
          type="search" name="q" defaultValue={q ?? ""} className="input"
          placeholder="Ex. : endroit calme à Dar Bouazza avec deux enfants"
          aria-label="Décrire votre besoin"
        />
        <button type="submit" className="btn-secondary shrink-0">Vérifier</button>
      </form>
      {q && suggestions.length > 0 && (
        <div className="card mb-6 border-brand-200 bg-brand-50/40 p-4">
          <p className="mb-2 text-sm font-semibold text-brand-800">Ces adresses correspondent peut-être déjà :</p>
          <ul className="space-y-1.5 text-sm">
            {suggestions.map((s) => (
              <li key={s.id}>
                <Link href={`/lieux/${s.slug}`} className="font-medium text-brand-700 hover:underline">{s.name}</Link>
                <span className="text-stone-500"> — {s.categoryName}, {s.zoneName ?? s.cityName} ({s.rating.toFixed(1).replace(".", ",")}/10)</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-stone-500">Toujours pas ce qu&apos;il vous faut ? Publiez la question ci-dessous.</p>
        </div>
      )}
      <div className="card p-6">
        <ActionForm action={createQuestionAction} submitLabel="Publier la question">
          <div>
            <label className="label" htmlFor="title">Votre demande</label>
            <input id="title" name="title" defaultValue={q ?? ""} required minLength={10} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="body">Précisions (facultatif)</label>
            <textarea id="body" name="body" rows={3} className="input" placeholder="Budget, horaires, contraintes…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="zone">Zone</label>
              <select id="zone" name="zone" className="input">
                <option value="">Indifférent</option>
                {zones.map((z) => <option key={z.id} value={z.slug}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="categorie">Catégorie</label>
              <select id="categorie" name="categorie" className="input">
                <option value="">Indifférent</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
