import type { AssistInput } from "./provider";

export function buildPrompt(input: AssistInput): string {
  const contextJson = JSON.stringify(input.context, null, 2);
  const instruction =
    input.instruction ??
    "Sugira um conteúdo curto, concreto e em português para este campo.";
  return [
    "Você ajuda a preencher a especificação de um projeto de software.",
    `Campo a preencher: ${input.field}`,
    `Instrução: ${instruction}`,
    "Contexto atual do projeto (JSON):",
    contextJson,
    "Responda APENAS com o texto sugerido para o campo, sem preâmbulo.",
  ].join("\n\n");
}
