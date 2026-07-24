import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-stone-700">
      <h1 className="mb-6 text-2xl font-extrabold text-stone-900">Politique de confidentialité</h1>
      <p className="mb-4 text-xs text-stone-400">
        Version 1.0 — document de démonstration inspiré des principes de la loi marocaine 09-08 et des standards
        internationaux de protection des données.
      </p>
      <div className="space-y-5 text-sm">
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Données collectées et finalités</h2>
          <p>Nous collectons uniquement les données nécessaires : identifiants de compte, préférences déclarées, contributions publiées et journaux techniques de sécurité. Finalités : fournir les recommandations, garantir la fiabilité des avis, sécuriser le service.</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Minimisation et conservation</h2>
          <p>La géolocalisation est facultative et transformée en simple indicateur de vérification : la position précise n&apos;est pas conservée. Les preuves d&apos;achat sont anonymisées puis supprimées. Les métadonnées inutiles des photos (EXIF) ne sont pas stockées.</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Vos droits</h2>
          <p>Depuis la page « Mes données » : export JSON de vos données, gestion des consentements, historique des connexions, suppression du compte. Vous pouvez aussi rectifier votre profil à tout moment.</p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Ce que nous ne faisons jamais</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>stocker un numéro de carte bancaire ;</li>
            <li>exposer publiquement une adresse IP, une géolocalisation précise ou une preuve d&apos;achat ;</li>
            <li>vendre vos données personnelles ;</li>
            <li>importer vos contacts sans votre consentement explicite.</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Statistiques professionnelles</h2>
          <p>Les professionnels ne voient que des statistiques agrégées et anonymisées : jamais l&apos;identité des visiteurs au-delà de ce que ceux-ci ont rendu public.</p>
        </section>
      </div>
    </div>
  );
}
