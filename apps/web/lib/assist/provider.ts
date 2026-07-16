import type { ProjectState } from "@sdd/engine";

export interface AssistInput {
  field: string;
  context: Partial<ProjectState>;
  instruction?: string;
}

export interface AssistResult {
  suggestion: string;
}

export interface AssistProvider {
  suggest(input: AssistInput): Promise<AssistResult>;
}
