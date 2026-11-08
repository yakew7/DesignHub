import { expect, test } from "@playwright/test";

test("the Icon Studio panels speak the chosen language, and English names still search", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("designhub:locale", "es"));
  await page.goto("/icons");

  // The library: tabs, search, topics and sets.
  await expect(page.getByRole("tablist", { name: "Herramientas de iconos" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Biblioteca" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Buscar iconos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Todos los conjuntos" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Explorar por tema" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Flechas" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Iconos" })).toBeVisible();

  // The editor beside it.
  await expect(page.getByRole("button", { name: "Restablecer el estilo del icono" })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Relleno" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Forma del fondo" }).or(page.getByRole("radiogroup", { name: "Forma del fondo" })),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Descargar SVG" })).toBeVisible();

  // A topic is chosen by its Spanish name, and an English search term still works.
  await page.getByRole("radio", { name: "Flechas" }).click();
  await expect(page.getByRole("radio", { name: "Flechas" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("searchbox", { name: "Buscar iconos" }).fill("arrow");
  await expect(page.getByRole("button", { name: "Borrar búsqueda" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Buscar iconos" }).fill("");

  // Favicon and Export tabs.
  await page.getByRole("tab", { name: "Favicon" }).click();
  await expect(page.getByLabel("Nombre de la app")).toBeVisible();
  await expect(page.getByRole("button", { name: "Descargar paquete (.zip)" })).toBeVisible();
  await expect(page.getByText("Color del tema")).toBeVisible();

  await page.getByRole("tab", { name: "Exportar" }).click();
  await expect(page.getByText("Ráster")).toBeVisible();
  await expect(page.getByText("PNG con transparencia.", { exact: false })).toBeVisible();
});
