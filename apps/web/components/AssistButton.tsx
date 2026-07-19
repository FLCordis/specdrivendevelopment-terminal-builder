"use client";
import type { ProjectState } from "@sdd/engine";
import { useAssist } from "../hooks/useAssist";

export function AssistButton({
  field, context, onAccept,
}: {
  field: string;
  context: ProjectState;
  onAccept: (suggestion: string) => void;
}) {
  const { status, suggestion, error, suggest, clear } = useAssist();
  const disabled = status === "disabled";

  return (
    <span>
      <button
        type="button"
        aria-label={`Sugerir ${field}`}
        disabled={disabled || status === "loading"}
        title={disabled ? "Assist desligado (sem ANTHROPIC_API_KEY)" : "Sugerir com IA"}
        onClick={() => void suggest(field, context)}
        style={{
          background: "none", border: "1px solid #009922", color: "#ffb000",
          cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", padding: "0 6px",
        }}
      >
        {status === "loading" ? "…" : "✨"}
      </button>

      {error ? <small style={{ color: "#ff4444", marginLeft: 6 }}>{error}</small> : null}

      {suggestion !== null ? (
        <span style={{ display: "block", marginTop: 6, border: "1px solid #004d14", padding: 6 }}>
          <span style={{ display: "block", color: "#00bb30" }}>{suggestion}</span>
          <button
            type="button"
            onClick={() => { onAccept(suggestion); clear(); }}
            style={{ background: "#004d14", color: "#00ff41", border: "none",
              cursor: "pointer", fontFamily: "inherit", marginRight: 6 }}
          >
            Aceitar
          </button>
          <button
            type="button"
            onClick={clear}
            style={{ background: "none", color: "#ff4444", border: "none",
              cursor: "pointer", fontFamily: "inherit" }}
          >
            Descartar
          </button>
        </span>
      ) : null}
    </span>
  );
}
