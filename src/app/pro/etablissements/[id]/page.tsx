import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { updatePlaceInfoAction, updateHoursAction } from "@/server/actions/pro";
import { ActionForm } from "@/components/forms";
import { ScoreBar } from "@/components/rating";

export const metadata: Metadata = { title: "Gérer l'établissement" };

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const toTime = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export default async function ProPlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("PROFESSIONAL");
  const place = await prisma.place.findFirst({
    where: { id, organization: { members: { some: { userId: user.id } } } },
    include: {
      category: true,
      zone: true,
      hours: { orderBy: { dayOfWeek: "asc" } },
      photos: true,
      ratings: { where: { isCurrent: true } },
      criterionScores: { include: { criterion: true }, orderBy: { score: "desc" } },
      organization: { include: { subscriptions: { where: { status: "ACTIVE" }, include: { plan: true } } } },
    },
  });
  if (!place) notFound();
  const plan = place.organization?.subscriptions[0]?.plan;
  const statsLevel = plan?.statsLevel ?? 0;
  const hoursByDay = new Map(place.hours.map((h) => [h.dayOfWeek, h]));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{place.name}</h1>
        <Link href={`/lieux/${place.slug}`} className="btn-secondary">Voir la fiche publique</Link>
      </div>

      <section className="card p-6">
        <h2 className="mb-3 font-bold">Informations</h2>
        <p className="mb-3 text-xs text-stone-400">
          Ces informations sont affichées comme « déclarées par le professionnel » tant qu&apos;elles ne sont pas
          confirmées par la communauté ou vérifiées par la plateforme.
        </p>
        <ActionForm action={updatePlaceInfoAction} submitLabel="Enregistrer">
          <input type="hidden" name="placeId" value={place.id} />
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={3} defaultValue={place.description ?? ""} className="input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="phone">Téléphone</label>
              <input id="phone" name="phone" defaultValue={place.phone ?? ""} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="whatsapp">WhatsApp</label>
              <input id="whatsapp" name="whatsapp" defaultValue={place.whatsapp ?? ""} className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="website">Site web</label>
            <input id="website" name="website" type="url" defaultValue={place.website ?? ""} className="input" placeholder="https://…" />
          </div>
          <div>
            <label className="label" htmlFor="address">Adresse</label>
            <input id="address" name="address" defaultValue={place.address ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="avgPricePerPerson">Prix moyen par personne (MAD)</label>
            <input id="avgPricePerPerson" name="avgPricePerPerson" type="number" min={0} defaultValue={place.avgPricePerPerson ?? ""} className="input max-w-xs" />
          </div>
        </ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="mb-3 font-bold">Horaires</h2>
        <form action={updateHoursAction} className="space-y-2">
          <input type="hidden" name="placeId" value={place.id} />
          {DAYS.map((day, i) => {
            const h = hoursByDay.get(i);
            return (
              <div key={day} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0">{day}</span>
                <input type="time" name={`open-${i}`} defaultValue={h ? toTime(h.openMin) : ""} className="input max-w-32" aria-label={`Ouverture ${day}`} />
                <span>–</span>
                <input type="time" name={`close-${i}`} defaultValue={h ? toTime(h.closeMin) : ""} className="input max-w-32" aria-label={`Fermeture ${day}`} />
              </div>
            );
          })}
          <button type="submit" className="btn-primary mt-2">Enregistrer les horaires</button>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="mb-3 font-bold">Photos ({place.photos.length} / {plan?.maxPhotos ?? 3})</h2>
        <p className="text-sm text-stone-500">
          Votre abonnement « {plan?.name ?? "Gratuit"} » permet {plan?.maxPhotos ?? 3} photos professionnelles.
          {(plan?.maxPhotos ?? 3) <= 3 && (
            <> <Link href="/pro/abonnement" className="font-medium text-brand-700 hover:underline">Passez à l&apos;offre Présence</Link> pour en ajouter davantage.</>
          )}
        </p>
        <p className="mt-2 text-xs text-stone-400">
          L&apos;upload de fichiers utilise le stockage local en développement (dossier public/uploads) — voir le
          service de stockage abstrait.
        </p>
      </section>

      <section className="card p-6">
        <h2 className="mb-3 font-bold">Vos critères vus par les clients</h2>
        {statsLevel >= 1 ? (
          <div className="space-y-2">
            {place.criterionScores.map((cs) => (
              <ScoreBar key={cs.id} label={cs.criterion.name} score={cs.score} count={cs.count} />
            ))}
            {statsLevel >= 2 && (
              <p className="mt-2 text-xs text-stone-400">
                Offre Performance : consultez l&apos;évolution détaillée et la comparaison catégorie dans{" "}
                <Link href="/pro/statistiques" className="font-medium text-brand-700 hover:underline">Statistiques</Link>.
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-stone-500">
              Note publique actuelle : <strong>{(place.ratings[0]?.rating ?? 0).toFixed(1).replace(".", ",")}/10</strong>{" "}
              ({place.ratings[0]?.reviewCount ?? 0} avis).
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Le détail par critère est disponible à partir de l&apos;offre Présence.{" "}
              <Link href="/pro/abonnement" className="font-medium text-brand-700 hover:underline">Voir les offres</Link>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
