import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Mes badges" };

const ALL_BADGES = [
  ["new", "Nouveau contributeur", "Vos trois premières expériences."],
  ["verified-visit", "Visite confirmée", "Au moins une expérience vérifiée par une preuve."],
  ["regular", "Contributeur régulier", "10 expériences publiées."],
  ["local-expert", "Expert local", "25 expériences sur 15 lieux différents."],
  ["detailed", "Avis détaillés", "5 expériences détaillées."],
  ["photos", "Photos utiles", "10 photos publiées."],
  ["family", "Spécialiste famille", "5 expériences en contexte famille."],
  ["food", "Spécialiste restauration", "10 expériences en restauration."],
  ["founder", "Membre fondateur", "Compte créé pendant la phase de lancement."],
] as const;

export default async function BadgesPage() {
  const user = await requireUser();
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    include: { badges: true },
  });
  const owned = new Set(profile?.badges.map((b) => b.code) ?? []);
  const trust = await prisma.trustScore.findUnique({ where: { userId: user.id } });
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold">Mes badges</h1>
      <p className="mb-6 text-sm text-stone-500">
        Score de contribution : {trust?.contributions ?? 0} expérience{(trust?.contributions ?? 0) > 1 ? "s" : ""} ·{" "}
        {Math.round((trust?.verifiedRate ?? 0) * 100)} % vérifiées. Les badges reflètent votre régularité et la
        qualité de vos contributions — le score interne de fiabilité n&apos;est jamais publié.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ALL_BADGES.map(([code, label, description]) => (
          <div key={code} className={`card p-4 ${owned.has(code) ? "border-brand-600 bg-brand-50/40" : "opacity-60"}`}>
            <p className="font-bold">{owned.has(code) ? "🏅" : "🔒"} {label}</p>
            <p className="mt-1 text-xs text-stone-500">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
