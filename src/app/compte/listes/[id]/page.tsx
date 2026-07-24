import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { removeFromListAction, deleteListAction } from "@/server/actions/user";
import { RatingBadge } from "@/components/rating";
import { ShareButton } from "@/components/place-actions";

export const metadata: Metadata = { title: "Ma liste" };

export default async function MyListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const list = await prisma.list.findFirst({
    where: { id, OR: [{ ownerId: user.id }, { collaborators: { some: { userId: user.id } } }] },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { place: { include: { category: true, zone: true, ratings: { where: { isCurrent: true } } } } },
      },
      collaborators: { include: { user: true } },
    },
  });
  if (!list) notFound();
  const shareUrl = list.shareToken
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/listes/${list.shareToken}`
    : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{list.title}</h1>
          {list.description && <p className="text-sm text-stone-500">{list.description}</p>}
          <p className="mt-1 text-xs text-stone-400">
            {list.visibility === "private" ? "Liste privée" : list.visibility === "public" ? "Liste publique" : "Partagée par lien"}
            {list.collaborators.length > 0 && ` · collaborateurs : ${list.collaborators.map((c) => c.user.name).join(", ")}`}
          </p>
        </div>
        <div className="flex gap-2">
          {shareUrl && <ShareButton title={list.title} url={shareUrl} />}
          {list.ownerId === user.id && (
            <form action={deleteListAction}>
              <input type="hidden" name="listId" value={list.id} />
              <button type="submit" className="btn-ghost text-red-700">Supprimer</button>
            </form>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {list.items.map((item) => (
          <div key={item.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/lieux/${item.place.slug}`} className="font-bold hover:text-brand-700">{item.place.name}</Link>
              <p className="text-xs text-stone-500">{item.place.category.name} · {item.place.zone?.name ?? "Casablanca"}</p>
              {item.note && <p className="mt-0.5 text-xs italic text-stone-500">« {item.note} »</p>}
            </div>
            <div className="flex items-center gap-2">
              <RatingBadge rating={item.place.ratings[0]?.rating ?? 0} />
              <form action={removeFromListAction}>
                <input type="hidden" name="itemId" value={item.id} />
                <button type="submit" className="btn-ghost" aria-label={`Retirer ${item.place.name}`}>✕</button>
              </form>
            </div>
          </div>
        ))}
        {list.items.length === 0 && (
          <div className="card p-8 text-center text-sm text-stone-500">
            Liste vide. Ajoutez des lieux depuis leurs fiches (bouton « Ajouter à une liste »).
          </div>
        )}
      </div>
    </div>
  );
}
