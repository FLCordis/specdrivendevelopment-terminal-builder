"use client";
import { useCallback, useState } from "react";
import type { ProjectState } from "@sdd/engine";

export type AssistStatus = "idle" | "loading" | "error" | "disabled";

export function useAssist() {
  const [status, setStatus] = useState<AssistStatus>("idle");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggest = useCallback(
    async (field: string, context: ProjectState) => {
      setStatus("loading");
      setError(null);
      try {
        const res = await fetch("/api/assist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ field, context }),
        });
        if (res.status === 501) {
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
