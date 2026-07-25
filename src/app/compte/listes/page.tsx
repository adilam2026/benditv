import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { createListAction } from "@/server/actions/user";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Mes listes" };

const VISIBILITY_LABELS: Record<string, string> = {
  private: "Privée",
  public: "Publique",
  link: "Partagée par lien",
};

export default async function MyListsPage() {
  const user = await requireUser();
  const lists = await prisma.list.findMany({
    where: { OR: [{ ownerId: user.id }, { collaborators: { some: { userId: user.id } } }] },
    include: { _count: { select: { items: true, collaborators: true } }, owner: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold">Mes listes</h1>
      <div className="space-y-3">
        {lists.map((l) => (
          <Link key={l.id} href={`/compte/listes/${l.id}`} className="card block p-4 transition hover:border-brand-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{l.title}</p>
                <p className="text-xs text-stone-500">
                  {l._count.items} lieu{l._count.items > 1 ? "x" : ""} · {VISIBILITY_LABELS[l.visibility]}
                  {l.ownerId !== user.id && ` · liste de ${l.owner.name} (collaboration)`}
                  {l._count.collaborators > 0 && ` · ${l._count.collaborators} collaborateur${l._count.collaborators > 1 ? "s" : ""}`}
                </p>
              </div>
              <span aria-hidden>→</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="card mt-6 max-w-md p-6">
        <h2 className="mb-3 font-bold">Créer une liste</h2>
        <ActionForm action={createListAction} submitLabel="Créer la liste">
          <div>
            <label className="label" htmlFor="title">Titre</label>
            <input id="title" name="title" required minLength={2} className="input" placeholder="Ex. : Restaurants à tester" />
          </div>
          <div>
            <label className="label" htmlFor="description">Description (facultatif)</label>
            <input id="description" name="description" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="visibility">Visibilité</label>
            <select id="visibility" name="visibility" className="input">
              <option value="private">Privée</option>
              <option value="link">Partagée par lien</option>
              <option value="public">Publique</option>
            </select>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
