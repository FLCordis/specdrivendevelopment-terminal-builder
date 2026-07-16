import {
  validate,
  generate,
  packageZip,
  type ProjectState,
  type ValidationResult,
  type GeneratedPackage,
} from "@sdd/engine";

export function runGenerate(state: ProjectState): {
  validation: ValidationResult;
  pkg: GeneratedPackage;
} {
  const validation = validate(state);
  const pkg = generate(state);
  return { validation, pkg };
}

export function downloadZip(state: ProjectState, fileName: string): void {
  const pkg = generate(state);
  const bytes = packageZip(pkg);
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
