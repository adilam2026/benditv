import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { createCircleAction, addToCircleAction } from "@/server/actions/user";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Mes cercles" };

export default async function CirclesPage() {
  const user = await requireUser();
  const [circles, following] = await Promise.all([
    prisma.circle.findMany({
      where: { ownerId: user.id },
      include: { members: { include: { user: { include: { profile: true } } } } },
    }),
    prisma.follow.findMany({
      where: { followerId: user.id, status: "ACCEPTED" },
      include: { followed: { include: { profile: true } } },
    }),
  ]);
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold">Mes cercles de confiance</h1>
      <p className="mb-6 text-sm text-stone-500">
        Regroupez vos proches (famille, amis, collègues, parents…) pour affiner les recommandations de chaque contexte.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {circles.map((c) => (
          <div key={c.id} className="card p-5">
            <h2 className="font-bold">{c.name} <span className="text-xs font-normal text-stone-400">({c.kind})</span></h2>
            <ul className="mt-2 space-y-1 text-sm text-stone-600">
              {c.members.map((m) => <li key={m.id}>• {m.user.profile?.displayName ?? m.user.name}</li>)}
              {c.members.length === 0 && <li className="text-stone-400">Aucun membre</li>}
            </ul>
            {following.length > 0 && (
              <form action={addToCircleAction} className="mt-3 flex gap-2">
                <input type="hidden" name="circleId" value={c.id} />
                <select name="userId" className="input" aria-label={`Ajouter un membre au cercle ${c.name}`}>
                  {following.map((f) => (
                    <option key={f.followedId} value={f.followedId}>
                      {f.followed.profile?.displayName ?? f.followed.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn-secondary shrink-0">Ajouter</button>
              </form>
            )}
          </div>
        ))}
      </div>
      <div className="card mt-6 max-w-md p-6">
        <h2 className="mb-3 font-bold">Créer un cercle</h2>
        <ActionForm action={createCircleAction} submitLabel="Créer le cercle">
          <div>
            <label className="label" htmlFor="name">Nom du cercle</label>
            <input id="name" name="name" required minLength={2} className="input" placeholder="Ex. : Parents de l'école" />
          </div>
          <div>
            <label className="label" htmlFor="kind">Type</label>
            <select id="kind" name="kind" className="input">
              <option value="famille">Famille</option>
              <option value="amis">Amis</option>
              <option value="collegues">Collègues</option>
              <option value="parents">Parents</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
