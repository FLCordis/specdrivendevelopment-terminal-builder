import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { ProjectForm } from "../components/ProjectForm";

const state = ProjectStateSchema.parse({ meta: { name: "Loja" } });

describe("ProjectForm", () => {
  it("na seção inicio mostra arquétipo e nome", () => {
    render(
      <ProjectForm sectionId="inicio" state={state} onUpdate={vi.fn()} onReplaceState={vi.fn()} />,
    );
    expect(screen.getByLabelText("Arquétipo do projeto")).toBeInTheDocument();
    expect((screen.getByLabelText("Nome do projeto") as HTMLInputElement).value).toBe("Loja");
  });

  it("escolher arquétipo aplica os defaults via onReplaceState", () => {
    const onReplaceState = vi.fn();
    render(
      <ProjectForm
        sectionId="inicio" state={state} onUpdate={vi.fn()} onReplaceState={onReplaceState}
      />,
    );
    fireEvent.change(screen.getByLabelText("Arquétipo do projeto"), {
      target: { value: "api-rest" },
    });
    expect(onReplaceState).toHaveBeenCalledTimes(1);
    const next = onReplaceState.mock.calls[0][0];
    expect(next.domain.archetype).toBe("api-rest");
    expect(next.arch.style).toBe("hexagonal");
  });

  it("na seção produto converte casos de uso em array", () => {
    const onUpdate = vi.fn();
    render(
      <ProjectForm sectionId="produto" state={state} onUpdate={onUpdate} onReplaceState={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Casos de uso (um por linha)"), {
      target: { value: "comprar\nlistar" },
    });
    expect(onUpdate).toHaveBeenCalledWith("domain.useCases", ["comprar", "listar"]);
  });

  it("esconde campos ocultos pelo arquétipo", () => {
    const lib = ProjectStateSchema.parse({ domain: { archetype: "biblioteca" } });
    render(
      <ProjectForm sectionId="seguranca" state={lib} onUpdate={vi.fn()} onReplaceState={vi.fn()} />,
    );
    expect(screen.queryByLabelText("Threat model")).not.toBeInTheDocument();
  });

  it("na seção features renderiza o editor de features", () => {
    render(
      <ProjectForm sectionId="features" state={state} onUpdate={vi.fn()} onReplaceState={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Adicionar feature" })).toBeInTheDocument();
  });
});
