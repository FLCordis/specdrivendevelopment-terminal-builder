import { NextResponse } from "next/server";
import type { AssistInput } from "@/lib/assist/provider";
import type { AiConfig, ProviderId } from "@/lib/settings";
import { callProvider } from "@/lib/assist/call-provider";

interface AssistBody extends Partial<AssistInput> {
  provider?: ProviderId;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

/** Resolve a config efetiva: chave do cliente tem prioridade; se ausente,
 *  cai para a env var ANTHROPIC_API_KEY (compat com o comportamento antigo). */
function resolveConfig(body: AssistBody): AiConfig | null {
  if (body.apiKey && typeof body.apiKey === "string") {
    return {
      provider: body.provider ?? "anthropic",
      apiKey: body.apiKey,
      model: body.model ?? "",
      baseUrl: body.baseUrl,
    };
  }
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) {
    return { provider: "anthropic", apiKey: envKey, model: body.model ?? "" };
  }
  return null;
}

export async function POST(req: Request): Promise<Response> {
  let body: AssistBody;
  try {
    body = (await req.json()) as AssistBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const cfg = resolveConfig(body);
  if (!cfg) {
    return NextResponse.json(
      { error: "assist desligado — configure a IA em Configurações" },
      { status: 501 },
    );
  }

  if (!body.field || typeof body.field !== "string") {
    return NextResponse.json({ error: "campo 'field' obrigatório" }, { status: 400 });
  }

  try {
    const result = await callProvider(cfg, {
      field: body.field,
      context: body.context ?? {},
      instruction: body.instruction,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "assist indisponível" }, { status: 502 });
  }
}
