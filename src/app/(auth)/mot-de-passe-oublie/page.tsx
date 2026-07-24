import type { Metadata } from "next";
import { forgotPasswordAction } from "@/server/actions/auth";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-1 text-2xl font-extrabold">Mot de passe oublié</h1>
      <p className="mb-6 text-sm text-stone-500">
        Indiquez votre adresse e-mail : nous vous enverrons un lien de réinitialisation valable une heure.
      </p>
      <div className="card p-6">
        <ActionForm action={forgotPasswordAction} submitLabel="Envoyer le lien">
          <div>
            <label htmlFor="email" className="label">Adresse e-mail</label>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" />
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
