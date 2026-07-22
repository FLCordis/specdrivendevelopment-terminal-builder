import type { ProjectState } from "../state/schema";
import type { GeneratedFile } from "../types";
import { selectToolkit } from "../toolkit";

export function generateToolkit(state: ProjectState): GeneratedFile[] {
  return selectToolkit(state).flatMap((item) => item.files(state));
}
