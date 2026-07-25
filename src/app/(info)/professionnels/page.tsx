import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Espace professionnels",
  description: "Revendiquez votre fiche, répondez aux avis et suivez vos statistiques.",
};

export default function ProfessionalsLanding() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-extrabold">Professionnels : votre réputation, en toute transparence</h1>
      <p className="mb-8 text-stone-500">
        Revendiquez votre établissement, complétez vos informations, répondez publiquement aux avis et suivez
        l&apos;évolution de vos critères — sans jamais pouvoir acheter votre note.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["📋 Revendiquez votre fiche", "Justifiez votre rôle dans l'établissement ; notre équipe valide la revendication."],
          ["💬 Répondez aux avis", "Votre réponse publique est clairement distinguée de l'avis. Vous pouvez contester un avis, jamais le supprimer."],
          ["📊 Suivez vos critères", "Propreté, délais, rapport qualité-prix : voyez ce que vos clients constatent réellement, critère par critère."],
          ["🧾 Recevez des demandes", "Devis, réservations et contacts arrivent directement dans votre tableau de bord."],
        ].map(([title, body]) => (
          <div key={title} className="card p-5">
            <h2 className="mb-1 font-bold">{title}</h2>
            <p className="text-sm text-stone-600">{body}</p>
          </div>
        ))}
      </div>
      <div className="card mt-6 border-brand-200 bg-brand-50/40 p-5 text-sm text-stone-700">
        <strong>Notre engagement d&apos;indépendance :</strong> aucun abonnement ne permet d&apos;augmenter une note,
        de supprimer un avis légitime ni d&apos;apparaître premier sans mention « Sponsorisé ».
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/tarifs" className="btn-secondary">Voir les tarifs</Link>
        <Link href="/pro/revendication" className="btn-primary">Revendiquer ma fiche</Link>
      </div>
    </div>
  );
}
