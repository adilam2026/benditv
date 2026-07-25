import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";

export const metadata: Metadata = { title: "Journal d'audit" };

export default async function AuditPage() {
  await requireRole("ADMIN");
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-extrabold">Journal d&apos;audit</h1>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-400">
              <th className="p-3">Date</th>
              <th className="p-3">Acteur</th>
              <th className="p-3">Action</th>
              <th className="p-3">Détail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="p-3 text-xs text-stone-400">{log.createdAt.toLocaleString("fr-FR")}</td>
                <td className="p-3">{log.actor?.name ?? "Système"}</td>
                <td className="p-3 font-mono text-xs">{log.action}</td>
                <td className="p-3 text-xs text-stone-500">{log.detail ?? log.target ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
