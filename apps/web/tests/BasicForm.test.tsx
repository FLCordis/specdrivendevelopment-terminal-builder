import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { BasicForm } from "../components/BasicForm";

const state = ProjectStateSchema.parse({ meta: { name: "Loja" } });

describe("BasicForm", () => {
  it("mostra os campos-chave e chama onUpdate ao editar o nome", () => {
    const onUpdate = vi.fn();
    render(<BasicForm state={state} onUpdate={onUpdate} />);
    const nome = screen.getByLabelText("Nome do projeto") as HTMLInputElement;
    expect(nome.value).toBe("Loja");
    fireEvent.change(nome, { target: { value: "Loja X" } });
    expect(onUpdate).toHaveBeenCalledWith("meta.name", "Loja X");
  });

  it("converte casos de uso (linhas) em array", () => {
    const onUpdate = vi.fn();
    render(<BasicForm state={state} onUpdate={onUpdate} />);
    const casos = screen.getByLabelText("Casos de uso (um por linha)");
    fireEvent.change(casos, { target: { value: "comprar\nlistar" } });
    expect(onUpdate).toHaveBeenCalledWith("domain.useCases", ["comprar", "listar"]);
  });
});
