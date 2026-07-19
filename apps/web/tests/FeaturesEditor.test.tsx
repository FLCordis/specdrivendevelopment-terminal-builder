import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Feature } from "@sdd/engine";
import { FeaturesEditor } from "../components/FeaturesEditor";

const features: Feature[] = [
  { name: "Catálogo", specSeed: "CRUD", dependsOn: [] },
  { name: "Pedidos", specSeed: "checkout", dependsOn: [] },
];

describe("FeaturesEditor", () => {
  it("adiciona uma feature vazia", () => {
    const onChange = vi.fn();
    render(<FeaturesEditor features={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar feature" }));
    expect(onChange).toHaveBeenCalledWith([{ name: "", specSeed: "", dependsOn: [] }]);
  });

  it("edita o nome da feature", () => {
    const onChange = vi.fn();
    render(<FeaturesEditor features={features} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Nome da feature 1"), {
      target: { value: "Catálogo v2" },
    });
    expect(onChange).toHaveBeenCalledWith([
      { ...features[0], name: "Catálogo v2" },
      features[1],
    ]);
  });

  it("remove uma feature", () => {
    const onChange = vi.fn();
    render(<FeaturesEditor features={features} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remover feature 1" }));
    expect(onChange).toHaveBeenCalledWith([features[1]]);
  });

  it("não oferece a própria feature como dependência", () => {
    render(<FeaturesEditor features={features} onChange={vi.fn()} />);
    expect(screen.queryByLabelText("Feature 1 depende de Catálogo")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Feature 1 depende de Pedidos")).toBeInTheDocument();
  });

  it("marca uma dependência", () => {
    const onChange = vi.fn();
    render(<FeaturesEditor features={features} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Feature 2 depende de Catálogo"));
    expect(onChange).toHaveBeenCalledWith([
      features[0],
      { ...features[1], dependsOn: ["Catálogo"] },
    ]);
  });
});
