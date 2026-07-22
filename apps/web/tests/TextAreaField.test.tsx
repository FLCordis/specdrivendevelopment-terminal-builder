import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextAreaField } from "../components/ui/TextAreaField";

describe("TextAreaField", () => {
  it("emite o texto cru ao digitar", () => {
    const onChange = vi.fn();
    render(<TextAreaField label="Casos de uso" value="" onChange={onChange} />);
    const ta = screen.getByLabelText("Casos de uso");
    fireEvent.change(ta, { target: { value: "comprar\nlistar" } });
    expect(onChange).toHaveBeenCalledWith("comprar\nlistar");
  });

  it("re-sincroniza quando o value muda por fora", () => {
    const { rerender } = render(
      <TextAreaField label="Casos de uso" value="antigo" onChange={vi.fn()} />,
    );
    expect((screen.getByLabelText("Casos de uso") as HTMLTextAreaElement).value).toBe("antigo");
    rerender(<TextAreaField label="Casos de uso" value="novo do assist" onChange={vi.fn()} />);
    expect((screen.getByLabelText("Casos de uso") as HTMLTextAreaElement).value).toBe(
      "novo do assist",
    );
  });

  it("mostra a dica quando fornecida", () => {
    render(<TextAreaField label="Casos de uso" value="" onChange={vi.fn()} hint="ex.: comprar" />);
    expect(screen.getByText("ex.: comprar")).toBeInTheDocument();
  });
});
