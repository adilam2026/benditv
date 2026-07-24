"use client";

import { useActionState } from "react";
import type { FormState } from "@/server/actions/auth";

// Formulaire générique branché sur une action serveur avec état
// (erreurs compréhensibles, confirmation, bouton avec état de chargement).
export function ActionForm({
  action,
  children,
  submitLabel,
  className,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className ?? "space-y-4"}>
      {children}
      {state?.error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {state.success}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Veuillez patienter…" : submitLabel}
      </button>
    </form>
  );
}
