import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { changePasswordAction, revokeSessionAction } from "@/server/actions/account";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Sécurité" };

export default async function SecurityPage() {
  const user = await requireUser();
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-extrabold">Sécurité</h1>
      <section className="card p-6">
        <h2 className="mb-3 font-bold">Changer mon mot de passe</h2>
        <ActionForm action={changePasswordAction} submitLabel="Mettre à jour">
          <div>
            <label className="label" htmlFor="current">Mot de passe actuel</label>
            <input id="current" name="current" type="password" autoComplete="current-password" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">Nouveau mot de passe</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
          </div>
        </ActionForm>
      </section>
      <section className="card p-6">
        <h2 className="mb-3 font-bold">Sessions actives ({sessions.length})</h2>
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-stone-50 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate">{s.userAgent?.slice(0, 60) ?? "Appareil inconnu"}</p>
                <p className="text-xs text-stone-400">Ouverte le {s.createdAt.toLocaleString("fr-FR")}</p>
              </div>
              <form action={revokeSessionAction}>
                <input type="hidden" name="sessionId" value={s.id} />
                <button type="submit" className="btn-ghost text-red-700">Révoquer</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
