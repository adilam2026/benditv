import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Les espaces privés ne sont pas indexés
      disallow: ["/compte", "/pro", "/admin", "/api", "/connexion", "/inscription"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
