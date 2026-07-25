import Link from "next/link";

const NAV = [
  ["/pro", "Tableau de bord"],
  ["/pro/etablissements", "Établissements"],
  ["/pro/avis", "Avis et réponses"],
  ["/pro/demandes", "Demandes reçues"],
  ["/pro/statistiques", "Statistiques"],
  ["/pro/abonnement", "Abonnement"],
  ["/pro/factures", "Factures"],
  ["/pro/revendication", "Revendiquer une fiche"],
] as const;

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <nav aria-label="Espace professionnel" className="hidden w-52 shrink-0 lg:block">
        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-stone-400">Espace pro</p>
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
          <summary className="btn-secondary cursor-pointer list-none">☰ Menu professionnel</summary>
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
