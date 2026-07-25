import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Catégories",
  description: "Tous les univers et catégories : restauration, famille, santé, services, sport…",
};

export default async function CategoriesPage() {
  const universes = await prisma.category.findMany({
    where: { kind: "universe", active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { active: true },
        orderBy: { name: "asc" },
        include: { _count: { select: { places: true } } },
      },
    },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold">Toutes les catégories</h1>
      <div className="space-y-8">
        {universes.map((u) => (
          <section key={u.id}>
            <h2 className="section-title mb-3">
              <Link href={`/categories/${u.slug}`} className="hover:text-brand-700">
                <span aria-hidden>{u.icon}</span> {u.name}
              </Link>
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {u.children.map((c) => (
                <Link key={c.id} href={`/categories/${c.slug}`} className="card p-3 text-sm font-medium transition hover:border-brand-600">
                  {c.name}
                  <span className="ml-1 text-xs font-normal text-stone-400">({c._count.places})</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
