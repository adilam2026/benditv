"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  toggleFavoriteAction,
  reportAction,
  quoteRequestAction,
  reservationAction,
  voteHelpfulAction,
  addToListAction,
} from "@/server/actions/user";
import { ActionForm } from "@/components/forms";

export function FavoriteButton({
  placeId,
  path,
  isFavorite,
  loggedIn,
}: {
  placeId: string;
  path: string;
  isFavorite: boolean;
  loggedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();
  if (!loggedIn) {
    return (
      <Link href="/connexion" className="btn-secondary" title="Connectez-vous pour enregistrer">
        🤍 Enregistrer
      </Link>
    );
  }
  return (
    <button
      className="btn-secondary"
      disabled={pending}
      onClick={() => startTransition(() => toggleFavoriteAction(placeId, path))}
      aria-pressed={isFavorite}
    >
      {isFavorite ? "❤️ Enregistré" : "🤍 Enregistrer"}
    </button>
  );
}

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "Messenger", href: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}` },
    { label: "E-mail", href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}` },
  ];
  return (
    <details className="relative">
      <summary className="btn-secondary cursor-pointer list-none">↗️ Partager</summary>
      <div className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg">
        <button
          className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-50"
          onClick={async () => {
            if (navigator.share) {
              await navigator.share({ title, url }).catch(() => {});
            } else {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }
          }}
        >
          {copied ? "Lien copié ✓" : "Copier le lien"}
        </button>
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50">
            {l.label}
          </a>
        ))}
      </div>
    </details>
  );
}

export function AddToListButton({
  placeId,
  path,
  lists,
  loggedIn,
}: {
  placeId: string;
  path: string;
  lists: { id: string; title: string }[];
  loggedIn: boolean;
}) {
  if (!loggedIn) return null;
  return (
    <details className="relative">
      <summary className="btn-secondary cursor-pointer list-none">📋 Ajouter à une liste</summary>
      <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg">
        {lists.length === 0 && (
          <p className="px-3 py-2 text-xs text-stone-500">Vous n&apos;avez pas encore de liste.</p>
        )}
        {lists.map((l) => (
          <form key={l.id} action={addToListAction}>
            <input type="hidden" name="listId" value={l.id} />
            <input type="hidden" name="placeId" value={placeId} />
            <input type="hidden" name="path" value={path} />
            <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-50">
              {l.title}
            </button>
          </form>
        ))}
        <Link href="/compte/listes" className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-stone-50">
          + Nouvelle liste
        </Link>
      </div>
    </details>
  );
}

const REPORT_REASONS = [
  ["faux-avis", "Faux avis"],
  ["conflit", "Conflit d'intérêts"],
  ["injurieux", "Contenu injurieux"],
  ["donnees-perso", "Donnée personnelle"],
  ["photo", "Photo non autorisée"],
  ["pub", "Publicité"],
  ["hors-sujet", "Hors sujet"],
  ["incorrect", "Information incorrecte"],
  ["harcelement", "Harcèlement"],
  ["dangereux", "Contenu dangereux"],
] as const;

export function ReportDialog({
  targetKind,
  reviewId,
  placeId,
  loggedIn,
  compact,
}: {
  targetKind: "review" | "photo" | "place" | "pro-response";
  reviewId?: string;
  placeId?: string;
  loggedIn: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!loggedIn) {
    return (
      <Link href="/connexion" className={compact ? "text-xs text-stone-400 hover:text-red-700" : "btn-ghost"}>
        🚩 Signaler
      </Link>
    );
  }
  return (
    <>
      <button onClick={() => setOpen(true)} className={compact ? "text-xs text-stone-400 hover:text-red-700" : "btn-ghost"}>
        🚩 Signaler
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Signaler un contenu">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Signaler ce contenu</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost" aria-label="Fermer">✕</button>
            </div>
            <ActionForm action={reportAction} submitLabel="Envoyer le signalement">
              <input type="hidden" name="targetKind" value={targetKind} />
              {reviewId && <input type="hidden" name="reviewId" value={reviewId} />}
              {placeId && <input type="hidden" name="placeId" value={placeId} />}
              <div>
                <label className="label" htmlFor="reason">Motif</label>
                <select id="reason" name="reason" required className="input">
                  {REPORT_REASONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="detail">Précisions (facultatif)</label>
                <textarea id="detail" name="detail" rows={3} className="input" placeholder="Éléments factuels utiles à la modération" />
              </div>
            </ActionForm>
          </div>
        </div>
      )}
    </>
  );
}

export function QuoteReservationButtons({
  placeId,
  loggedIn,
  showReservation,
  showQuote,
}: {
  placeId: string;
  loggedIn: boolean;
  showReservation: boolean;
  showQuote: boolean;
}) {
  const [mode, setMode] = useState<"none" | "quote" | "reservation">("none");
  if (!showReservation && !showQuote) return null;
  if (!loggedIn) {
    return (
      <Link href="/connexion" className="btn-primary">
        {showReservation ? "Réserver" : "Demander un devis"}
      </Link>
    );
  }
  return (
    <>
      {showReservation && (
        <button className="btn-primary" onClick={() => setMode("reservation")}>📅 Réserver</button>
      )}
      {showQuote && (
        <button className="btn-secondary" onClick={() => setMode("quote")}>🧾 Demander un devis</button>
      )}
      {mode !== "none" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{mode === "quote" ? "Demande de devis" : "Demande de réservation"}</h2>
              <button onClick={() => setMode("none")} className="btn-ghost" aria-label="Fermer">✕</button>
            </div>
            {mode === "quote" ? (
              <ActionForm action={quoteRequestAction} submitLabel="Envoyer la demande">
                <input type="hidden" name="placeId" value={placeId} />
                <div>
                  <label className="label" htmlFor="need">Votre besoin</label>
                  <textarea id="need" name="need" rows={3} required className="input" placeholder="Ex. : table de 12 personnes avec service, menu marocain" />
                </div>
                <div>
                  <label className="label" htmlFor="budget">Budget indicatif (MAD, facultatif)</label>
                  <input id="budget" name="budget" type="number" min={0} className="input" />
                </div>
              </ActionForm>
            ) : (
              <ActionForm action={reservationAction} submitLabel="Envoyer la demande">
                <input type="hidden" name="placeId" value={placeId} />
                <div>
                  <label className="label" htmlFor="date">Date et heure</label>
                  <input id="date" name="date" type="datetime-local" required className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="partySize">Nombre de personnes</label>
                  <input id="partySize" name="partySize" type="number" min={1} max={50} defaultValue={2} required className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="note">Remarque (facultatif)</label>
                  <input id="note" name="note" className="input" placeholder="Ex. : terrasse, chaise haute…" />
                </div>
              </ActionForm>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function HelpfulButton({
  reviewId,
  path,
  count,
  loggedIn,
}: {
  reviewId: string;
  path: string;
  count: number;
  loggedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();
  if (!loggedIn) {
    return <span className="text-xs text-stone-400">👍 {count} utile{count > 1 ? "s" : ""}</span>;
  }
  return (
    <button
      className="text-xs text-stone-500 hover:text-brand-700"
      disabled={pending}
      onClick={() => startTransition(() => voteHelpfulAction(reviewId, path))}
    >
      👍 Utile ({count})
    </button>
  );
}
