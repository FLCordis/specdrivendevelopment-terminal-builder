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

    // preview ao vivo aparece sem clicar em "Gerar"
    await waitFor(() => expect(screen.getByRole("button", { name: "CLAUDE.md" })).toBeInTheDocument(),
      { timeout: 3000 });

    // navegar para Arquitetura
    fireEvent.click(screen.getByRole("button", { name: /Arquitetura/ }));
    expect(screen.getByLabelText("Stack")).toBeInTheDocument();
  });
});
