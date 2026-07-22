import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolkitPicker } from "../components/ToolkitPicker";

describe("ToolkitPicker", () => {
  it("lista as peças do arquétipo (marcadas por padrão)", () => {
    render(<ToolkitPicker archetype="api-rest" disabled={[]} onChange={vi.fn()} />);
    const cb = screen.getByLabelText(/REST endpoint TDD/) as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it("desmarcar uma peça chama onChange com o id", () => {
    const onChange = vi.fn();
    render(<ToolkitPicker archetype="api-rest" disabled={[]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/REST endpoint TDD/));
    expect(onChange).toHaveBeenCalledWith(["rest-endpoint-tdd"]);
  });

  it("arquétipo sem kit mostra empty-state", () => {
    render(<ToolkitPicker archetype="generic" disabled={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/Nenhum kit curado/)).toBeInTheDocument();
  });
});
