import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { decideClaimAction } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Revendications" };

export default async function AdminClaimsPage() {
  const claims = await prisma.placeClaim.findMany({
    include: { place: true, user: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  const pending = claims.filter((c) => c.status === "PENDING");
  const decided = claims.filter((c) => c.status !== "PENDING");
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold">Revendications de fiches</h1>
      <div className="space-y-3">
        {pending.map((claim) => (
          <article key={claim.id} className="card p-4">
            <p className="font-bold">{claim.place.name}</p>
            <dl className="mt-1 grid gap-1 text-sm text-stone-600 sm:grid-cols-2">
              <div><dt className="inline text-xs text-stone-400">Demandeur : </dt><dd className="inline">{claim.user.name} ({claim.user.email})</dd></div>
              <div><dt className="inline text-xs text-stone-400">Rôle déclaré : </dt><dd className="inline">{claim.roleInOrg}</dd></div>
              <div><dt className="inline text-xs text-stone-400">E-mail pro : </dt><dd className="inline">{claim.proEmail ?? "—"}</dd></div>
              <div><dt className="inline text-xs text-stone-400">Justificatif : </dt><dd className="inline">{claim.proofNote ?? "—"}</dd></div>
            </dl>
            <div className="mt-3 flex gap-2">
              <form action={decideClaimAction}>
                <input type="hidden" name="claimId" value={claim.id} />
                <input type="hidden" name="decision" value="approve" />
                <button type="submit" className="btn-primary">Valider</button>
              </form>
              <form action={decideClaimAction}>
                <input type="hidden" name="claimId" value={claim.id} />
                <input type="hidden" name="decision" value="reject" />
                <button type="submit" className="btn-secondary">Refuser</button>
              </form>
            </div>
          </article>
        ))}
        {pending.length === 0 && <p className="card p-4 text-sm text-stone-500">Aucune revendication en attente.</p>}
      </div>
      {decided.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-stone-500">Historique ({decided.length})</summary>
          <ul className="card mt-2 divide-y divide-stone-100 text-sm">
            {decided.map((c) => (
              <li key={c.id} className="flex justify-between p-3">
                <span>{c.place.name} — {c.user.name}</span>
                <span className={`text-xs ${c.status === "APPROVED" ? "text-brand-700" : "text-red-700"}`}>
                  {c.status === "APPROVED" ? "Validée" : "Refusée"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
