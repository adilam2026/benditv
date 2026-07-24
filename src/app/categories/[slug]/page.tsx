import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { searchPlaces } from "@/server/services/search";
import { getCurrentUser } from "@/server/auth/session";
import { PlaceCard } from "@/components/place-card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Catégorie introuvable" };
  return {
    title: `${category.name} à Casablanca — avis fiables et comparés`,
    description: `Les meilleurs ${category.name.toLowerCase()} selon des expériences structurées, récentes et vérifiées.`,
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: { where: { active: true }, include: { _count: { select: { places: true } } } },
      parent: true,
    },
  });
  if (!category || !category.active) notFound();

  const { results } = await searchPlaces("", { categorySlug: slug, sort: "note" }, user?.id ?? null, 30);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav aria-label="Fil d'Ariane" className="mb-2 text-xs text-stone-500">
        <Link href="/categories" className="hover:text-brand-700">Catégories</Link>
        {category.parent && (
          <> / <Link href={`/categories/${category.parent.slug}`} className="hover:text-brand-700">{category.parent.name}</Link></>
        )}{" "}
        / {category.name}
      </nav>
      <h1 className="mb-2 text-2xl font-extrabold">
        {category.icon && <span aria-hidden>{category.icon} </span>}
        {category.name}
      </h1>
      {category.description && <p className="mb-4 text-sm text-stone-500">{category.description}</p>}
      {category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="chip hover:border-brand-600">
              {c.name} ({c._count.places})
            </Link>
          ))}
        </div>
      )}
      <p className="mb-4 text-sm text-stone-500">
        {results.length} lieu{results.length > 1 ? "x" : ""} — classés par note publique.{" "}
        <Link href={`/recherche?categorie=${slug}`} className="font-medium text-brand-700 hover:underline">
          Affiner avec la recherche
        </Link>
      </p>
      {results.length === 0 ? (
        <div className="card p-8 text-center text-sm text-stone-500">
          Aucun lieu dans cette catégorie pour le moment.{" "}
          <Link href="/avis/nouveau" className="font-medium text-brand-700 hover:underline">Proposez la première adresse.</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((item) => <PlaceCard key={item.id} item={item} showCompatibility={false} />)}
        </div>
      )}
    </div>
  );
}
