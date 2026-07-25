import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Missions communautaires",
  description: "Participez aux enquêtes de terrain de la communauté et gagnez des badges.",
};

export default async function MissionsPage() {
  const missions = await prisma.mission.findMany({
    orderBy: { endsAt: "desc" },
    include: { _count: { select: { contributions: true } } },
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">Missions communautaires</h1>
      <p className="mb-6 text-sm text-stone-500">
        Des enquêtes de terrain collectives pour répondre à de vraies questions locales.
      </p>
      <div className="space-y-4">
        {missions.map((m) => {
          const progress = Math.min(100, Math.round((m._count.contributions / m.targetCount) * 100));
          return (
            <Link key={m.id} href={`/missions/${m.id}`} className="card block p-5 transition hover:border-brand-600">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{m.title}</h2>
                  <p className="mt-1 text-sm text-stone-600">{m.objective}</p>
                  <p className="mt-2 text-xs text-stone-400">
                    {m.zoneSlug ? `${m.zoneSlug.replace(/-/g, " ")} · ` : ""}
                    jusqu&apos;au {m.endsAt.toLocaleDateString("fr-FR")}
                    {m.reward && ` · 🏅 ${m.reward}`}
                  </p>
                </div>
                <span className={`chip shrink-0 ${m.status === "closed" ? "" : "border-brand-200 bg-brand-50 text-brand-800"}`}>
                  {m.status === "closed" ? "Terminée" : "En cours"}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100" role="img" aria-label={`Progression : ${progress} %`}>
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-stone-400">
                {m._count.contributions} / {m.targetCount} contributions
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
