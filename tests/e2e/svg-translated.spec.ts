import { expect, test } from "@playwright/test";

import { saved } from "./storage";

test("the SVG Playground speaks the chosen language across its panels and its error message", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("designhub:locale", "es"));
  await page.goto("/svg");
  const tools = page.getByRole("tablist", { name: "Herramientas SVG" });
  await expect(tools).toBeVisible();

  // Document panel and viewBox panel.
  await expect(tools.getByRole("tab", { name: "Documento" })).toBeVisible();
  await expect(page.getByLabel("Código fuente", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Subir" })).toBeVisible();
  await expect(page.getByLabel("Ancho intrínseco")).toBeVisible();

  // Layers, Optimize and Sprite panels (Layers and Sprite are Advanced tools).
  await page.getByRole("radio", { name: "Avanzado" }).click();
  await tools.getByRole("tab", { name: "Capas" }).click();
  await expect(page.getByRole("listbox", { name: "Elementos" })).toBeVisible();
  await expect(page.getByText("Selecciona un elemento para inspeccionarlo y editarlo.")).toBeVisible();

  await tools.getByRole("tab", { name: "Optimizar" }).click();
  await expect(page.getByRole("switch", { name: "Redondear números" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Descargar SVG optimizado" })).toBeVisible();
  await expect(page.getByText("2 decimales")).toBeVisible();

  await tools.getByRole("tab", { name: "Sprite" }).click();
  await page.getByRole("button", { name: "Añadir actual" }).click();
  await expect(page.getByRole("list", { name: "Símbolos del sprite" })).toBeVisible();

  // An error message is translated, and is still there after a reload.
  await tools.getByRole("tab", { name: "Documento" }).click();
  await page.getByLabel("Código fuente", { exact: true }).fill("<div></div>");
  await expect(page.getByRole("alert").filter({ hasText: "Esto no parece un marcado SVG válido." })).toBeVisible();
  await saved(page, "designhub:svg", "<div></div>");
  await page.reload();
  await expect(page.getByRole("alert").filter({ hasText: "Esto no parece un marcado SVG válido." })).toBeVisible();
});
