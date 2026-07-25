import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function CguPage() {
  return (
    <div className="prose-sm mx-auto max-w-2xl px-4 py-10 text-stone-700">
      <h1 className="mb-6 text-2xl font-extrabold text-stone-900">Conditions générales d&apos;utilisation</h1>
      <p className="mb-4 text-xs text-stone-400">Version 1.0 — document de démonstration, sans valeur contractuelle réelle.</p>
      <div className="space-y-5 text-sm">
        <section>
          <h2 className="mb-1 font-bold text-stone-900">1. Objet</h2>
          <p>La plateforme met en relation des utilisateurs qui partagent des expériences structurées sur des lieux et professionnels locaux, et des visiteurs à la recherche de recommandations fiables.</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">2. Compte et responsabilité</h2>
          <p>Chaque compte est personnel. L&apos;utilisateur est responsable de la confidentialité de ses identifiants et de la véracité de ses contributions. Une expérience publiée doit décrire une visite ou une prestation réellement vécue.</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">3. Contenus interdits</h2>
          <p>Sont interdits : les faux avis, les avis rémunérés ou concertés, les contenus injurieux, diffamatoires, discriminatoires, les données personnelles de tiers, la publicité déguisée et toute manipulation des notes.</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">4. Notation et modération</h2>
          <p>Les notes publiques résultent d&apos;un calcul statistique décrit dans la page « Confiance et notation ». La plateforme peut réduire le poids, suspendre ou exclure une contribution suspecte, avec journalisation et voie de recours.</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">5. Professionnels</h2>
          <p>La revendication d&apos;une fiche nécessite un justificatif. Aucun service payant ne modifie les notes ni la visibilité organique au-delà des emplacements clairement signalés « Sponsorisé ».</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">6. Propriété intellectuelle</h2>
          <p>Les contributions restent la propriété de leurs auteurs, qui accordent à la plateforme une licence d&apos;affichage et d&apos;agrégation. La copie massive du contenu de la plateforme est interdite.</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">7. Résiliation</h2>
          <p>L&apos;utilisateur peut supprimer son compte à tout moment depuis la page « Mes données ». La plateforme peut suspendre un compte en cas de manquement grave, avec notification motivée.</p>
        </section>
      </div>
    </div>
  );
}
