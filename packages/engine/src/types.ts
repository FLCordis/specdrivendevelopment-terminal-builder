export interface GeneratedFile {
  path: string;
  content: string;
}

export interface Warning {
  code: string;
  message: string;
}

export interface Issue {
  field: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Issue[];
  clarifications: Issue[];
}

export interface GeneratedPackage {
  files: GeneratedFile[];
  warnings: Warning[];
}
