import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RatingBadge, ConfidenceBadge } from "@/components/rating";
import { ShareButton } from "@/components/place-actions";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const list = await prisma.list.findFirst({ where: { OR: [{ shareToken: token }, { id: token }] } });
  return { title: list?.title ?? "Liste" };
}

export default async function PublicListPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const list = await prisma.list.findFirst({
    where: { OR: [{ shareToken: token }, { id: token }], visibility: { in: ["public", "link"] } },
    include: {
      owner: { include: { profile: true } },
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          place: {
            include: { category: true, zone: true, ratings: { where: { isCurrent: true } }, criterionScores: { include: { criterion: true }, take: 4, orderBy: { score: "desc" } } },
          },
        },
      },
    },
  });
  if (!list) notFound();
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/listes/${list.shareToken ?? list.id}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{list.title}</h1>
            {list.description && <p className="mt-1 text-sm text-stone-600">{list.description}</p>}
            <p className="mt-2 text-xs text-stone-400">
              {list.items.length} lieu{list.items.length > 1 ? "x" : ""} · par {list.owner.profile?.displayName ?? list.owner.name} · mise à jour le{" "}
              {list.updatedAt.toLocaleDateString("fr-FR")}
            </p>
          </div>
          <ShareButton title={list.title} url={url} />
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {list.items.map((item) => (
          <Link key={item.id} href={`/lieux/${item.place.slug}`} className="card block p-4 transition hover:border-brand-600">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{item.place.name}</h2>
                <p className="text-xs text-stone-500">{item.place.category.name} · {item.place.zone?.name ?? "Casablanca"}</p>
                {item.note && <p className="mt-1 text-sm italic text-stone-600">« {item.note} »</p>}
                {item.place.criterionScores.length > 0 && (
                  <p className="mt-1 text-xs text-stone-500">
                    Points forts : {item.place.criterionScores.slice(0, 3).map((c) => c.criterion.name.toLowerCase()).join(", ")}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <RatingBadge rating={item.place.ratings[0]?.rating ?? 0} />
                <ConfidenceBadge confidence={item.place.ratings[0]?.confidence ?? "faible"} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
