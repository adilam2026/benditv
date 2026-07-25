// Connecteur social externe — mode démonstration.
// Aucune API Facebook réelle n'est appelée : les API sociales modernes
// ne donnent pas librement accès à la liste d'amis, et seules les
// données explicitement autorisées par l'utilisateur ET par la
// plateforme sociale pourront être exploitées si un connecteur officiel
// est un jour activé (SOCIAL_LOGIN_ENABLED + identifiants d'application).

export type SocialContact = { externalId: string; name: string };

export function socialLoginEnabled(): boolean {
  return process.env.SOCIAL_LOGIN_ENABLED === "true";
}

export async function fetchAuthorizedContacts(): Promise<SocialContact[]> {
  // En mode démo, aucune donnée externe n'est disponible.
  return [];
}
