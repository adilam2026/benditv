import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Comment ça marche" };

const STEPS = [
  {
    title: "1. Exprimez votre besoin en langage naturel",
    body: "« Un restaurant calme à Dar Bouazza avec deux enfants et parking, moins de 150 DH par personne. » La plateforme comprend la catégorie, la zone, le budget, le contexte et les équipements — en français, en arabe ou en darija.",
  },
  {
    title: "2. Des résultats expliqués",
    body: "Chaque résultat affiche la note publique (identique pour tous), le niveau de confiance statistique, le score de compatibilité avec votre recherche et la raison précise de la recommandation.",
  },
  {
    title: "3. Des expériences structurées, pas des étoiles arbitraires",
    body: "Contribuer prend 20 à 40 secondes : quelques questions concrètes adaptées à la catégorie (propreté, délais, prix payé, accueil des enfants…), avec preuve facultative pour renforcer la confiance.",
  },
  {
    title: "4. Votre réseau personnalise, sans fausser",
    body: "Les avis de vos proches remontent dans votre classement et s'affichent séparément. Ils ne modifient jamais la note publique.",
  },
  {
    title: "5. Une protection active contre les faux avis",
    body: "Vagues suspectes, textes copiés, comptes jetables : les contributions douteuses sont écartées du calcul, et la fiche l'indique publiquement.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Comment fonctionne la plateforme</h1>
      <div className="space-y-4">
        {STEPS.map((s) => (
          <section key={s.title} className="card p-5">
            <h2 className="mb-1 font-bold">{s.title}</h2>
            <p className="text-sm text-stone-600">{s.body}</p>
          </section>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/confiance" className="btn-secondary">La notation en détail</Link>
        <Link href="/anti-fraude" className="btn-secondary">Le dispositif anti-fraude</Link>
        <Link href="/inscription" className="btn-primary">Créer un compte</Link>
      </div>
    </div>
  );
}
