import { test, expect } from "@playwright/test";

test("arquétipo → seções → features → preview ao vivo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Novo projeto" }).click();
  await expect(page).toHaveURL(/\/project\//);

  // Início: escolher arquétipo e nomear
  await page.getByLabel("Arquétipo do projeto").selectOption("api-rest");
  await page.getByLabel("Nome do projeto").fill("Loja E2E");

  // a prévia começa recolhida; abrir o drawer mostra o preview ao vivo (sem "Gerar")
  await page.getByRole("button", { name: "Prévia", exact: true }).click();
  await expect(page.getByRole("button", { name: "CLAUDE.md" })).toBeVisible();
  await page.getByRole("button", { name: "fechar ✕" }).click();

  // navegação livre: pular direto para Features
  await page.getByRole("button", { name: /Features/ }).click();
  await page.getByRole("button", { name: "Adicionar feature" }).click();
  await page.getByLabel("Nome da feature 1").fill("Catálogo");
  await page.getByRole("button", { name: "Adicionar feature" }).click();
  await page.getByLabel("Nome da feature 2").fill("Pedidos");
  await page.getByLabel("Feature 2 depende de Catálogo").check();

  // o roadmap gerado reflete a dependência (na prévia)
  await page.getByRole("button", { name: "Prévia", exact: true }).click();
  await page.getByRole("button", { name: "roadmap.md" }).click();
  await expect(page.locator("pre")).toContainText("depends_on: Catálogo");
  await page.getByRole("button", { name: "fechar ✕" }).click();

  // voltar para Arquitetura confirma que o arquétipo preencheu o estilo
  await page.getByRole("button", { name: /Arquitetura/ }).click();
  await expect(page.getByLabel("Estilo arquitetural")).toHaveValue("hexagonal");

  // a tela de handoff resume o projeto e traz o próximo passo
  await page.getByRole("button", { name: /Revisar & Baixar/ }).click();
  await expect(page.getByText("próximo passo")).toBeVisible();
  await expect(page.getByText('"comece a primeira feature"')).toBeVisible();
});
