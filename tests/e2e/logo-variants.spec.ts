import { expect, test } from "@playwright/test";

test("the logo variants are in sets, searchable, and a set holding the selection stays open", async ({ page }) => {
  await page.goto("/logo");
  await page.getByRole("tab", { name: "Variants" }).click();
  const group = page.getByRole("group", { name: "Logo variants" });
  await expect(group).toBeVisible();

  // Two sets are open at first: a handful of cards, not all eleven.
  expect(await group.locator("li").count()).toBeLessThanOrEqual(8);
  await expect(group.getByRole("button", { name: /^Marks and avatars/ })).toHaveAttribute("aria-expanded", "false");

  // Open a folded set and pick from it: the set then stays open.
  await group.getByRole("button", { name: /^Marks and avatars/ }).click();
  await group.getByRole("button", { name: /Monogram/ }).click();
  await expect(group.getByRole("button", { name: /Monogram/ })).toHaveAttribute("aria-pressed", "true");
  await group.getByRole("button", { name: /^Marks and avatars/ }).click();
  await expect(group.getByRole("button", { name: /^Marks and avatars/ })).toHaveAttribute("aria-expanded", "true");

  // A search opens the sets that match, whatever was folded.
  await group.getByRole("searchbox", { name: "Find a variant" }).fill("inverted");
  await expect(group.getByRole("button", { name: /Inverted/ })).toBeVisible();
  await expect(group.locator("li")).toHaveCount(1);
  await group.getByRole("searchbox", { name: "Find a variant" }).fill("zzzz");
  await expect(page.getByText("No variant matches that search.")).toBeVisible();
});

test("the variants view and the export panel speak the chosen language, and search finds both names", async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.setItem("designhub:locale", "es"));
  await page.goto("/logo");
  await page.getByRole("tab", { name: "Variantes" }).click();
  const group = page.getByRole("group", { name: "Variantes del logotipo" });
  await expect(group).toBeVisible();
  await expect(group.getByRole("button", { name: /^Colores/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Paquete de logotipo (.zip)" })).toBeVisible();

  // The Spanish name and the English one both find the same variant.
  const search = group.getByRole("searchbox", { name: "Buscar una variante" });
  await search.fill("monocromo");
  await expect(group.locator("li")).toHaveCount(1);
  await search.fill("monochrome");
  await expect(group.locator("li")).toHaveCount(1);
  await search.fill("zzzz");
  await expect(page.getByText("Ninguna variante coincide con la búsqueda.")).toBeVisible();
});

test("the guides, edit and print check panels speak the chosen language", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("designhub:locale", "fr"));
  await page.goto("/logo");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.getByRole("radio", { name: "Avancé" }).click();

  await expect(page.getByRole("region", { name: "Repères" })).toBeVisible();
  await expect(page.getByText("Grille de construction")).toBeVisible();
  await expect(page.getByRole("region", { name: "Modifier" })).toBeVisible();
  await expect(page.getByLabel("Code SVG")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Variantes" })).toBeVisible();

  // The print check's verdict is built from its numbers, in French.
  await page.getByRole("tab", { name: "Variantes" }).click();
  const check = page.getByRole("region", { name: "Contrôle d'impression une couleur" });
  await expect(check).toBeVisible();
  const verdict = check.getByRole("status").filter({ hasText: "Marque monochrome" });
  await expect(verdict).toContainText(/Conforme|Alerte/, { timeout: 20_000 });
  await expect(verdict).toContainText(/Tous les traits et vides|trait le plus fin|vide le plus fin/);
});
