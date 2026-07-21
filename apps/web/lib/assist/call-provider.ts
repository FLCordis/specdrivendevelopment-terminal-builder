import type { AiConfig } from "../settings";
import type { AssistInput, AssistResult } from "./provider";
import { buildPrompt } from "./prompt";

const DEFAULT_MODEL: Record<string, string> = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-4o-mini",
  google: "gemini-2.0-flash",
  custom: "gpt-4o-mini",
};

const MAX_TOKENS = 400;

/** Chama o provedor de IA configurado e devolve a sugestão de texto.
 *  Lança em erro de rede/HTTP (o route mapeia para 502). */
export async function callProvider(
  cfg: AiConfig,
  input: AssistInput,
): Promise<AssistResult> {
  const prompt = buildPrompt(input);
  const model = cfg.model?.trim() || DEFAULT_MODEL[cfg.provider] || "";
  let text = "";

  if (cfg.provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const data = await res.json();
    text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
  } else if (cfg.provider === "google") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    if (!res.ok) throw new Error(`google ${res.status}`);
    const data = await res.json();
    text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } else {
    // openai + custom (endpoint compatível com OpenAI)
    const base =
      cfg.provider === "custom"
        ? (cfg.baseUrl ?? "").replace(/\/$/, "")
        : "https://api.openai.com/v1";
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`openai ${res.status}`);
    const data = await res.json();
    text = data.choices?.[0]?.message?.content ?? "";
  }

  return { suggestion: text.trim() };
}
