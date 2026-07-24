// Configuration centrale de la plateforme.
// Le nom, le slogan et l'identité visuelle sont centralisés ici et
// peuvent être surchargés par les paramètres administrables (SystemSetting).

export const APP_CONFIG = {
  name: "RECOFIABLE",
  slogan: "Des recommandations adaptées à votre besoin, fondées sur des expériences fiables.",
  logoEmoji: "🧭",
  supportEmail: "support@recofiable.demo",
  contactPhone: "+212 5 22 00 00 00 (fictif)",
  colors: {
    primary: "#0f766e", // vert profond, naturel
    accent: "#d97706", // ambre chaleureux
  },
  social: {
    facebook: "https://facebook.com/recofiable.demo",
    instagram: "https://instagram.com/recofiable.demo",
    whatsapp: "https://wa.me/2125220000000",
  },
  launchCountry: "MA",
  currency: "MAD",
  locales: ["fr", "ar"] as const,
  defaultLocale: "fr" as const,
  demoNotice:
    "Plateforme de démonstration : toutes les données (lieux, avis, comptes) sont fictives.",
} as const;

export type AppLocale = (typeof APP_CONFIG.locales)[number];

// Clés des paramètres administrables (table SystemSetting)
export const SETTING_KEYS = [
  "platform.name",
  "platform.slogan",
  "platform.logo",
  "platform.colors.primary",
  "platform.colors.accent",
  "platform.supportEmail",
  "platform.contactPhone",
  "platform.social.facebook",
  "platform.social.instagram",
  "platform.social.whatsapp",
  "platform.country",
  "platform.currency",
  "platform.locales",
  "legal.cgu.version",
  "legal.privacy.version",
  "moderation.rules",
  "fraud.burst.windowMinutes",
  "fraud.burst.threshold",
  "rating.bayesianWeight",
] as const;
