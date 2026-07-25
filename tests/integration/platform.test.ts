import "./setup";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { searchPlaces } from "@/server/services/search";
import { recomputePlaceRating } from "@/server/services/recompute";

const prisma = new PrismaClient();

beforeAll(async () => {
  const count = await prisma.place.count();
  if (count === 0) throw new Error("Base vide : lancez `npm run db:seed` avant les tests d'intégration.");
});

afterAll(() => prisma.$disconnect());

describe("comptes de démonstration (inscription/connexion)", () => {
  it("les cinq comptes existent avec les bons rôles et mots de passe", async () => {
    const expected: [string, string, string][] = [
      ["admin@recofiable.demo", "Admin123!", "ADMIN"],
      ["moderateur@recofiable.demo", "Moderateur123!", "MODERATOR"],
      ["utilisateur@recofiable.demo", "Utilisateur123!", "USER"],
      ["pro-gratuit@recofiable.demo", "Professionnel123!", "PROFESSIONAL"],
      ["pro-premium@recofiable.demo", "Professionnel123!", "PROFESSIONAL"],
    ];
    for (const [email, password, role] of expected) {
      const user = await prisma.user.findUnique({ where: { email } });
      expect(user, email).toBeTruthy();
      expect(user!.role).toBe(role);
      expect(bcrypt.compareSync(password, user!.passwordHash)).toBe(true);
    }
  });
});

describe("recherche", () => {
  it("comprend une phrase naturelle et filtre par zone et catégorie", async () => {
    const { parsed, results } = await searchPlaces(
      "restaurant calme à Dar Bouazza avec parking moins de 150 dh", {}, null
    );
    expect(parsed.categorySlug).toBe("restaurant");
    expect(parsed.zoneSlug).toBe("dar-bouazza");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.zoneName).toBe("Dar Bouazza");
    }
    // Le budget élimine les lieux trop chers du haut du classement
    expect(results[0].avgPricePerPerson ?? 0).toBeLessThanOrEqual(150);
  });

  it("trouve les sardines grillées via la spécialité", async () => {
    const { results } = await searchPlaces("où manger de bonnes sardines grillées", {}, null);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name.includes("Sardina"))).toBe(true);
  });

  it("la note publique est identique avec ou sans utilisateur connecté", async () => {
    const anonymous = await searchPlaces("restaurant à dar bouazza", {}, null);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "utilisateur@recofiable.demo" } });
    const personalized = await searchPlaces("restaurant à dar bouazza", {}, user.id);
    for (const item of anonymous.results) {
      const match = personalized.results.find((r) => r.id === item.id);
      if (match) expect(match.rating).toBe(item.rating);
    }
  });

  it("signale la vague suspecte sur la fiche concernée", async () => {
    const { results } = await searchPlaces("promoteur immobilier", {}, null);
    const wavePlace = results.find((r) => r.hasWave);
    expect(wavePlace).toBeTruthy();
  });
});

describe("moteur de notation (intégration)", () => {
  it("exclut les contributions neutralisées du calcul", async () => {
    const wave = await prisma.fraudWave.findFirstOrThrow({ include: { place: true } });
    await recomputePlaceRating(wave.placeId);
    const snapshot = await prisma.ratingSnapshot.findFirstOrThrow({
      where: { placeId: wave.placeId, isCurrent: true },
    });
    expect(snapshot.excludedCount).toBeGreaterThan(0);
    // La vague de 10/10 neutralisée ne doit pas gonfler la note
    expect(snapshot.rating).toBeLessThan(8);
  });

  it("chaque lieu actif possède une note publique courante", async () => {
    const orphans = await prisma.place.count({
      where: { status: "ACTIVE", ratings: { none: { isCurrent: true } } },
    });
    expect(orphans).toBe(0);
  });
});

describe("favoris et listes (intégration)", () => {
  it("ajoute puis retire un favori", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "utilisateur@recofiable.demo" } });
    const place = await prisma.place.findFirstOrThrow({ where: { favorites: { none: { userId: user.id } } } });
    const favorite = await prisma.favorite.create({ data: { userId: user.id, placeId: place.id } });
    expect(favorite.id).toBeTruthy();
    await prisma.favorite.delete({ where: { id: favorite.id } });
  });

  it("crée une liste avec des éléments puis la supprime", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "utilisateur@recofiable.demo" } });
    const places = await prisma.place.findMany({ take: 2 });
    const list = await prisma.list.create({
      data: {
        ownerId: user.id,
        title: "Liste de test d'intégration",
        items: { create: places.map((p, i) => ({ placeId: p.id, sortOrder: i })) },
      },
      include: { items: true },
    });
    expect(list.items).toHaveLength(2);
    await prisma.list.delete({ where: { id: list.id } });
  });
});

describe("abonnements fictifs", () => {
  it("le professionnel premium a un abonnement Performance actif avec factures de démo", async () => {
    const org = await prisma.professionalOrganization.findFirstOrThrow({
      where: { members: { some: { user: { email: "pro-premium@recofiable.demo" } } } },
      include: { subscriptions: { where: { status: "ACTIVE" }, include: { plan: true, invoices: true } } },
    });
    const sub = org.subscriptions[0];
    expect(sub.plan.slug).toBe("performance");
    expect(sub.invoices.length).toBeGreaterThan(0);
    expect(sub.invoices.every((i) => i.isDemo)).toBe(true);
  });
});

describe("modération et revendications", () => {
  it("des signalements ouverts et un avis en modération existent", async () => {
    expect(await prisma.moderationReport.count({ where: { status: "OPEN" } })).toBeGreaterThan(0);
    expect(await prisma.review.count({ where: { status: "PENDING_MODERATION" } })).toBeGreaterThan(0);
  });
  it("une revendication en attente existe", async () => {
    expect(await prisma.placeClaim.count({ where: { status: "PENDING" } })).toBeGreaterThan(0);
  });
});
