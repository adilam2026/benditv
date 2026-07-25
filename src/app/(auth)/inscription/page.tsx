import type { Metadata } from "next";
import Link from "next/link";
import { registerAction } from "@/server/actions/auth";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Inscription" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-1 text-2xl font-extrabold">Créer un compte</h1>
      <p className="mb-6 text-sm text-stone-500">
        Publiez vos expériences, suivez vos proches et recevez des recommandations adaptées.
      </p>
      <div className="card p-6">
        <ActionForm action={registerAction} submitLabel="Créer mon compte">
          <div>
            <label htmlFor="name" className="label">Nom affiché</label>
            <input id="name" name="name" required minLength={2} className="input" placeholder="Ex. : Salma I." />
          </div>
          <div>
            <label htmlFor="email" className="label">Adresse e-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" />
            <p className="mt-1 text-xs text-stone-400">
              En développement, la validation d&apos;e-mail est simulée (aucun envoi réel).
            </p>
          </div>
          <div>
            <label htmlFor="password" className="label">Mot de passe</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
            <p className="mt-1 text-xs text-stone-400">8 caractères minimum, avec une majuscule et un chiffre.</p>
          </div>
          <label className="flex items-start gap-2 text-sm text-stone-600">
            <input type="checkbox" name="cgu" required className="mt-0.5" />
            <span>
              J&apos;accepte les <Link href="/cgu" className="text-brand-700 underline">conditions générales</Link> et la{" "}
              <Link href="/confidentialite" className="text-brand-700 underline">politique de confidentialité</Link>.
            </span>
          </label>
        </ActionForm>
        <p className="mt-4 text-center text-sm text-stone-500">
          Déjà inscrit ? <Link href="/connexion" className="text-brand-700 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
