import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { DraftsList } from "@/components/drafts-list";

export const metadata: Metadata = { title: "Mes brouillons" };

export default async function DraftsPage() {
  await requireUser();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold">Mes brouillons</h1>
      <p className="mb-6 text-sm text-stone-500">
        Les brouillons d&apos;expériences sont enregistrés automatiquement sur cet appareil pendant la rédaction,
        et supprimés à la publication.
      </p>
      <DraftsList />
    </div>
  );
}
