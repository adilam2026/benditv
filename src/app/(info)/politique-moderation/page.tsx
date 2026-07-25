import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de modération" };

export default function ModerationPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-stone-700">
      <h1 className="mb-6 text-2xl font-extrabold text-stone-900">Politique de modération</h1>
      <div className="space-y-5 text-sm">
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Principes</h2>
          <p>Les avis doivent décrire une expérience personnelle, récente et vérifiable. La modération protège à la fois les consommateurs (contre les faux avis) et les professionnels (contre les campagnes de dénigrement).</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Motifs de signalement</h2>
          <p>Faux avis, conflit d&apos;intérêts, contenu injurieux, donnée personnelle, photo non autorisée, publicité, hors sujet, information incorrecte, harcèlement, contenu dangereux.</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Processus</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Signalement (utilisateur ou détection automatique), avec pièce justificative possible.</li>
            <li>Examen par un modérateur : suspension temporaire, demande de preuve à l&apos;auteur, masquage ou rejet du signalement.</li>
            <li>Décision motivée, notifiée aux parties, journalisée.</li>
            <li>Recours possible par l&apos;auteur comme par le signaleur.</li>
          </ol>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Ce que la modération ne fait pas</h2>
          <p>Supprimer un avis négatif simplement parce qu&apos;il déplaît, modifier une note, ou avantager un professionnel abonné. Un professionnel ne peut jamais supprimer directement un avis.</p>
        </section>
      </div>
    </div>
  );
}
