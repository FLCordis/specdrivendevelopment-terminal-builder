import { db } from "./db";

export type ProviderId = "anthropic" | "openai" | "google" | "custom";

export interface AiConfig {
  provider: ProviderId;
  model: string;
  apiKey: string;
  /** só para provider "custom" (endpoint compatível com OpenAI) */
  baseUrl?: string;
}

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** modelos sugeridos (o usuário pode digitar outro) */
  models: string[];
  keyHint: string;
  needsBaseUrl?: boolean;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "anthropic",
    label: "Anthropic — Claude",
    models: ["claude-haiku-4-5-20251001", "claude-sonnet-5", "claude-opus-4-8"],
    keyHint: "sk-ant-…",
  },
  {
    id: "openai",
    label: "OpenAI — GPT",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
    keyHint: "sk-…",
  },
  {
    id: "google",
    label: "Google — Gemini",
    models: ["gemini-2.0-flash", "gemini-1.5-pro"],
    keyHint: "AIza…",
  },
  {
    id: "custom",
    label: "Compatível com OpenAI (custom)",
    models: ["llama-3.3-70b", "mixtral-8x7b"],
    keyHint: "chave do provedor",
    needsBaseUrl: true,
  },
];

const KEY = "ai";

/** Lê a config de IA. Nunca lança (retorna null se indisponível/ausente). */
export async function getAiConfig(): Promise<AiConfig | null> {
  try {
    const row = await db.settings.get(KEY);
    return (row?.value as AiConfig | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function saveAiConfig(cfg: AiConfig): Promise<void> {
  await db.settings.put({ key: KEY, value: cfg });
}

export async function clearAiConfig(): Promise<void> {
  try {
    await db.settings.delete(KEY);
  } catch {
    /* noop */
  }
}
