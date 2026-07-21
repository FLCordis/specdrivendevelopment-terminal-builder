import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../lib/db";
import {
  PROVIDERS,
  getAiConfig,
  saveAiConfig,
  clearAiConfig,
  type AiConfig,
} from "../lib/settings";

beforeEach(async () => {
  await db.settings.clear();
});

describe("PROVIDERS", () => {
  it("oferece os 3 famosos + custom", () => {
    expect(PROVIDERS.map((p) => p.id)).toEqual([
      "anthropic",
      "openai",
      "google",
      "custom",
    ]);
  });
});

describe("config de IA", () => {
  it("retorna null quando nada foi salvo", async () => {
    expect(await getAiConfig()).toBeNull();
  });

  it("faz round-trip de save/get", async () => {
    const cfg: AiConfig = {
      provider: "openai",
      model: "gpt-4o-mini",
      apiKey: "sk-user",
    };
    await saveAiConfig(cfg);
    expect(await getAiConfig()).toEqual(cfg);
  });

  it("clear remove a config", async () => {
    await saveAiConfig({ provider: "google", model: "gemini-2.0-flash", apiKey: "AIza" });
    await clearAiConfig();
    expect(await getAiConfig()).toBeNull();
  });
});
