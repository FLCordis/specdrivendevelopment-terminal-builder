import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectList } from "../components/ProjectList";
import type { Project } from "../lib/db";

const projects: Project[] = [
  { id: "1", name: "Loja", state: {} as any, createdAt: 0, updatedAt: 2 },
  { id: "2", name: "CLI", state: {} as any, createdAt: 0, updatedAt: 1 },
];

describe("ProjectList", () => {
  it("lista projetos e dispara onOpen", () => {
    const onOpen = vi.fn();
    render(<ProjectList projects={projects} onOpen={onOpen} onDelete={vi.fn()} onNew={vi.fn()} />);
    fireEvent.click(screen.getByText("Loja"));
    expect(onOpen).toHaveBeenCalledWith("1");
  });

  it("dispara onNew", () => {
    const onNew = vi.fn();
    render(<ProjectList projects={[]} onOpen={vi.fn()} onDelete={vi.fn()} onNew={onNew} />);
    fireEvent.click(screen.getByRole("button", { name: "Novo projeto" }));
    expect(onNew).toHaveBeenCalledOnce();
  });
});
