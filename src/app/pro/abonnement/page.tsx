import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { getProOrganization, changePlanAction, cancelPlanAction } from "@/server/actions/pro";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Mon abonnement" };

export default async function ProSubscriptionPage() {
  const user = await requireRole("PROFESSIONAL");
  const org = await getProOrganization(user.id);
  const currentPlan = org?.subscriptions[0]?.plan;
  const plans = await prisma.subscriptionPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-extrabold">Mon abonnement</h1>
      <p className="mb-6 text-sm text-stone-500">
        Abonnement actuel : <strong>{currentPlan?.name ?? "Gratuit"}</strong>. Paiements en mode démonstration —
        aucun débit réel, aucune donnée bancaire stockée.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className={`card p-5 ${plan.id === currentPlan?.id ? "border-brand-600 ring-2 ring-brand-600/20" : ""}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{plan.name}</h2>
              {plan.id === currentPlan?.id && <span className="chip border-brand-200 bg-brand-50 text-brand-800">Actuel</span>}
            </div>
            <p className="mt-1 text-xl font-extrabold">
              {plan.priceMad === null ? "Sur devis" : plan.priceMad === 0 ? "Gratuit" : `${plan.priceMad} MAD/mois`}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-stone-600">
              {plan.features.slice(0, 4).map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            {plan.id !== currentPlan?.id && plan.priceMad !== null && (
              <div className="mt-4">
                <ActionForm action={changePlanAction} submitLabel={`Passer à ${plan.name} (démo)`}>
                  <input type="hidden" name="planSlug" value={plan.slug} />
                </ActionForm>
              </div>
            )}
          </div>
        ))}
      </div>
      {currentPlan && currentPlan.slug !== "gratuit" && (
        <form action={cancelPlanAction} className="mt-6">
          <button type="submit" className="btn-ghost text-red-700">Annuler mon abonnement</button>
        </form>
      )}
    </div>
  );
}
