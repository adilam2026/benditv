import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.name,
    short_name: APP_CONFIG.name,
    description: APP_CONFIG.slogan,
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: APP_CONFIG.colors.primary,
    lang: "fr",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Rechercher", url: "/recherche" },
      { name: "Partager une expérience", url: "/avis/nouveau" },
      { name: "Mes favoris", url: "/compte/favoris" },
    ],
  };
}
