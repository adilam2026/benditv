import Link from "next/link";
import { requireUser } from "@/server/auth/session";

const NAV = [
  ["/compte", "Tableau de bord"],
  ["/compte/profil", "Profil"],
  ["/compte/preferences", "Préférences"],
  ["/compte/reseau", "Réseau et invitations"],
  ["/compte/cercles", "Cercles"],
  ["/compte/favoris", "Favoris"],
  ["/compte/listes", "Listes"],
  ["/compte/experiences", "Mes expériences"],
  ["/compte/brouillons", "Brouillons"],
  ["/compte/questions", "Mes questions"],
  ["/compte/missions", "Mes missions"],
  ["/compte/badges", "Badges"],
  ["/compte/notifications", "Notifications"],
  ["/compte/donnees", "Mes données"],
  ["/compte/securite", "Sécurité"],
] as const;

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <nav aria-label="Espace utilisateur" className="hidden w-52 shrink-0 lg:block">
        <ul className="sticky top-20 space-y-0.5 text-sm">
          {NAV.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="block rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-100 hover:text-brand-800">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">
        <details className="mb-4 lg:hidden">
          <summary className="btn-secondary cursor-pointer list-none">☰ Menu du compte</summary>
          <ul className="card mt-2 space-y-0.5 p-2 text-sm">
            {NAV.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="block rounded-lg px-3 py-2 text-stone-600 hover:bg-stone-100">{label}</Link>
              </li>
            ))}
          </ul>
        </details>
        {children}
      </div>
    </div>
  );
}
