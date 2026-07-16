import { render, screen } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import Home from "../app/page";

test("renderiza a home e o engine é importável no client", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1, name: "SDD Terminal" })).toBeInTheDocument();
  const state = ProjectStateSchema.parse({});
  expect(state.meta.useGit).toBe(true);
});
