import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { buildTree } from "../lib/file-tree";
import { FileTree } from "../components/FileTree";

const nodes = buildTree([
  { path: "CLAUDE.md", content: "a" },
  { path: "docs/roadmap.md", content: "b" },
]);

describe("FileTree", () => {
  it("mostra pastas e arquivos e seleciona um arquivo", () => {
    const onSelect = vi.fn();
    render(<FileTree nodes={nodes} selectedPath="CLAUDE.md" onSelect={onSelect} />);
    expect(screen.getByText("docs")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "roadmap.md" }));
    expect(onSelect).toHaveBeenCalledWith("docs/roadmap.md");
  });
});
