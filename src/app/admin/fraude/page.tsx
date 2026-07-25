import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { decideFraudWaveAction } from "@/server/actions/admin";

export const metadata: Metadata = { title: "Vagues et anomalies" };

export default async function FraudPage() {
  const [waves, cases, recentSignals] = await Promise.all([
    prisma.fraudWave.findMany({
      include: { place: true, case_: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.fraudCase.findMany({
      include: { _count: { select: { signals: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.fraudSignal.findMany({
      include: { review: { include: { place: true } }, user: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-extrabold">Vagues et anomalies</h1>

      <section>
        <h2 className="section-title mb-3">Vagues détectées ({waves.length})</h2>
        <div className="space-y-3">
          {waves.map((wave) => (
            <article key={wave.id} className={`card p-4 ${wave.status === "detected" ? "border-amber-300" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">
                  <Link href={`/lieux/${wave.place.slug}`} className="hover:text-brand-700">{wave.place.name}</Link>
                </p>
                <span className={`chip ${wave.status === "detected" ? "border-amber-300 bg-amber-50 text-amber-800" : wave.status === "neutralized" ? "border-red-200 bg-red-50 text-red-700" : "border-brand-200 bg-brand-50 text-brand-800"}`}>
                  {wave.status === "detected" ? "À traiter" : wave.status === "neutralized" ? "Neutralisée" : "Levée"}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div><dt className="text-xs text-stone-400">Début</dt><dd>{wave.startedAt.toLocaleDateString("fr-FR")}</dd></div>
                <div><dt className="text-xs text-stone-400">Volume</dt><dd>{wave.reviewCount} avis</dd></div>
                <div><dt className="text-xs text-stone-400">Note moyenne</dt><dd>{wave.avgRating.toFixed(1).replace(".", ",")}/10</dd></div>
                <div><dt className="text-xs text-stone-400">Risque</dt><dd className="font-bold text-amber-700">{Math.round(wave.riskScore * 100)} %</dd></div>
              </dl>
              {wave.note && <p className="mt-2 text-sm text-stone-600">{wave.note}</p>}
              {/* Chronologie simplifiée */}
              <div className="mt-3 flex h-8 items-end gap-0.5" role="img" aria-label="Volume d'avis dans le temps">
                {[1, 1, 2, 1, wave.reviewCount, 2, 1].map((v, i) => (
                  <div key={i} className={`flex-1 rounded-t ${i === 4 ? "bg-amber-500" : "bg-stone-200"}`} style={{ height: `${Math.min(100, v * 12)}%` }} />
                ))}
              </div>
              {wave.status === "detected" && (
                <div className="mt-3 flex gap-2">
                  <form action={decideFraudWaveAction}>
                    <input type="hidden" name="waveId" value={wave.id} />
                    <input type="hidden" name="decision" value="neutralize" />
                    <button type="submit" className="btn-primary">Exclure la vague du calcul</button>
                  </form>
                  <form action={decideFraudWaveAction}>
                    <input type="hidden" name="waveId" value={wave.id} />
                    <input type="hidden" name="decision" value="clear" />
                    <button type="submit" className="btn-secondary">Lever l&apos;alerte (poids réduit)</button>
                  </form>
                </div>
              )}
            </article>
          ))}
          {waves.length === 0 && <p className="card p-4 text-sm text-stone-500">Aucune vague détectée.</p>}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Dossiers</h2>
        <div className="card divide-y divide-stone-100">
          {cases.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-stone-400">{c._count.signals} signaux · risque {Math.round(c.riskScore * 100)} % · {c.createdAt.toLocaleDateString("fr-FR")}</p>
              </div>
              <span className="chip">{c.status === "OPEN" ? "Ouvert" : c.status === "UNDER_REVIEW" ? "En examen" : c.status === "RESOLVED" ? "Résolu" : "Classé"}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Signaux récents</h2>
        <div className="card divide-y divide-stone-100 text-sm">
          {recentSignals.map((s) => (
            <div key={s.id} className="p-3">
              <p>
                <span className="chip mr-2">{s.kind}</span>
                {s.detail}
              </p>
              <p className="mt-0.5 text-xs text-stone-400">
                {s.review?.place.name ?? s.user?.name ?? "—"} · sévérité {Math.round(s.severity * 100)} %
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
