import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique cookies" };

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-stone-700">
      <h1 className="mb-6 text-2xl font-extrabold text-stone-900">Cookies</h1>
      <div className="space-y-5 text-sm">
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Cookies strictement nécessaires</h2>
          <p>
            La plateforme utilise un unique cookie de session (<code>reco_session</code>), httpOnly et sécurisé,
            indispensable à la connexion. Il expire après 30 jours ou à la déconnexion.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Aucun cookie publicitaire</h2>
          <p>
            Aucun cookie de traçage publicitaire ni outil d&apos;analyse tiers n&apos;est déposé. Les statistiques
            d&apos;usage sont mesurées côté serveur, de façon agrégée.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold text-stone-900">Stockage local</h2>
          <p>
            Les brouillons d&apos;avis sont conservés dans le stockage local de votre navigateur, sur votre appareil
            uniquement, et jamais transmis tant que vous n&apos;avez pas publié.
          </p>
        </section>
      </div>
    </div>
  );
}
