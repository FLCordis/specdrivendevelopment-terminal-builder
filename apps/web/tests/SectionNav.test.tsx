import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SECTIONS } from "../lib/sections";
import { SectionNav } from "../components/SectionNav";

describe("SectionNav", () => {
  it("lista as seções e navega ao clicar", () => {
    const onSelect = vi.fn();
    render(
      <SectionNav sections={SECTIONS} activeId="inicio" pending={{}} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Arquitetura/ }));
    expect(onSelect).toHaveBeenCalledWith("arquitetura");
  });

  it("mostra o badge de pendências", () => {
    render(
      <SectionNav
        sections={SECTIONS}
        activeId="inicio"
        pending={{ produto: 2 }}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Produto, 2 pendências" })).toBeInTheDocument();
  });
});
