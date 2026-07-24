import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Abonnements" };

export default async function AdminSubscriptionsPage() {
  await requireRole("ADMIN");
  const [subscriptions, revenue, plans] = await Promise.all([
    prisma.subscription.findMany({
      include: { organization: true, plan: true, invoices: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.invoice.aggregate({ _sum: { amountMad: true } }),
    prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { subscriptions: { where: { status: "ACTIVE" } } } } },
    }),
  ]);
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold">Abonnements et facturation</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {plans.map((p) => (
          <div key={p.id} className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-800">{p._count.subscriptions}</p>
            <p className="text-xs text-stone-500">{p.name}</p>
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm text-stone-500">
        Revenus fictifs cumulés : <strong>{revenue._sum.amountMad ?? 0} MAD</strong> (factures de démonstration).
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-400">
              <th className="p-3">Organisation</th>
              <th className="p-3">Offre</th>
              <th className="p-3">Depuis</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Factures</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {subscriptions.map((s) => (
              <tr key={s.id}>
                <td className="p-3 font-medium">{s.organization.name}</td>
                <td className="p-3">{s.plan.name}</td>
                <td className="p-3">{s.startedAt.toLocaleDateString("fr-FR")}</td>
                <td className="p-3">
                  <span className={`chip ${s.status === "ACTIVE" ? "border-brand-200 bg-brand-50 text-brand-800" : ""}`}>
                    {s.status === "ACTIVE" ? "Actif" : s.status === "CANCELED" ? "Annulé" : s.status}
                  </span>
                </td>
                <td className="p-3">{s.invoices.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
