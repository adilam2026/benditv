"use client";

// Formulaire adaptatif de publication d'expérience en 6 étapes,
// avec sauvegarde automatique du brouillon (localStorage) et
// suggestion en cas de commentaire trop vague (jamais bloquant).

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { submitReviewAction } from "@/server/actions/review";
import type { FormState } from "@/server/actions/auth";

export type CriterionView = {
  id: string;
  slug: string;
  name: string;
  type: string;
  required: boolean;
  options: { value: string; label: string }[];
};

const VAGUE = [
  /^c.?était (bien|bon|top|super|nul|pas mal)\.?$/i,
  /^(très )?(bien|bon|top|super|excellent|nul|moyen|correct|parfait)\.?$/i,
  /^(j.?aime( bien)?|à recommander|je recommande)\.?$/i,
  /^(rien à dire|ras|ok|pas mal)\.?$/i,
];

const CONTEXTS = [
  ["famille", "En famille"],
  ["couple", "En couple"],
  ["amis", "Entre amis"],
  ["solo", "Seul(e)"],
  ["travail", "Travail"],
  ["livraison", "Livraison"],
] as const;

const STEPS = ["Contexte", "Critères", "Commentaire", "Preuve", "Publication"];

export function ReviewForm({
  placeId,
  placeName,
  criteria,
}: {
  placeId: string;
  placeName: string;
  criteria: CriterionView[];
}) {
  const draftKey = `reco-draft-${placeId}`;
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"express" | "guide" | "detaille">("express");
  const [context, setContext] = useState("famille");
  const [visitedAt, setVisitedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [need, setNeed] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [positives, setPositives] = useState("");
  const [cautions, setCautions] = useState("");
  const [tip, setTip] = useState("");
  const [evidence, setEvidence] = useState("none");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [state, formAction, pending] = useActionState<FormState, FormData>(submitReviewAction, null);

  // Brouillon : restauration puis sauvegarde automatique
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.answers) setAnswers(d.answers);
        if (d.comment) setComment(d.comment);
        if (d.context) setContext(d.context);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ answers, comment, context }));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [answers, comment, context, draftKey]);

  // Formulaire adaptatif : les critères affichés dépendent du contexte
  const visibleCriteria = useMemo(() => {
    let list = criteria;
    if (context !== "famille") list = list.filter((c) => c.slug !== "accueil-enfants");
    if (context === "livraison") {
      list = list.filter((c) => !["accueil", "calme", "niveau-sonore", "toilettes", "parking-facile", "accessibilite-pmr"].includes(c.slug));
    }
    if (mode === "express") {
      const required = list.filter((c) => c.required);
      const extra = list.filter((c) => !c.required).slice(0, Math.max(0, 5 - required.length));
      return [...required, ...extra];
    }
    return list;
  }, [criteria, context, mode]);

  const vague = comment.trim().length > 0 && VAGUE.some((p) => p.test(comment.trim()));
  const answeredScaleCount = visibleCriteria.filter((c) => answers[c.id]).length;
  const canNext =
    step === 0 ? !!visitedAt && !!context :
    step === 1 ? answeredScaleCount > 0 :
    true;

  return (
    <div className="card p-6">
      <ol className="mb-6 flex flex-wrap gap-2 text-xs" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <li key={s} className={`chip ${i === step ? "border-brand-600 bg-brand-50 font-semibold text-brand-800" : i < step ? "text-brand-700" : ""}`}>
            {i < step ? "✓ " : `${i + 1}. `}{s}
          </li>
        ))}
      </ol>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="placeId" value={placeId} />
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="answers" value={JSON.stringify(answers)} />
        <input type="hidden" name="context" value={context} />
        <input type="hidden" name="visitedAt" value={visitedAt} />
        <input type="hidden" name="need" value={need} />
        <input type="hidden" name="comment" value={comment} />
        <input type="hidden" name="positives" value={positives} />
        <input type="hidden" name="cautions" value={cautions} />
        <input type="hidden" name="tip" value={tip} />
        <input type="hidden" name="evidence" value={evidence} />
        <input type="hidden" name="visibility" value={visibility} />

        {step === 0 && (
          <fieldset className="space-y-4">
            <legend className="mb-2 font-bold">Votre visite chez {placeName}</legend>
            <div className="flex flex-wrap gap-2">
              {(["express", "guide", "detaille"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`chip ${mode === m ? "border-brand-600 bg-brand-50 font-semibold text-brand-800" : ""}`}
                >
                  {m === "express" ? "⚡ Avis express (30 s)" : m === "guide" ? "🧭 Avis guidé" : "📝 Expérience détaillée"}
                </button>
              ))}
            </div>
            <div>
              <label className="label" htmlFor="rv-date">Date de la visite</label>
              <input
                id="rv-date" type="date" required max={new Date().toISOString().slice(0, 10)}
                value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} className="input max-w-xs"
              />
            </div>
            <div>
              <span className="label">Contexte de la visite</span>
              <div className="flex flex-wrap gap-2">
                {CONTEXTS.map(([value, label]) => (
                  <button
                    key={value} type="button" onClick={() => setContext(value)}
                    className={`chip ${context === value ? "border-brand-600 bg-brand-50 font-semibold text-brand-800" : ""}`}
                    aria-pressed={context === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="rv-need">Pour quel besoin ? (facultatif)</label>
              <input
                id="rv-need" value={need} onChange={(e) => setNeed(e.target.value)}
                className="input" placeholder="Ex. : dîner calme avec enfants, coloration, réparation…"
              />
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="space-y-4">
            <legend className="mb-1 font-bold">Quelques questions concrètes</legend>
            <p className="text-xs text-stone-500">
              {mode === "express"
                ? "Mode express : uniquement les questions essentielles."
                : "Répondez à ce qui correspond à votre expérience, le reste est facultatif."}
              {" "}Les questions s&apos;adaptent à votre contexte ({CONTEXTS.find(([v]) => v === context)?.[1].toLowerCase()}).
            </p>
            {visibleCriteria.map((c) => (
              <div key={c.id}>
                <label className="label" htmlFor={`crit-${c.id}`}>
                  {c.name} {c.required && <span className="text-red-600" aria-hidden>*</span>}
                </label>
                {c.type === "SCALE" ? (
                  <div className="flex items-center gap-3">
                    <input
                      id={`crit-${c.id}`} type="range" min={0} max={10} step={0.5}
                      value={answers[c.id] ?? "7"}
                      onChange={(e) => setAnswers((a) => ({ ...a, [c.id]: e.target.value }))}
                      className="flex-1 accent-teal-700"
                      aria-valuetext={`${answers[c.id] ?? "non noté"} sur 10`}
                    />
                    <span className="w-16 text-right text-sm font-semibold">
                      {answers[c.id] ? `${answers[c.id]}/10` : "—"}
                    </span>
                    {!answers[c.id] && (
                      <button type="button" className="btn-ghost text-xs" onClick={() => setAnswers((a) => ({ ...a, [c.id]: "7" }))}>
                        Noter
                      </button>
                    )}
                  </div>
                ) : c.type === "AMOUNT" ? (
                  <input
                    id={`crit-${c.id}`} type="number" min={0} className="input max-w-xs"
                    value={answers[c.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [c.id]: e.target.value }))}
                    placeholder="MAD"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {c.options.map((o) => (
                      <button
                        key={o.value} type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [c.id]: o.value }))}
                        className={`chip ${answers[c.id] === o.value ? "border-brand-600 bg-brand-50 font-semibold text-brand-800" : ""}`}
                        aria-pressed={answers[c.id] === o.value}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="space-y-4">
            <legend className="mb-1 font-bold">Racontez (facultatif)</legend>
            <div>
              <label className="label" htmlFor="rv-comment">Votre commentaire</label>
              <textarea
                id="rv-comment" rows={4} className="input"
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Ce qui vous a marqué : accueil, propreté, délais, prix…"
              />
              {vague && (
                <p className="mt-1 rounded-lg bg-accent-100 px-3 py-2 text-xs text-accent-700" role="status">
                  Pouvez-vous préciser ce que vous avez apprécié : accueil, propreté, qualité, délai ou prix ?
                  (facultatif — votre avis reste valable tel quel)
                </p>
              )}
            </div>
            {mode !== "express" && (
              <>
                <div>
                  <label className="label" htmlFor="rv-pos">Points positifs</label>
                  <input id="rv-pos" className="input" value={positives} onChange={(e) => setPositives(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="rv-neg">Points de vigilance</label>
                  <input id="rv-neg" className="input" value={cautions} onChange={(e) => setCautions(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="rv-tip">Un conseil utile ?</label>
                  <input id="rv-tip" className="input" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="Ex. : réservez le week-end" />
                </div>
              </>
            )}
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="space-y-3">
            <legend className="mb-1 font-bold">Renforcer la confiance (facultatif)</legend>
            <p className="text-xs text-stone-500">
              Une preuve augmente le poids de votre expérience. Les données détaillées (position exacte, ticket)
              sont transformées en simple indicateur de vérification puis supprimées.
            </p>
            {[
              ["none", "Aucune preuve — expérience déclarée"],
              ["geoloc", "📍 Confirmer ma visite par géolocalisation (avec mon consentement)"],
              ["ticket", "🧾 J'ai un ticket ou reçu (anonymisé)"],
              ["reservation", "📅 J'avais réservé via la plateforme"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                <input
                  type="radio" name="evidence-radio" value={value}
                  checked={evidence === value} onChange={() => setEvidence(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>
        )}

        {step === 4 && (
          <fieldset className="space-y-4">
            <legend className="mb-1 font-bold">Aperçu et publication</legend>
            <div className="rounded-xl bg-stone-50 p-4 text-sm">
              <p><strong>{placeName}</strong> — visite du {visitedAt} ({CONTEXTS.find(([v]) => v === context)?.[1].toLowerCase()})</p>
              <p className="mt-1 text-stone-600">{answeredScaleCount} critère{answeredScaleCount > 1 ? "s" : ""} renseigné{answeredScaleCount > 1 ? "s" : ""}</p>
              {comment && <p className="mt-1 italic text-stone-600">« {comment} »</p>}
            </div>
            <div>
              <span className="label">Visibilité de votre avis</span>
              <div className="flex flex-wrap gap-2">
                {[["PUBLIC", "Public"], ["NETWORK", "Mon réseau uniquement"], ["PRIVATE", "Privé"]].map(([value, label]) => (
                  <button
                    key={value} type="button" onClick={() => setVisibility(value)}
                    className={`chip ${visibility === value ? "border-brand-600 bg-brand-50 font-semibold text-brand-800" : ""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-stone-600">
              <input type="checkbox" name="consent" required className="mt-0.5" />
              <span>Je confirme que cette expérience est personnelle, sincère et sans conflit d&apos;intérêts.</span>
            </label>
          </fieldset>
        )}

        {state?.error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}
        {state?.success && (
          <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">{state.success}</p>
        )}

        <div className="flex justify-between">
          <button type="button" className="btn-secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            ← Précédent
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Continuer →
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Publication…" : "Publier mon expérience"}
            </button>
          )}
        </div>
        <p className="text-right text-xs text-stone-400">Brouillon enregistré automatiquement sur cet appareil.</p>
      </form>
    </div>
  );
}
