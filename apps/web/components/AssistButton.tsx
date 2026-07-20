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
    <span className="assist">
      <span>
        {error ? <small className="assist__err">{error}</small> : null}
        <button
          type="button"
          className="assist__btn"
          aria-label={`Sugerir ${field}`}
          disabled={disabled || status === "loading"}
          title={disabled ? "Assist desligado (sem ANTHROPIC_API_KEY)" : "Sugerir com IA"}
          onClick={() => void suggest(field, context)}
        >
          {status === "loading" ? "…" : "✨"}
        </button>
      </span>

      {suggestion ? (
        <span className="assist__box">
          <span className="assist__text">{suggestion}</span>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => { onAccept(suggestion); clear(); }}
            style={{ marginRight: 8 }}
          >
            Aceitar
          </button>
          <button type="button" className="btn btn--danger" onClick={clear}>
            Descartar
          </button>
        </span>
      ) : null}
    </span>
  );
}
