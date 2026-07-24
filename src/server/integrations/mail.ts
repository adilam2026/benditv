// Abstraction d'envoi d'e-mails.
// MAIL_PROVIDER=console (défaut) : aucun envoi réel, les messages sont
// journalisés — validation d'e-mail simulée en développement.
// MAIL_PROVIDER=smtp : à brancher avec SMTP_URL (non fourni ici).

export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  const provider = process.env.MAIL_PROVIDER ?? "console";
  if (provider === "console") {
    console.log(`[mail:demo] À: ${to} — ${subject}\n${body}`);
    return;
  }
  // Adaptateur SMTP réel à brancher en production (nodemailer ou API).
  console.log(`[mail:${provider}] non configuré — message pour ${to} ignoré (${subject})`);
}
