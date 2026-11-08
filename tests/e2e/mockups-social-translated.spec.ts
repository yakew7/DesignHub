import { expect, test } from "@playwright/test";

import { saved } from "./storage";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("designhub:locale", "es"));
});

test("the Mockup Studio speaks the chosen language, and search finds a template by both names", async ({ page }) => {
  await page.goto("/mockups");
  const picker = page.getByRole("group", { name: "Plantilla de maqueta" });
  await expect(picker).toBeVisible();
  for (const name of ["Impresión", "Objetos", "Dispositivos", "Pantallas"]) {
    await expect(picker.getByRole("button", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(page.getByLabel("Titular")).toBeVisible();
  await expect(page.getByLabel("Tema de la maqueta")).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Buscar una maqueta" });
  await search.fill("tarjeta de visita");
  await expect(picker.getByRole("radio")).toHaveCount(1);
  // The English name finds the same template.
  await search.fill("business card");
  await expect(picker.getByRole("radio")).toHaveCount(1);
  await picker.getByRole("radio", { name: "Tarjeta de visita" }).click();
  // The saved id stays the stable one, whatever the language.
  await saved(page, "designhub:mockups", '"template":"business-card"');

  await search.fill("zzzz");
  await expect(page.getByText("Ninguna maqueta coincide con la búsqueda.")).toBeVisible();
});

test("the Social Studio speaks the chosen language, and search finds a template by both names", async ({ page }) => {
  await page.goto("/social");
  const search = page.getByRole("searchbox", { name: "Buscar una plantilla" });
  await expect(search).toBeVisible();
  await expect(page.getByLabel("Nombre del proyecto")).toBeVisible();
  await expect(page.getByRole("button", { name: /Más plataformas/ })).toBeVisible();

  // A grouped style shows its translated group and style.
  await search.fill("Repository banner");
  await expect(page.getByRole("button", { name: /Banner del repositorio/ })).toBeVisible();

  await search.fill("Historia");
  const story = page.getByRole("radio", { name: /Historia/ }).first();
  await expect(story).toBeVisible();
  // The English name finds it too.
  await search.fill("Story");
  await expect(story).toBeVisible();
  await story.click();
  await saved(page, "designhub:social", '"template":"instagram-story"');

  await search.fill("zzzz");
  await expect(page.getByText("Ninguna plantilla coincide con la búsqueda.")).toBeVisible();
});
