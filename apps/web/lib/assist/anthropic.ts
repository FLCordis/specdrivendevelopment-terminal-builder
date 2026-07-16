import Anthropic from "@anthropic-ai/sdk";
import type { AssistProvider, AssistInput, AssistResult } from "./provider";
import { buildPrompt } from "./prompt";

export function createAnthropicProvider(apiKey: string): AssistProvider {
  const client = new Anthropic({ apiKey });
  return {
    async suggest(input: AssistInput): Promise<AssistResult> {
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: buildPrompt(input) }],
      });
      const suggestion = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      return { suggestion };
    },
  };
}
