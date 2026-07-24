import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { getProOrganization } from "@/server/actions/pro";

export const metadata: Metadata = { title: "Demandes reçues" };

export default async function ProLeadsPage() {
  const user = await requireRole("PROFESSIONAL");
  const org = await getProOrganization(user.id);
  const placeIds = org?.places.map((p) => p.id) ?? [];
  const [quotes, reservations, leads] = await Promise.all([
    prisma.quoteRequest.findMany({
      where: { placeId: { in: placeIds } },
      include: { place: true, user: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reservation.findMany({
      where: { placeId: { in: placeIds } },
      include: { place: true, user: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    }),
    org
      ? prisma.lead.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
  ]);
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-extrabold">Demandes reçues</h1>
      <section>
        <h2 className="section-title mb-3">Demandes de devis ({quotes.length})</h2>
        <div className="card divide-y divide-stone-100">
          {quotes.map((q) => (
            <div key={q.id} className="p-4 text-sm">
              <div className="flex justify-between">
                <p className="font-semibold">{q.place.name}</p>
                <span className={`chip ${q.status === "new" ? "border-accent-600/40 bg-accent-100 text-accent-700" : ""}`}>{q.status === "new" ? "Nouvelle" : q.status}</span>
              </div>
              <p className="mt-1">{q.need}</p>
              {q.budget && <p className="text-xs text-stone-500">Budget indicatif : {q.budget} MAD</p>}
              <p className="mt-1 text-xs text-stone-400">
                {q.user.profile?.displayName ?? "Utilisateur"} · {q.createdAt.toLocaleDateString("fr-FR")} — répondez via la messagerie de la plateforme (démo).
              </p>
            </div>
          ))}
          {quotes.length === 0 && <p className="p-4 text-sm text-stone-500">Aucune demande de devis.</p>}
        </div>
      </section>
      <section>
        <h2 className="section-title mb-3">Réservations ({reservations.length})</h2>
        <div className="card divide-y divide-stone-100">
          {reservations.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <div>
                <p className="font-semibold">{r.place.name} — {r.partySize} pers.</p>
                <p className="text-xs text-stone-400">{r.date.toLocaleString("fr-FR")} {r.note && `· ${r.note}`}</p>
              </div>
              <span className={`chip ${r.status === "confirmed" ? "border-brand-200 bg-brand-50 text-brand-800" : r.status === "pending" ? "border-accent-600/40 bg-accent-100 text-accent-700" : ""}`}>
                {r.status === "confirmed" ? "Confirmée" : r.status === "pending" ? "À traiter" : "Annulée"}
              </span>
            </div>
          ))}
          {reservations.length === 0 && <p className="p-4 text-sm text-stone-500">Aucune réservation.</p>}
        </div>
      </section>
      <section>
        <h2 className="section-title mb-3">Contacts ({leads.length})</h2>
        <div className="card divide-y divide-stone-100">
          {leads.map((l) => (
            <div key={l.id} className="p-4 text-sm">
              <p className="font-semibold">{l.name} <span className="text-xs font-normal text-stone-400">({l.kind})</span></p>
              {l.message && <p className="text-stone-600">{l.message}</p>}
            </div>
          ))}
          {leads.length === 0 && <p className="p-4 text-sm text-stone-500">Aucun contact.</p>}
        </div>
      </section>
    </div>
  );
}
