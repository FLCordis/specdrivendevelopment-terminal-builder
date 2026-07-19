import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectStateSchema } from "@sdd/engine";
import { AssistButton } from "../components/AssistButton";

const ctx = ProjectStateSchema.parse({ meta: { name: "Loja" } });
afterEach(() => { vi.unstubAllGlobals(); });

describe("AssistButton", () => {
  it("mostra a sugestão e aceita", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ suggestion: "comprar produto" }), { status: 200 },
    )));
    const onAccept = vi.fn();
    render(<AssistButton field="domain.useCases" context={ctx} onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: "Sugerir domain.useCases" }));
    await waitFor(() => screen.getByText("comprar produto"));
    fireEvent.click(screen.getByRole("button", { name: "Aceitar" }));
    expect(onAccept).toHaveBeenCalledWith("comprar produto");
  });

  it("descarta sem chamar onAccept", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ suggestion: "algo" }), { status: 200 },
    )));
    const onAccept = vi.fn();
    render(<AssistButton field="meta.description" context={ctx} onAccept={onAccept} />);
    fireEvent.click(screen.getByRole("button", { name: "Sugerir meta.description" }));
    await waitFor(() => screen.getByText("algo"));
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
    expect(onAccept).not.toHaveBeenCalled();
    expect(screen.queryByText("algo")).not.toBeInTheDocument();
  });

  it("desabilita quando o assist responde 501", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 501 })));
    render(<AssistButton field="meta.description" context={ctx} onAccept={vi.fn()} />);
    const btn = screen.getByRole("button", { name: "Sugerir meta.description" });
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
  });
});
