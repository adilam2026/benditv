import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Mes missions" };

export default async function MyMissionsPage() {
  const user = await requireUser();
  const contributions = await prisma.missionContribution.findMany({
    where: { userId: user.id },
    include: { mission: { include: { _count: { select: { contributions: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Mes missions</h1>
        <Link href="/missions" className="btn-secondary">Découvrir les missions</Link>
      </div>
      <div className="space-y-3">
        {contributions.map((c) => (
          <Link key={c.id} href={`/missions/${c.missionId}`} className="card block p-4 transition hover:border-brand-600">
            <p className="font-semibold">{c.mission.title}</p>
            <p className="mt-1 text-xs text-stone-400">
              {c.mission.status === "closed" ? "Terminée" : "En cours"} ·{" "}
              {c.mission._count.contributions}/{c.mission.targetCount} contributions
            </p>
          </Link>
        ))}
        {contributions.length === 0 && (
          <div className="card p-8 text-center text-sm text-stone-500">Vous ne participez à aucune mission pour le moment.</div>
        )}
      </div>
    </div>
  );
}
