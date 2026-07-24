import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/server/services/search";
import { getCurrentUser } from "@/server/auth/session";
import { rateLimit } from "@/lib/rate-limit";

// API de recherche (utilisée aussi pour d'éventuels clients mobiles).
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`api-search:${ip}`, 60, 60_000).ok) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const user = await getCurrentUser();
  const { parsed, results } = await searchPlaces(
    q,
    {
      categorySlug: params.get("categorie"),
      zoneSlug: params.get("zone"),
      budgetMax: params.get("budget") ? parseInt(params.get("budget")!, 10) : null,
      sort: (params.get("tri") as "pertinence" | "note" | "recents" | "prix") ?? "pertinence",
    },
    user?.id ?? null,
    20
  );
  return NextResponse.json({ query: q, parsed, results });
}
