import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lutte contre les faux avis" };

export default function AntiFraudPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Lutte contre les faux avis</h1>
      <div className="space-y-4 text-sm text-stone-700">
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Ce que nous détectons</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>vagues d&apos;avis inhabituelles sur une fiche (volume anormal en quelques heures) ;</li>
            <li>textes identiques ou très proches entre plusieurs comptes ;</li>
            <li>concentration de notes extrêmes (10/10 ou 0/10) ;</li>
            <li>comptes créés récemment qui n&apos;évaluent qu&apos;une seule entreprise ;</li>
            <li>photos dupliquées entre plusieurs fiches ;</li>
            <li>campagnes organisées, positives comme négatives.</li>
          </ul>
          <p className="mt-2 text-xs text-stone-500">
            Les détails des formules ne sont pas publiés, pour ne pas aider les fraudeurs à les contourner.
          </p>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Des décisions graduées et tracées</h2>
          <p>
            Selon le niveau de risque, une contribution peut être acceptée, comptée avec un poids réduit, mise en
            attente, temporairement neutralisée ou transmise à la modération humaine. Rien n&apos;est supprimé
            silencieusement : chaque décision est journalisée et peut faire l&apos;objet d&apos;un recours.
          </p>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-bold">La transparence pour les visiteurs</h2>
          <p>
            Quand une vague suspecte est détectée, la fiche l&apos;affiche clairement : « Une activité inhabituelle a
            été détectée sur cette fiche. Certaines contributions récentes ne sont pas encore intégrées à la note. »
          </p>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Les nouveaux contributeurs restent bienvenus</h2>
          <p>
            Un compte récent n&apos;est jamais pénalisé pour sa seule nouveauté : une preuve de visite forte
            (géolocalisation consentie, ticket) compense l&apos;absence d&apos;historique.
          </p>
        </section>
      </div>
    </div>
  );
}
