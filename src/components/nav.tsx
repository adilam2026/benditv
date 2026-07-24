"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function UserMenu({
  user,
  notifCount,
}: {
  user: { name: string; role: string } | null;
  notifCount: number;
}) {
  const [open, setOpen] = useState(false);
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/connexion" className="btn-ghost">Connexion</Link>
        <Link href="/inscription" className="btn-primary hidden sm:inline-flex">Inscription</Link>
      </div>
    );
  }
  const firstName = user.name.split(" ")[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
          {firstName.charAt(0)}
        </span>
        <span className="hidden sm:inline">{firstName}</span>
        {notifCount > 0 && (
          <span className="rounded-full bg-accent-600 px-1.5 text-[10px] font-bold text-white">
            {notifCount}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg"
          onClick={() => setOpen(false)}
        >
          <Link href="/compte" className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50" role="menuitem">Mon tableau de bord</Link>
          <Link href="/compte/notifications" className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50" role="menuitem">
            Notifications {notifCount > 0 && <span className="ml-1 rounded-full bg-accent-100 px-1.5 text-xs font-semibold text-accent-700">{notifCount}</span>}
          </Link>
          <Link href="/compte/experiences" className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50" role="menuitem">Mes expériences</Link>
          <Link href="/compte/favoris" className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50" role="menuitem">Mes favoris</Link>
          {(user.role === "PROFESSIONAL" || user.role === "ADMIN") && (
            <Link href="/pro" className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50" role="menuitem">Espace professionnel</Link>
          )}
          {(user.role === "MODERATOR" || user.role === "ADMIN") && (
            <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50" role="menuitem">Administration</Link>
          )}
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50" role="menuitem">
              Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function MobileNav({ loggedIn, notifCount }: { loggedIn: boolean; notifCount: number }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Accueil", icon: "🏠" },
    { href: "/recherche", label: "Rechercher", icon: "🔍" },
    { href: "/avis/nouveau", label: "Contribuer", icon: "✍️" },
    { href: loggedIn ? "/compte/favoris" : "/connexion", label: "Favoris", icon: "❤️" },
    { href: loggedIn ? "/compte" : "/connexion", label: "Compte", icon: "👤" },
  ];
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-stone-200 bg-white md:hidden"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
            pathname === item.href ? "font-semibold text-brand-700" : "text-stone-500"
          }`}
        >
          <span aria-hidden className="relative text-base">
            {item.icon}
            {item.label === "Compte" && notifCount > 0 && (
              <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-accent-600" />
            )}
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
