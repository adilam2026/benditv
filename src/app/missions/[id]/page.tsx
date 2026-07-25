import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { joinMissionAction } from "@/server/actions/user";
import { JoinMissionButton } from "@/components/mission-join";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const mission = await prisma.mission.findUnique({ where: { id } });
  return { title: mission?.title ?? "Mission" };
}

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const mission = await prisma.mission.findUnique({
    where: { id },
    include: {
      contributions: { include: { user: { include: { profile: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!mission) notFound();
  const joined = user ? mission.contributions.some((c) => c.userId === user.id) : false;
  const progress = Math.min(100, Math.round((mission.contributions.length / mission.targetCount) * 100));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-2 text-xs text-stone-500">
        <Link href="/missions" className="hover:text-brand-700">Missions</Link> / mission
      </nav>
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-extrabold">{mission.title}</h1>
          <span className={`chip ${mission.status === "closed" ? "" : "border-brand-200 bg-brand-50 text-brand-800"}`}>
            {mission.status === "closed" ? "Terminée" : "En cours"}
          </span>
        </div>
        <p className="mt-2 text-sm text-stone-600">{mission.objective}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-stone-400">Période</dt><dd>{mission.startsAt.toLocaleDateString("fr-FR")} → {mission.endsAt.toLocaleDateString("fr-FR")}</dd></div>
          <div><dt className="text-xs text-stone-400">Zone</dt><dd>{mission.zoneSlug?.replace(/-/g, " ") ?? "Casablanca"}</dd></div>
          <div><dt className="text-xs text-stone-400">Critères observés</dt><dd>{mission.criteria ?? "—"}</dd></div>
          <div><dt className="text-xs text-stone-400">Récompense</dt><dd>{mission.reward ?? "Reconnaissance de la communauté"}</dd></div>
        </dl>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-stone-400">{mission.contributions.length} / {mission.targetCount} contributions</p>
        {mission.summary && (
          <div className="mt-4 rounded-xl bg-brand-50/60 p-4 text-sm text-stone-700">
            <p className="mb-1 font-bold text-brand-800">Synthèse finale</p>
            {mission.summary}
          </div>
        )}
        {mission.status !== "closed" && (
          <div className="mt-5 flex flex-wrap gap-2">
            <JoinMissionButton missionId={mission.id} joined={joined} loggedIn={!!user} action={joinMissionAction} />
            <Link
              href={`/recherche?${mission.categorySlug ? `categorie=${mission.categorySlug}` : ""}${mission.zoneSlug ? `&zone=${mission.zoneSlug}` : ""}`}
              className="btn-secondary"
            >
              Voir les lieux concernés
            </Link>
            <Link href="/avis/nouveau" className="btn-secondary">Publier une expérience</Link>
          </div>
        )}
      </div>
      <h2 className="section-title mb-3 mt-6">Participants</h2>
      <div className="card divide-y divide-stone-100 p-2">
        {mission.contributions.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
            <span>{c.user.profile?.displayName ?? c.user.name}</span>
            <span className="text-xs text-stone-400">{c.createdAt.toLocaleDateString("fr-FR")}</span>
          </div>
        ))}
        {mission.contributions.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-stone-500">Soyez le premier à participer.</p>
        )}
      </div>
    </div>
  );
}
