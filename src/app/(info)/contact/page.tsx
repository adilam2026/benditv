import type { Metadata } from "next";
import { APP_CONFIG } from "@/config/app";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Contact</h1>
      <div className="card space-y-3 p-6 text-sm text-stone-700">
        <p><strong>Support :</strong> {APP_CONFIG.supportEmail}</p>
        <p><strong>Téléphone :</strong> {APP_CONFIG.contactPhone}</p>
        <p><strong>Professionnels :</strong> pour l&apos;offre Réseau (multi-établissements), écrivez-nous avec le nom de votre enseigne et le nombre d&apos;établissements.</p>
        <p className="text-xs text-stone-400">
          Plateforme de démonstration : les coordonnées ci-dessus sont fictives et aucun message n&apos;est réellement traité.
        </p>
      </div>
    </div>
  );
}
