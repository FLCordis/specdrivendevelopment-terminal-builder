import { test, expect } from "@playwright/test";

test("arquétipo → seções → features → preview ao vivo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Novo projeto" }).click();
  await expect(page).toHaveURL(/\/project\//);

  // Início: escolher arquétipo e nomear
  await page.getByLabel("Arquétipo do projeto").selectOption("api-rest");
  await page.getByLabel("Nome do projeto").fill("Loja E2E");

  // o preview aparece sozinho (ao vivo), sem clicar em "Gerar"
  await expect(page.getByRole("button", { name: "CLAUDE.md" })).toBeVisible();

  // navegação livre: pular direto para Features
  await page.getByRole("button", { name: /Features/ }).click();
  await page.getByRole("button", { name: "Adicionar feature" }).click();
  await page.getByLabel("Nome da feature 1").fill("Catálogo");
  await page.getByRole("button", { name: "Adicionar feature" }).click();
  await page.getByLabel("Nome da feature 2").fill("Pedidos");
  await page.getByLabel("Feature 2 depende de Catálogo").check();

  // o roadmap gerado reflete a dependência
  await page.getByRole("button", { name: "roadmap.md" }).click();
  await expect(page.locator("pre")).toContainText("depends_on: Catálogo");

  // voltar para Arquitetura confirma que o arquétipo preencheu o estilo
  await page.getByRole("button", { name: /Arquitetura/ }).click();
  await expect(page.getByLabel("Estilo arquitetural")).toHaveValue("hexagonal");
});
