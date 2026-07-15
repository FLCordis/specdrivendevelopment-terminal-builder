import { ProjectStateSchema, type ProjectState } from "./state/schema.js";
import type { GeneratedFile, GeneratedPackage, Warning } from "./types.js";
import { generateConstitution } from "./generators/constitution.js";
import { generateReadme } from "./generators/readme.js";
import { generateBootstrap } from "./generators/bootstrap.js";
import { generateSpec } from "./generators/spec.js";
import { generateContext } from "./generators/context.js";
import { generateRoadmap } from "./generators/roadmap.js";
import { generateHarness } from "./generators/harness.js";

const GENERATORS = [
  generateConstitution,
  generateReadme,
  generateBootstrap,
  generateSpec,
  generateContext,
  generateRoadmap,
  generateHarness,
];

export function generate(input: ProjectState): GeneratedPackage {
  const state = ProjectStateSchema.parse(input);

  const files: GeneratedFile[] = [];
  for (const gen of GENERATORS) {
    files.push(...gen(state));
  }

  const warnings: Warning[] = [];
  if (state.features.length === 0) {
    warnings.push({
      code: "no-features",
      message: "Nenhuma feature definida — o roadmap ficará vazio.",
    });
  }

  return { files, warnings };
}
