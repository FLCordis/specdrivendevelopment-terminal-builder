import { NextResponse } from "next/server";
import { createAnthropicProvider } from "@/lib/assist/anthropic";
import type { AssistInput } from "@/lib/assist/provider";

export async function POST(req: Request): Promise<Response> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "assist desligado" }, { status: 501 });
  }

  let body: Partial<AssistInput>;
  try {
    body = (await req.json()) as Partial<AssistInput>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.field || typeof body.field !== "string") {
    return NextResponse.json({ error: "campo 'field' obrigatório" }, { status: 400 });
  }

  try {
    const provider = createAnthropicProvider(key);
    const result = await provider.suggest({
      field: body.field,
      context: body.context ?? {},
      instruction: body.instruction,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "assist indisponível" }, { status: 502 });
  }
}
