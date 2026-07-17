import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { db } from "../lib/db";
import { createProject } from "../lib/projects";
import { Editor } from "../app/project/[id]/Editor";

beforeEach(async () => { await db.projects.clear(); });

describe("Editor", () => {
  it("carrega, edita e gera o preview", async () => {
    const p = await createProject("Loja");
    render(<Editor id={p.id} />);
    await waitFor(() => screen.getByLabelText("Nome do projeto"));

    fireEvent.change(screen.getByLabelText("Tipo de projeto"), { target: { value: "API" } });
    fireEvent.click(screen.getByRole("button", { name: "Gerar" }));

    // o preview deve mostrar o caminho da constituição gerada
    await waitFor(() => expect(screen.getByText("CLAUDE.md")).toBeInTheDocument());
  });
});
