import "fake-indexeddb/auto";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import Home from "../app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

test("renderiza a home e o engine é importável no client", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Novo projeto/ })).toBeInTheDocument();
  const state = ProjectStateSchema.parse({});
  expect(state.meta.useGit).toBe(true);
});
