import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { claimPlaceAction } from "@/server/actions/pro";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Revendiquer une fiche" };

export default async function ClaimPage() {
  const user = await requireUser();
  const claims = await prisma.placeClaim.findMany({
    where: { userId: user.id },
    include: { place: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-extrabold">Revendiquer une fiche</h1>
      <p className="mb-6 text-sm text-stone-500">
        Vous représentez un établissement ? Fournissez vos justificatifs : un administrateur valide chaque
        revendication manuellement.
      </p>
      <div className="card p-6">
        <ActionForm action={claimPlaceAction} submitLabel="Envoyer la revendication">
          <div>
            <label className="label" htmlFor="placeSlug">Identifiant de la fiche</label>
            <input id="placeSlug" name="placeSlug" required className="input" placeholder="Ex. : la-table-du-phare (dans l'adresse de la fiche)" />
          </div>
          <div>
            <label className="label" htmlFor="roleInOrg">Votre rôle dans l&apos;entreprise</label>
            <input id="roleInOrg" name="roleInOrg" required className="input" placeholder="Gérant, propriétaire, responsable…" />
          </div>
          <div>
            <label className="label" htmlFor="proofNote">Justificatif</label>
            <textarea id="proofNote" name="proofNote" rows={2} required className="input" placeholder="Ex. : registre de commerce n° … (aucun document réel requis en démo)" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="proPhone">Téléphone pro (facultatif)</label>
              <input id="proPhone" name="proPhone" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="proEmail">E-mail professionnel</label>
              <input id="proEmail" name="proEmail" type="email" required className="input" />
            </div>
          </div>
        </ActionForm>
      </div>
      {claims.length > 0 && (
        <div className="card mt-6 divide-y divide-stone-100">
          {claims.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4 text-sm">
              <span className="font-medium">{c.place.name}</span>
              <span className={`chip ${c.status === "APPROVED" ? "border-brand-200 bg-brand-50 text-brand-800" : c.status === "PENDING" ? "border-accent-600/40 bg-accent-100 text-accent-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                {c.status === "APPROVED" ? "Validée" : c.status === "PENDING" ? "En attente" : "Refusée"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
