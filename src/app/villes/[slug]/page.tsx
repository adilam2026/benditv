import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { searchPlaces } from "@/server/services/search";
import { getCurrentUser } from "@/server/auth/session";
import { PlaceCard } from "@/components/place-card";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = await prisma.city.findUnique({ where: { slug } });
  if (!city) return { title: "Ville introuvable" };
  return {
    title: `${city.name} — recommandations locales fiables`,
    description: `Restaurants, services, santé, famille : les bonnes adresses de ${city.name} évaluées sur des faits.`,
    alternates: { canonical: `/villes/${slug}` },
  };
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ zone?: string }>;
}) {
  const { slug } = await params;
  const { zone } = await searchParams;
  const user = await getCurrentUser();
  const city = await prisma.city.findUnique({
    where: { slug },
    include: { zones: { orderBy: { name: "asc" } } },
  });
  if (!city || !city.active) notFound();

  const { results } = await searchPlaces("", { citySlug: slug, zoneSlug: zone || undefined, sort: "note" }, user?.id ?? null, 24);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-extrabold">Bonnes adresses à {city.name}</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`/villes/${slug}`} className={`chip ${!zone ? "border-brand-600 bg-brand-50 text-brand-800" : "hover:border-brand-600"}`}>
          Toute la ville
        </Link>
        {city.zones.map((z) => (
          <Link
            key={z.id}
            href={`/villes/${slug}?zone=${z.slug}`}
            className={`chip ${zone === z.slug ? "border-brand-600 bg-brand-50 text-brand-800" : "hover:border-brand-600"}`}
          >
            {z.name}
          </Link>
        ))}
      </div>
      <div className="space-y-4">
        {results.map((item) => <PlaceCard key={item.id} item={item} showCompatibility={false} />)}
        {results.length === 0 && (
          <div className="card p-8 text-center text-sm text-stone-500">Aucun lieu répertorié dans cette zone pour le moment.</div>
        )}
      </div>
    </div>
  );
}
