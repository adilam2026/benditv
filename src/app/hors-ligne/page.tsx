import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Hors connexion" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden>📡</p>
      <h1 className="mt-4 text-2xl font-extrabold">Vous êtes hors connexion</h1>
      <p className="mt-2 text-sm text-stone-500">
        Impossible de joindre la plateforme pour le moment. Vérifiez votre connexion puis réessayez.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">Réessayer</Link>
    </div>
  );
}
