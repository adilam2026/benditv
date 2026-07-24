import type { Metadata } from "next";
import { requireRole } from "@/server/auth/session";
import { importCsvAction } from "@/server/actions/admin";
import { ActionForm } from "@/components/forms";
import { getPlacesProvider } from "@/server/integrations/places-provider";

export const metadata: Metadata = { title: "Import CSV" };

export default async function AdminImportPage() {
  await requireRole("ADMIN");
  const provider = getPlacesProvider();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold">Import de lieux (CSV)</h1>
      <p className="mb-6 text-sm text-stone-500">
        Format : <code>nom;categorie;zone;adresse;prix</code> — une ligne par lieu. Les slugs de catégorie et de
        zone doivent exister (ex. : <code>restaurant</code>, <code>dar-bouazza</code>).
      </p>
      <div className="card p-6">
        <ActionForm action={importCsvAction} submitLabel="Importer">
          <textarea
            name="csv"
            rows={8}
            className="input font-mono text-xs"
            placeholder={"nom;categorie;zone;adresse;prix\nCafé Exemple;cafe;maarif;12 rue Fictive;35"}
            aria-label="Contenu CSV"
          />
        </ActionForm>
      </div>
      <div className="card mt-6 p-5 text-sm text-stone-600">
        <h2 className="mb-1 font-bold text-stone-900">Fournisseur de lieux externe</h2>
        <p>
          Fournisseur actif : <strong>{provider.name}</strong> (données fictives locales). L&apos;abstraction
          « Provider de lieux » permet de brancher une API officielle de points d&apos;intérêt sous licence — jamais
          d&apos;aspiration de Google Maps ni de copie d&apos;avis d&apos;autres plateformes.
        </p>
      </div>
    </div>
  );
}
