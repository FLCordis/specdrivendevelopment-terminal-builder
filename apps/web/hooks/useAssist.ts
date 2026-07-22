"use client";
import { useCallback, useRef, useState } from "react";
import type { ProjectState } from "@sdd/engine";
import { getAiConfig } from "../lib/settings";

export type AssistStatus = "idle" | "loading" | "error" | "disabled";

export function useAssist() {
  const [status, setStatus] = useState<AssistStatus>("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ref (e não o state) para o guard: mantém `suggest` estável em useCallback([])
  const disabledRef = useRef(false);

  const suggest = useCallback(
    async (field: string, context: ProjectState) => {
      // 501 é permanente na instância: não tenta de novo nem sai de "disabled"
      if (disabledRef.current) return;
      setStatus("loading");
      setError(null);
      try {
        // config de IA vive no browser (Configurações); getAiConfig nunca lança
        const cfg = await getAiConfig();
        const res = await fetch("/api/assist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            field,
            context,
            ...(cfg
              ? { provider: cfg.provider, apiKey: cfg.apiKey, model: cfg.model, baseUrl: cfg.baseUrl }
              : {}),
          }),
        });
        if (res.status === 501) {
          disabledRef.current = true;
          setStatus("disabled");
          return;
        }
        if (!res.ok) {
          setStatus("error");
          setError("Assist indisponível. Tente de novo.");
          return;
        }
        const data = (await res.json()) as { suggestion?: string };
        setSuggestion(data.suggestion ?? "");
        setStatus("idle");
      } catch {
        setStatus("error");
        setError("Falha de rede ao chamar o assist.");
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setSuggestion(null);
    setError(null);
  }, []);

  return { status, suggestion, error, suggest, clear };
}
