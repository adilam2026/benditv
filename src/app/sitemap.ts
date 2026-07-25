import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [places, categories, cities] = await Promise.all([
    prisma.place.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { active: true }, select: { slug: true } }),
    prisma.city.findMany({ where: { active: true }, select: { slug: true } }),
  ]);
  const staticPages = [
    "", "/recherche", "/categories", "/questions", "/missions", "/listes", "/contributeurs",
    "/comparer", "/fonctionnement", "/confiance", "/anti-fraude", "/professionnels", "/tarifs",
    "/contact", "/faq", "/cgu", "/confidentialite", "/politique-moderation", "/cookies", "/carte",
  ];
  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const })),
    ...places.map((p) => ({ url: `${base}/lieux/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "daily" as const })),
    ...categories.map((c) => ({ url: `${base}/categories/${c.slug}`, changeFrequency: "weekly" as const })),
    ...cities.map((c) => ({ url: `${base}/villes/${c.slug}`, changeFrequency: "weekly" as const })),
  ];
}
