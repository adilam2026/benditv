// Abstraction de paiement des abonnements professionnels.
// PAYMENT_PROVIDER=demo (défaut) : paiement fictif, facture de
// démonstration générée immédiatement. Aucun numéro de carte n'est
// jamais stocké par la plateforme.
// PAYMENT_PROVIDER=stripe : adaptateur à activer avec STRIPE_SECRET_KEY
// (clé à fournir par l'exploitant ; jamais incluse dans le code).

export type PaymentResult =
  | { ok: true; reference: string; isDemo: boolean }
  | { ok: false; error: string };

export async function chargeSubscription(
  organizationId: string,
  _amountMad: number
): Promise<PaymentResult> {
  const provider = process.env.PAYMENT_PROVIDER ?? "demo";
  if (provider === "demo") {
    return {
      ok: true,
      reference: `DEMO-${organizationId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      isDemo: true,
    };
  }
  if (provider === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { ok: false, error: "STRIPE_SECRET_KEY manquante : paiement indisponible." };
    }
    // Intégration Stripe réelle à implémenter avec le SDK officiel.
    return { ok: false, error: "Adaptateur Stripe non activé dans cette version de démonstration." };
  }
  return { ok: false, error: `Fournisseur de paiement inconnu : ${provider}` };
}
