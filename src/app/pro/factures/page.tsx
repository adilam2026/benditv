import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { getProOrganization } from "@/server/actions/pro";

export const metadata: Metadata = { title: "Factures" };

export default async function ProInvoicesPage() {
  const user = await requireRole("PROFESSIONAL");
  const org = await getProOrganization(user.id);
  const invoices = org
    ? await prisma.invoice.findMany({
        where: { subscription: { organizationId: org.id } },
        include: { subscription: { include: { plan: true } } },
        orderBy: { issuedAt: "desc" },
      })
    : [];
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold">Factures</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-400">
              <th className="p-3">Numéro</th>
              <th className="p-3">Date</th>
              <th className="p-3">Offre</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="p-3 font-mono text-xs">{inv.number}</td>
                <td className="p-3">{inv.issuedAt.toLocaleDateString("fr-FR")}</td>
                <td className="p-3">{inv.subscription.plan.name}</td>
                <td className="p-3">{inv.amountMad} MAD</td>
                <td className="p-3">
                  <span className="chip border-brand-200 bg-brand-50 text-brand-800">
                    {inv.status === "paid" ? "Payée" : "En attente"}{inv.isDemo && " · démo"}
                  </span>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-stone-500">Aucune facture.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone-400">Factures fictives générées par le mode de paiement de démonstration.</p>
    </div>
  );
}
