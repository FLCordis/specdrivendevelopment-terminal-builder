import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilePreview } from "../components/FilePreview";

const files = [
  { path: "CLAUDE.md", content: "# constituição" },
  { path: "README.md", content: "# leia-me" },
];

describe("FilePreview", () => {
  it("mostra o primeiro arquivo por default e troca ao clicar", () => {
    render(<FilePreview files={files} />);
    expect(screen.getByText("# constituição")).toBeInTheDocument();
    fireEvent.click(screen.getByText("README.md"));
    expect(screen.getByText("# leia-me")).toBeInTheDocument();
  });
});
