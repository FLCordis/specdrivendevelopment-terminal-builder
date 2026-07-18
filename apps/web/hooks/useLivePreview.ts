"use client";
import { useEffect, useState } from "react";
import type { GeneratedFile, ProjectState, ValidationResult } from "@sdd/engine";
import { runGenerate } from "../lib/generate";

export function useLivePreview(state: ProjectState | null, delayMs = 300) {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) {
      setFiles([]);
      setValidation(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        const { pkg, validation: v } = runGenerate(state);
        setFiles(pkg.files);
        setValidation(v);
        setError(null);
      } catch {
        setError("Erro ao gerar o preview.");
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [state, delayMs]);

  return { files, validation, error };
}
