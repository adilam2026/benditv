import type { Metadata } from "next";

export const metadata: Metadata = { title: "Questions fréquentes" };

const FAQ = [
  ["Comment la note sur 10 est-elle calculée ?", "Elle combine les critères notés par les contributeurs, la récence des expériences, leur niveau de vérification et la fiabilité des comptes, avec une moyenne bayésienne ancrée sur la moyenne de la catégorie. Ce n'est jamais une simple moyenne arithmétique."],
  ["Pourquoi deux utilisateurs voient-ils des classements différents ?", "Le classement est personnalisé selon votre besoin, votre budget, votre zone et votre réseau. La note publique, elle, est identique pour tous."],
  ["Un professionnel peut-il payer pour améliorer sa note ?", "Non. Aucun abonnement ne modifie les notes, ne supprime d'avis légitime ni ne masque une faiblesse. Les emplacements sponsorisés sont clairement signalés."],
  ["Que deviennent mes preuves de visite (géolocalisation, ticket) ?", "Elles sont transformées en simple indicateur de vérification (« Visite confirmée », « Achat confirmé ») puis les données détaillées sont supprimées selon nos règles de conservation."],
  ["Un avis peut-il être supprimé ?", "Vous pouvez modifier ou supprimer vos propres avis. Un professionnel peut contester un avis auprès de la modération, mais jamais le supprimer directement. Chaque décision est motivée et un recours est possible."],
  ["Comment signaler un faux avis ?", "Sur chaque avis, le bouton « Signaler » transmet le contenu à la modération avec le motif choisi. Nos contrôles automatiques détectent aussi les vagues suspectes."],
  ["La plateforme copie-t-elle les avis de Google ou Facebook ?", "Non. Toutes les expériences sont publiées directement par des membres de la plateforme. Aucune collecte sur d'autres plateformes n'est effectuée."],
  ["Puis-je récupérer ou supprimer mes données ?", "Oui : la page « Mes données » de votre compte permet l'export JSON, la gestion des consentements et la suppression du compte."],
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Questions fréquentes</h1>
      <div className="space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="card p-5">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-sm text-stone-600">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
