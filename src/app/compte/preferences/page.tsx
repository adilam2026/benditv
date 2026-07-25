import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/session";
import { updatePreferencesAction } from "@/server/actions/account";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Mes préférences" };

export default async function PreferencesPage() {
  const user = await requireUser();
  const [prefs, zones, universes] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId: user.id } }),
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { kind: "universe" }, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-2xl font-extrabold">Mes préférences</h1>
      <p className="mb-6 text-sm text-stone-500">
        Ces informations facultatives personnalisent votre classement — jamais les notes publiques.
      </p>
      <div className="card p-6">
        <ActionForm action={updatePreferencesAction} submitLabel="Enregistrer mes préférences">
          <fieldset>
            <legend className="label">Univers favoris</legend>
            <div className="flex flex-wrap gap-2">
              {universes.map((u) => (
                <label key={u.id} className="chip cursor-pointer has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800">
                  <input
                    type="checkbox" name="favoriteCategories" value={u.slug}
                    defaultChecked={prefs?.favoriteCategories.includes(u.slug)}
                    className="sr-only"
                  />
                  {u.icon} {u.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Zones habituelles</legend>
            <div className="flex flex-wrap gap-2">
              {zones.map((z) => (
                <label key={z.id} className="chip cursor-pointer has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800">
                  <input
                    type="checkbox" name="preferredZones" value={z.id}
                    defaultChecked={prefs?.preferredZones.includes(z.id)}
                    className="sr-only"
                  />
                  {z.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="budgetLevel">Niveau de budget</label>
              <select id="budgetLevel" name="budgetLevel" defaultValue={prefs?.budgetLevel ?? ""} className="input">
                <option value="">Indifférent</option>
                <option value="1">Économique</option>
                <option value="2">Modéré</option>
                <option value="3">Confort</option>
                <option value="4">Premium</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="radiusKm">Rayon de recherche (km)</label>
              <input id="radiusKm" name="radiusKm" type="number" min={1} max={100} defaultValue={prefs?.radiusKm ?? 10} className="input" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hasChildren" defaultChecked={prefs?.hasChildren} />
            Je sors souvent avec des enfants
          </label>
          <div>
            <label className="label" htmlFor="childrenAges">Âges des enfants (facultatif)</label>
            <input id="childrenAges" name="childrenAges" defaultValue={prefs?.childrenAges ?? ""} className="input" placeholder="Ex. : 4 et 7 ans" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="mobilityNeeds" defaultChecked={prefs?.mobilityNeeds} />
            Accessibilité PMR nécessaire
          </label>
          <fieldset>
            <legend className="label">Notifications</legend>
            <div className="space-y-1.5 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="notifyInApp" defaultChecked={prefs?.notifyInApp ?? true} /> Dans l&apos;application</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="notifyEmail" defaultChecked={prefs?.notifyEmail ?? true} /> Par e-mail</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="notifyNetwork" defaultChecked={prefs?.notifyNetwork ?? true} /> Activité de mon réseau</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="notifyMissions" defaultChecked={prefs?.notifyMissions ?? true} /> Missions et badges</label>
            </div>
            <p className="mt-1 text-xs text-stone-400">L&apos;architecture est prête pour les notifications mobiles (PWA).</p>
          </fieldset>
        </ActionForm>
      </div>
    </div>
  );
}
