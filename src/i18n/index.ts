// Architecture d'internationalisation.
// L'interface est livrée en français ; les dictionnaires arabe (et
// darija pour la recherche) sont prêts à être complétés. Le service de
// classification comprend déjà le français, l'arabe et la darija en
// caractères latins.

import { fr } from "./fr";
import { ar } from "./ar";
import type { AppLocale } from "@/config/app";

export type Dictionary = Record<keyof typeof fr, string>;

const dictionaries: Record<AppLocale, Partial<Dictionary>> = { fr, ar };

export function t(key: keyof Dictionary, locale: AppLocale = "fr"): string {
  return (dictionaries[locale][key] as string | undefined) ?? fr[key] ?? key;
}

export function isRtl(locale: AppLocale): boolean {
  return locale === "ar";
}
