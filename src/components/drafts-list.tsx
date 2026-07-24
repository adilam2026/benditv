"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Draft = { key: string; placeId: string; comment?: string; context?: string };

export function DraftsList() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);

  const load = () => {
    const found: Draft[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("reco-draft-")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) ?? "{}");
          found.push({ key, placeId: key.replace("reco-draft-", ""), ...data });
        } catch {}
      }
    }
    setDrafts(found);
  };
  useEffect(load, []);

  if (drafts === null) {
    return <div className="card animate-pulse p-8 text-center text-sm text-stone-400">Chargement des brouillons…</div>;
  }
  if (drafts.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-stone-500">
        Aucun brouillon sur cet appareil.{" "}
        <Link href="/avis/nouveau" className="font-medium text-brand-700 hover:underline">Commencer une expérience</Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {drafts.map((d) => (
        <div key={d.key} className="card flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Brouillon d&apos;expérience</p>
            {d.comment && <p className="truncate text-sm text-stone-500">« {d.comment} »</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              className="btn-ghost text-red-700"
              onClick={() => {
                localStorage.removeItem(d.key);
                load();
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}
      <p className="text-xs text-stone-400">
        Pour reprendre un brouillon, retournez sur la fiche du lieu concerné puis « Partager mon expérience » :
        vos réponses seront restaurées automatiquement.
      </p>
    </div>
  );
}
