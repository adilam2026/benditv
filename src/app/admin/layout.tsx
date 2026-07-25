import Link from "next/link";
import { requireRole } from "@/server/auth/session";

const NAV = [
  ["/admin", "Tableau de bord"],
  ["/admin/utilisateurs", "Utilisateurs"],
  ["/admin/lieux", "Fiches"],
  ["/admin/categories", "Catégories et propositions"],
  ["/admin/moderation", "Modération"],
  ["/admin/fraude", "Vagues et anomalies"],
  ["/admin/revendications", "Revendications"],
  ["/admin/abonnements", "Abonnements"],
  ["/admin/import", "Import CSV"],
  ["/admin/parametres", "Paramètres"],
  ["/admin/audit", "Journal d'audit"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("MODERATOR");
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
      <nav aria-label="Administration" className="hidden w-56 shrink-0 lg:block">
        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-stone-400">Back-office</p>
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
          <summary className="btn-secondary cursor-pointer list-none">☰ Menu administration</summary>
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
