import { test, expect } from "@playwright/test";

test.describe("Parcours visiteur", () => {
  test("la page d'accueil affiche la recherche et l'avertissement démo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Que cherchez-vous aujourd'hui ?")).toBeVisible();
    await expect(page.getByText("données (lieux, avis, comptes) sont fictives").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Explorer par univers/ })).toBeVisible();
  });

  test("la recherche en langage naturel extrait les filtres et affiche des résultats", async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Que cherchez-vous aujourd'hui ?").fill(
      "restaurant calme à Dar Bouazza avec parking moins de 150 dh"
    );
    await page.getByRole("button", { name: "Rechercher" }).first().click();
    await expect(page).toHaveURL(/\/recherche/);
    await expect(page.getByText("Filtres détectés :")).toBeVisible();
    await expect(page.getByText("Catégorie : Restaurant")).toBeVisible();
    await expect(page.getByText("Zone : Dar Bouazza")).toBeVisible();
    await expect(page.getByText(/% compatible/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /La Table du Phare/ }).first()).toBeVisible();
  });

  test("une fiche lieu affiche note publique, confiance et expériences", async ({ page }) => {
    await page.goto("/lieux/la-table-du-phare");
    await expect(page.getByRole("heading", { name: /La Table du Phare/ })).toBeVisible();
    await expect(page.getByText(/Confiance/).first()).toBeVisible();
    await expect(page.getByText("Notes par critère")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Expériences \(/ })).toBeVisible();
  });

  test("la fiche du promoteur signale la vague d'avis suspecte", async ({ page }) => {
    await page.goto("/lieux/promoteur-al-boughaz-fictif");
    await expect(page.getByText("Une activité inhabituelle a été détectée").first()).toBeVisible();
  });
});

test.describe("Parcours utilisateur connecté", () => {
  test("connexion avec le compte démo puis tableau de bord", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill("utilisateur@recofiable.demo");
    await page.getByLabel("Mot de passe").fill("Utilisateur123!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/compte/);
    await expect(page.getByRole("heading", { name: /Bonjour, Salma/ })).toBeVisible();
    await expect(page.getByText("Activité de votre réseau")).toBeVisible();
  });

  test("publication d'un avis express de bout en bout", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill("utilisateur@recofiable.demo");
    await page.getByLabel("Mot de passe").fill("Utilisateur123!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/compte/);

    await page.goto("/avis/nouveau?lieu=cafe-litoral".replace("litoral", "littoral"));
    await expect(page.getByText("Étapes")).toBeDefined();
    // Étape 1 : contexte
    await page.getByRole("button", { name: "Seul(e)" }).click();
    await page.getByRole("button", { name: "Continuer →" }).click();
    // Étape 2 : critères (les curseurs ont une valeur par défaut à noter)
    const raters = page.getByRole("button", { name: "Noter" });
    const count = await raters.count();
    for (let i = 0; i < count; i++) await raters.nth(0).click();
    await page.getByRole("button", { name: "Continuer →" }).click();
    // Étape 3 : commentaire
    await page.getByLabel("Votre commentaire").fill(
      "Café agréable pour travailler : Wi-Fi stable, service attentionné et terrasse calme en semaine."
    );
    await page.getByRole("button", { name: "Continuer →" }).click();
    // Étape 4 : preuve (aucune)
    await page.getByRole("button", { name: "Continuer →" }).click();
    // Étape 5 : consentement + publication
    await page.getByRole("checkbox", { name: /expérience est personnelle/ }).check();
    await page.getByRole("button", { name: "Publier mon expérience" }).click();
    await expect(page).toHaveURL(/\/lieux\/cafe-littoral/, { timeout: 20_000 });
  });

  test("l'espace admin est interdit à un utilisateur simple", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill("utilisateur@recofiable.demo");
    await page.getByLabel("Mot de passe").fill("Utilisateur123!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/compte/);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin/);
  });
});

test.describe("Parcours professionnel et admin", () => {
  test("le professionnel voit son tableau de bord et ses établissements", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill("pro-premium@recofiable.demo");
    await page.getByLabel("Mot de passe").fill("Professionnel123!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/pro/);
    await expect(page.getByRole("heading", { name: /Groupe Océan Bleu/ })).toBeVisible();
    await expect(page.getByText("Abonnement : Performance")).toBeVisible();
  });

  test("l'administrateur accède au back-office et aux vagues suspectes", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByLabel("Adresse e-mail").fill("admin@recofiable.demo");
    await page.getByLabel("Mot de passe").fill("Admin123!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
    await page.goto("/admin/fraude");
    await expect(page.getByRole("heading", { name: "Vagues et anomalies" })).toBeVisible();
    await expect(page.getByText(/Promoteur Al Boughaz/).first()).toBeVisible();
  });
});
