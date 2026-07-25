import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confiance et notation" };

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Confiance et notation</h1>
      <div className="space-y-4 text-sm text-stone-700">
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Une note sur 10, jamais une simple moyenne</h2>
          <p>
            La note publique combine les scores par critère, la récence des expériences, leur niveau de
            vérification, la fiabilité des contributeurs et une moyenne bayésienne ancrée sur la moyenne de la
            catégorie. Concrètement : un lieu avec deux notes parfaites ne passe pas devant un lieu avec des
            centaines d&apos;avis fiables.
          </p>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Quatre niveaux de confiance</h2>
          <p>
            Chaque note est accompagnée d&apos;un niveau de confiance — faible, moyenne, élevée ou très élevée —
            calculé à partir du volume d&apos;expériences, de leur part vérifiée, de leur fraîcheur et de la
            dispersion des évaluations. Une note de 9/10 avec confiance faible n&apos;a pas la même valeur qu&apos;un
            8,4/10 avec confiance très élevée.
          </p>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Des expériences vérifiables</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Expérience déclarée</strong> — aucune preuve fournie.</li>
            <li><strong>Expérience cohérente</strong> — plusieurs signaux concordants détectés.</li>
            <li><strong>Visite confirmée</strong> — géolocalisation consentie, QR code ou photo prise sur place.</li>
            <li><strong>Achat ou réservation confirmés</strong> — ticket anonymisé ou réservation via la plateforme.</li>
          </ul>
          <p className="mt-2 text-xs text-stone-500">
            Les preuves détaillées (position exacte, ticket) sont transformées en simple indicateur puis supprimées.
          </p>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Indépendance commerciale</h2>
          <p>
            Aucun professionnel ne peut payer pour améliorer sa note, supprimer un avis légitime ou masquer une
            faiblesse. Les emplacements sponsorisés sont toujours signalés par la mention « Sponsorisé » et ne
            modifient jamais les notes.
          </p>
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-bold">Note publique vs classement personnalisé</h2>
          <p>
            La note publique est identique pour tous. Votre réseau, vos préférences et votre besoin du moment
            n&apos;influencent que l&apos;ordre de vos résultats et les explications — chaque résultat personnalisé
            indique « Pourquoi ce résultat ? ».
          </p>
        </section>
      </div>
    </div>
  );
}
