import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Listes publiques",
  description: "Les sélections d'adresses partagées par la communauté.",
};

export default async function PublicListsPage() {
  const lists = await prisma.list.findMany({
    where: { visibility: "public" },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { include: { profile: true } },
      _count: { select: { items: true } },
    },
    take: 30,
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">Listes publiques</h1>
      <p className="mb-6 text-sm text-stone-500">Les sélections partagées par la communauté.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {lists.map((l) => (
          <Link key={l.id} href={`/listes/${l.shareToken ?? l.id}`} className="card block p-5 transition hover:border-brand-600">
            <h2 className="font-bold">{l.title}</h2>
            {l.description && <p className="mt-1 text-sm text-stone-600">{l.description}</p>}
            <p className="mt-2 text-xs text-stone-400">
              {l._count.items} lieu{l._count.items > 1 ? "x" : ""} · par {l.owner.profile?.displayName ?? l.owner.name} ·
              mise à jour le {l.updatedAt.toLocaleDateString("fr-FR")}
            </p>
          </Link>
        ))}
        {lists.length === 0 && <p className="text-sm text-stone-500">Aucune liste publique pour le moment.</p>}
      </div>
    </div>
  );
}
