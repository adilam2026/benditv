import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { updateConsentAction, deleteAccountAction } from "@/server/actions/account";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Mes données" };

export default async function MyDataPage() {
  const user = await requireUser();
  const [consents, sessions] = await Promise.all([
    prisma.userConsent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.session.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  // Dernier état de chaque consentement
  const latest = new Map<string, boolean>();
  for (const c of consents) if (!latest.has(c.kind)) latest.set(c.kind, c.granted);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold">Mes données</h1>

      <section className="card p-6">
        <h2 className="mb-2 font-bold">Exporter mes données</h2>
        <p className="mb-3 text-sm text-stone-500">
          Téléchargez l&apos;ensemble de vos données (profil, préférences, expériences, favoris, listes) au format JSON.
        </p>
        <a href="/api/compte/export" className="btn-primary" download>
          ⬇️ Export JSON
        </a>
      </section>

      <section className="card p-6">
        <h2 className="mb-2 font-bold">Consentements</h2>
        <div className="space-y-2">
          {[
            ["geolocalisation", "Géolocalisation pour vérifier mes visites"],
            ["reseau", "Utilisation de mon réseau pour personnaliser mes résultats"],
            ["cookies", "Mesure d'audience interne"],
          ].map(([kind, label]) => {
            const granted = latest.get(kind) ?? false;
            return (
              <div key={kind} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 p-3 text-sm">
                <span>{label}</span>
                <form action={updateConsentAction}>
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="granted" value={granted ? "false" : "true"} />
                  <button type="submit" className={granted ? "btn-primary" : "btn-secondary"}>
                    {granted ? "Activé — retirer" : "Désactivé — accorder"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-stone-400">Chaque changement est horodaté et conservé dans l&apos;historique des consentements.</p>
      </section>

      <section className="card p-6">
        <h2 className="mb-2 font-bold">Sessions actives et historique de connexion</h2>
        <ul className="space-y-1.5 text-sm text-stone-600">
          {sessions.map((s) => (
            <li key={s.id} className="flex justify-between">
              <span>{s.userAgent?.slice(0, 50) ?? "Appareil inconnu"}</span>
              <span className="text-xs text-stone-400">{s.createdAt.toLocaleString("fr-FR")}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card border-red-200 p-6">
        <h2 className="mb-2 font-bold text-red-700">Supprimer mon compte</h2>
        <p className="mb-3 text-sm text-stone-500">
          Suppression définitive : votre profil est anonymisé, vos sessions révoquées. Tapez{" "}
          <strong>SUPPRIMER</strong> pour confirmer.
        </p>
        <ActionForm action={deleteAccountAction} submitLabel="Supprimer définitivement mon compte">
          <input name="confirm" className="input" placeholder="SUPPRIMER" aria-label="Confirmation de suppression" />
        </ActionForm>
      </section>
    </div>
  );
}
