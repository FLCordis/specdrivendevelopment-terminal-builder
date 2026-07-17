import { test, expect } from "@playwright/test";

test("criar projeto → preencher → gerar → preview", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Novo projeto" }).click();
  await expect(page).toHaveURL(/\/project\//);

  await page.getByLabel("Nome do projeto").fill("Loja E2E");
  await page.getByLabel("Tipo de projeto").fill("API REST");
  await page.getByRole("button", { name: "Gerar" }).click();

  await expect(page.getByRole("button", { name: "CLAUDE.md" })).toBeVisible();
});
