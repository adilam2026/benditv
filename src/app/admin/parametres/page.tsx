import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/session";
import { updateSettingAction } from "@/server/actions/admin";
import { ActionForm } from "@/components/forms";

export const metadata: Metadata = { title: "Paramètres" };

const GROUPS: [string, [string, string][]][] = [
  ["Identité de la plateforme", [
    ["platform.name", "Nom de la plateforme"],
    ["platform.slogan", "Slogan"],
    ["platform.supportEmail", "E-mail de support"],
    ["platform.colors.primary", "Couleur principale"],
    ["platform.colors.accent", "Couleur d'accent"],
  ]],
  ["Périmètre", [
    ["platform.country", "Pays de lancement"],
    ["platform.currency", "Devise"],
    ["platform.locales", "Langues (séparées par des virgules)"],
  ]],
  ["Notation et fraude", [
    ["rating.bayesianWeight", "Poids bayésien (expériences virtuelles)"],
    ["fraud.burst.windowMinutes", "Fenêtre de détection de vague (minutes)"],
    ["fraud.burst.threshold", "Seuil de volume de vague"],
  ]],
  ["Légal et modération", [
    ["legal.cgu.version", "Version des CGU"],
    ["legal.privacy.version", "Version de la politique de confidentialité"],
    ["moderation.rules", "Règles de modération (résumé public)"],
  ]],
];

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  const settings = await prisma.systemSetting.findMany();
  const values = new Map(settings.map((s) => [s.key, s.value]));
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-extrabold">Paramètres système</h1>
      <p className="mb-6 text-sm text-stone-500">
        Paramètres administrables stockés en base (table SystemSetting). Le fichier src/config/app.ts fournit les
        valeurs par défaut.
      </p>
      <div className="card p-6">
        <ActionForm action={updateSettingAction} submitLabel="Enregistrer les paramètres">
          {GROUPS.map(([group, keys]) => (
            <fieldset key={group} className="space-y-3">
              <legend className="mb-1 font-bold">{group}</legend>
              {keys.map(([key, label]) => (
                <div key={key}>
                  <label className="label" htmlFor={key}>{label}</label>
                  {key === "moderation.rules" ? (
                    <textarea id={key} name={`setting:${key}`} rows={3} defaultValue={values.get(key) ?? ""} className="input" />
                  ) : (
                    <input id={key} name={`setting:${key}`} defaultValue={values.get(key) ?? ""} className="input" />
                  )}
                </div>
              ))}
            </fieldset>
          ))}
        </ActionForm>
      </div>
    </div>
  );
}
