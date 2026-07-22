import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { db } from "../lib/db";
import { createProject } from "../lib/projects";
import { Editor } from "../app/project/[id]/Editor";

beforeEach(async () => { await db.projects.clear(); });

describe("Editor", () => {
  it("carrega, navega entre seções e gera o preview ao vivo", async () => {
    const p = await createProject("Loja");
    render(<Editor id={p.id} />);

    // seção inicial: Início
    await waitFor(() => screen.getByLabelText("Arquétipo do projeto"));

    // a prévia começa recolhida — abrir o drawer "Prévia"
    fireEvent.click(screen.getByRole("button", { name: "Prévia" }));

    // preview ao vivo aparece sem clicar em "Gerar"
    await waitFor(() => expect(screen.getByRole("button", { name: "CLAUDE.md" })).toBeInTheDocument(),
      { timeout: 3000 });

    // navegar para Arquitetura
    fireEvent.click(screen.getByRole("button", { name: /Arquitetura/ }));
    expect(screen.getByLabelText("Stack")).toBeInTheDocument();
  });

  it("mostra o medidor de prontidão e pula pra seção da pendência", async () => {
    const p = await createProject("Loja");
    render(<Editor id={p.id} />);
    await waitFor(() => screen.getByLabelText("Arquétipo do projeto"));

    // barra de prontidão presente
    expect(screen.getByRole("progressbar", { name: "Prontidão do handoff" })).toBeInTheDocument();

    // as pendências chegam após a validação ao vivo (assíncrona)
    const chip = await screen.findByRole("button", { name: "stack" }, { timeout: 3000 });

    // clicar no chip de pendência (stack) leva à seção Arquitetura
    fireEvent.click(chip);
    expect(screen.getByLabelText("Stack")).toBeInTheDocument();
  });
});
