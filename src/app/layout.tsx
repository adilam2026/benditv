import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { APP_CONFIG } from "@/config/app";
import { getCurrentUser } from "@/server/auth/session";
import { unreadCount } from "@/server/services/notifications";
import { UserMenu, MobileNav } from "@/components/nav";
import { ServiceWorkerRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${APP_CONFIG.name} — recommandations locales fiables`,
    template: `%s · ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.slogan,
  manifest: "/manifest.webmanifest",
  openGraph: {
    siteName: APP_CONFIG.name,
    type: "website",
    locale: "fr_MA",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const notifCount = user ? await unreadCount(user.id) : 0;

  return (
    <html lang="fr">
      <body className="min-h-screen pb-16 md:pb-0">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          Aller au contenu
        </a>
        <div className="bg-accent-100 px-4 py-1.5 text-center text-xs text-accent-700">
          {APP_CONFIG.demoNotice}
        </div>
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-800">
              <span aria-hidden>{APP_CONFIG.logoEmoji}</span>
              {APP_CONFIG.name}
            </Link>
            <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
              <Link href="/recherche" className="btn-ghost">Rechercher</Link>
              <Link href="/categories" className="btn-ghost">Catégories</Link>
              <Link href="/questions" className="btn-ghost">Questions</Link>
              <Link href="/missions" className="btn-ghost">Missions</Link>
              <Link href="/professionnels" className="btn-ghost">Professionnels</Link>
            </nav>
            <UserMenu
              user={user ? { name: user.name, role: user.role } : null}
              notifCount={notifCount}
            />
          </div>
        </header>
        <main id="contenu">{children}</main>
        <footer className="mt-16 border-t border-stone-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-2 flex items-center gap-2 font-extrabold text-brand-800">
                <span aria-hidden>{APP_CONFIG.logoEmoji}</span> {APP_CONFIG.name}
              </p>
              <p className="text-stone-500">{APP_CONFIG.slogan}</p>
              <p className="mt-3 text-xs text-stone-400">
                Lancement : Maroc · Devise : {APP_CONFIG.currency} · Français / العربية
              </p>
            </div>
            <div>
              <p className="mb-2 font-semibold text-stone-900">Découvrir</p>
              <ul className="space-y-1.5 text-stone-500">
                <li><Link href="/fonctionnement" className="hover:text-brand-700">Comment ça marche</Link></li>
                <li><Link href="/confiance" className="hover:text-brand-700">Confiance et notation</Link></li>
                <li><Link href="/anti-fraude" className="hover:text-brand-700">Lutte anti-fraude</Link></li>
                <li><Link href="/contributeurs" className="hover:text-brand-700">Contributeurs</Link></li>
                <li><Link href="/listes" className="hover:text-brand-700">Listes publiques</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold text-stone-900">Professionnels</p>
              <ul className="space-y-1.5 text-stone-500">
                <li><Link href="/professionnels" className="hover:text-brand-700">Espace professionnel</Link></li>
                <li><Link href="/tarifs" className="hover:text-brand-700">Tarifs</Link></li>
                <li><Link href="/pro/revendication" className="hover:text-brand-700">Revendiquer une fiche</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold text-stone-900">Aide et légal</p>
              <ul className="space-y-1.5 text-stone-500">
                <li><Link href="/faq" className="hover:text-brand-700">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-brand-700">Contact</Link></li>
                <li><Link href="/cgu" className="hover:text-brand-700">Conditions générales</Link></li>
                <li><Link href="/confidentialite" className="hover:text-brand-700">Confidentialité</Link></li>
                <li><Link href="/politique-moderation" className="hover:text-brand-700">Modération</Link></li>
                <li><Link href="/cookies" className="hover:text-brand-700">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
            © {new Date().getFullYear()} {APP_CONFIG.name} — plateforme de démonstration, données fictives ·{" "}
            {APP_CONFIG.supportEmail}
          </div>
        </footer>
        <MobileNav loggedIn={!!user} notifCount={notifCount} />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
