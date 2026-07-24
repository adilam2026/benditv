import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Tarifs professionnels" };

export default async function PricingPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-center text-2xl font-extrabold">Tarifs professionnels</h1>
      <p className="mb-8 text-center text-sm text-stone-500">
        Tarifs de démonstration. Aucune offre ne permet de modifier une note ou de masquer un avis.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`card flex flex-col p-5 ${plan.slug === "performance" ? "border-brand-600 ring-2 ring-brand-600/20" : ""}`}>
            <h2 className="font-bold">{plan.name}</h2>
            <p className="mt-2 text-2xl font-extrabold">
              {plan.priceMad === null ? (
                <span className="text-lg">Sur devis</span>
              ) : plan.priceMad === 0 ? (
                "Gratuit"
              ) : (
                <>
                  {plan.priceMad} <span className="text-sm font-medium text-stone-400">MAD / mois</span>
                </>
              )}
            </p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-stone-600">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-1.5"><span className="text-brand-700">✓</span> {f}</li>
              ))}
            </ul>
            <Link
              href={plan.priceMad === null ? "/contact" : "/pro/abonnement"}
              className={`mt-4 ${plan.slug === "performance" ? "btn-primary" : "btn-secondary"} w-full`}
            >
              {plan.priceMad === null ? "Nous contacter" : plan.priceMad === 0 ? "Commencer" : "Choisir (démo)"}
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-stone-400">
        Essai gratuit, changement et annulation possibles à tout moment depuis l&apos;espace professionnel.
        Paiement en mode démonstration (aucun débit réel).
      </p>
    </div>
  );
}
