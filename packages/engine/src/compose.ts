import { ProjectStateSchema, type ProjectState } from "./state/schema";
import type { GeneratedFile, GeneratedPackage, Warning } from "./types";
import { generateConstitution } from "./generators/constitution";
import { generateReadme } from "./generators/readme";
import { generateBootstrap } from "./generators/bootstrap";
import { generateSpec } from "./generators/spec";
import { generateContext } from "./generators/context";
import { generateRoadmap } from "./generators/roadmap";
import { generateHarness } from "./generators/harness";
import { generateToolkit } from "./generators/toolkit";
import { selectToolkit } from "./toolkit";

const BASE_GENERATORS = [
  generateConstitution,
  generateReadme,
  generateBootstrap,
  generateSpec,
  generateContext,
  generateRoadmap,
];

export function generate(input: ProjectState): GeneratedPackage {
  const state = ProjectStateSchema.parse(input);

  const items = selectToolkit(state);
  const hookFragments = items
    .filter((i) => i.kind === "hook" && i.hook)
    .map((i) => i.hook!);

  const files: GeneratedFile[] = [];
  for (const gen of BASE_GENERATORS) files.push(...gen(state));
  files.push(...generateHarness(state, hookFragments));
  files.push(...generateToolkit(state));

  const warnings: Warning[] = [];
  if (state.features.length === 0) {
    warnings.push({
      code: "no-features",
      message: "Nenhuma feature definida — o roadmap ficará vazio.",
    });
  }

  return { files, warnings };
}
