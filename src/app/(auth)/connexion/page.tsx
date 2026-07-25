import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "@/server/actions/auth";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Connexion" };

const DEMO_ACCOUNTS = [
  ["Administrateur", "admin@recofiable.demo", "Admin123!"],
  ["Modérateur", "moderateur@recofiable.demo", "Moderateur123!"],
  ["Utilisateur", "utilisateur@recofiable.demo", "Utilisateur123!"],
  ["Professionnel (gratuit)", "pro-gratuit@recofiable.demo", "Professionnel123!"],
  ["Professionnel (premium)", "pro-premium@recofiable.demo", "Professionnel123!"],
];

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-1 text-2xl font-extrabold">Connexion</h1>
      <p className="mb-6 text-sm text-stone-500">
        Retrouvez vos recommandations, favoris et expériences.
      </p>
      <div className="card p-6">
        <ActionForm action={loginAction} submitLabel="Se connecter">
          <div>
            <label htmlFor="email" className="label">Adresse e-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" />
          </div>
          <div>
            <label htmlFor="password" className="label">Mot de passe</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
          </div>
        </ActionForm>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/mot-de-passe-oublie" className="text-brand-700 hover:underline">Mot de passe oublié ?</Link>
          <Link href="/inscription" className="text-brand-700 hover:underline">Créer un compte</Link>
        </div>
      </div>
      <div className="card mt-6 border-accent-600/30 bg-accent-100/40 p-5">
        <h2 className="mb-2 text-sm font-bold text-accent-700">Comptes de démonstration</h2>
        <p className="mb-3 text-xs text-stone-600">
          Ces comptes sont fictifs et servent uniquement à explorer la plateforme.
        </p>
        <ul className="space-y-1.5 text-xs text-stone-700">
          {DEMO_ACCOUNTS.map(([role, email, pwd]) => (
            <li key={email} className="flex flex-wrap justify-between gap-x-2">
              <span className="font-medium">{role}</span>
              <code className="text-stone-600">{email} · {pwd}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
