import type { Metadata } from "next";
import { resetPasswordAction } from "@/server/actions/auth";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">Nouveau mot de passe</h1>
      <div className="card p-6">
        {token ? (
          <ActionForm action={resetPasswordAction} submitLabel="Mettre à jour">
            <input type="hidden" name="token" value={token} />
            <div>
              <label htmlFor="password" className="label">Nouveau mot de passe</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
            </div>
          </ActionForm>
        ) : (
          <p className="text-sm text-stone-600">
            Lien incomplet : utilisez le lien reçu par e-mail (en développement, il s&apos;affiche dans la console du serveur).
          </p>
        )}
      </div>
    </div>
  );
}
