import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TermStream from "../components/TermStream";

// jsdom não implementa matchMedia; o efeito de streaming depende dele.
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: true, // movimento reduzido → revela tudo de imediato
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })),
  );
});

describe("TermStream", () => {
  it("mantém o texto completo no DOM (ghost) — sem layout shift", () => {
    render(<TermStream />);
    // ghost sempre pinta o output inteiro para reservar a altura final
    expect(
      screen.getAllByText(/comece a primeira feature/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("com movimento reduzido, revela o output inteiro (ghost + live)", async () => {
    render(<TermStream />);
    await waitFor(() =>
      expect(
        screen.getAllByText(/comece a primeira feature/).length,
      ).toBe(2),
    );
  });
});
