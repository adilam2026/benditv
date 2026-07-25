import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { updateUserStatusAction } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  await requireRole("ADMIN");
  const { q, role } = await searchParams;
  const users = await prisma.user.findMany({
    where: {
      status: { not: "DELETED" },
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
      ...(role ? { role: role as "USER" } : {}),
    },
    include: {
      trustScore: true,
      _count: { select: { reviews: true, reports: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Utilisateurs</h1>
      <form action="/admin/utilisateurs" method="get" className="mb-4 flex flex-wrap gap-2">
        <input type="search" name="q" defaultValue={q ?? ""} className="input max-w-xs" placeholder="Nom ou e-mail" aria-label="Rechercher un utilisateur" />
        <select name="role" defaultValue={role ?? ""} className="input max-w-44" aria-label="Filtrer par rôle">
          <option value="">Tous les rôles</option>
          <option value="USER">Utilisateur</option>
          <option value="VERIFIED_CONTRIBUTOR">Contributeur vérifié</option>
          <option value="PROFESSIONAL">Professionnel</option>
          <option value="MODERATOR">Modérateur</option>
          <option value="ADMIN">Administrateur</option>
        </select>
        <button type="submit" className="btn-secondary">Filtrer</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-400">
              <th className="p-3">Utilisateur</th>
              <th className="p-3">Rôle</th>
              <th className="p-3">Avis</th>
              <th className="p-3">Fiabilité</th>
              <th className="p-3">État</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-stone-400">{u.email}</p>
                </td>
                <td className="p-3 text-xs">{u.role}</td>
                <td className="p-3">{u._count.reviews}</td>
                <td className="p-3 text-xs">{u.trustScore ? `${Math.round(u.trustScore.score * 100)} %` : "—"}</td>
                <td className="p-3">
                  <span className={`chip ${u.status === "ACTIVE" ? "border-brand-200 bg-brand-50 text-brand-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {u.status === "ACTIVE" ? "Actif" : u.status === "LIMITED" ? "Limité" : "Suspendu"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {u.status !== "SUSPENDED" ? (
                      <>
                        <form action={updateUserStatusAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="status" value="LIMITED" />
                          <button type="submit" className="btn-ghost text-xs" title="Avertir / limiter">Limiter</button>
                        </form>
                        <form action={updateUserStatusAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="status" value="SUSPENDED" />
                          <button type="submit" className="btn-ghost text-xs text-red-700">Suspendre</button>
                        </form>
                      </>
                    ) : (
                      <form action={updateUserStatusAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="status" value="ACTIVE" />
                        <button type="submit" className="btn-ghost text-xs text-brand-700">Réactiver</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
