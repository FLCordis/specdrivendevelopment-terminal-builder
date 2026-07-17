"use client";
import type { ProjectState } from "@sdd/engine";
import { Field } from "./ui/Field";

function lines(items: string[]): string {
  return items.join("\n");
}
function toArray(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function BasicForm({
  state, onUpdate,
}: {
  state: ProjectState;
  onUpdate: (path: string, value: unknown) => void;
}) {
  return (
    <form>
      <Field label="Nome do projeto" value={state.meta.name}
        onChange={(v) => onUpdate("meta.name", v)} />
      <Field label="Descrição" value={state.meta.description}
        onChange={(v) => onUpdate("meta.description", v)} />
      <Field label="Tipo de projeto" value={state.domain.projectType}
        onChange={(v) => onUpdate("domain.projectType", v)} />

      <label style={{ display: "block", marginBottom: 12 }}>
        <span>Casos de uso (um por linha)</span>
        <textarea
          aria-label="Casos de uso (um por linha)"
          defaultValue={lines(state.domain.useCases)}
          onChange={(e) => onUpdate("domain.useCases", toArray(e.target.value))}
          style={{ display: "block", width: "100%", background: "#040a04",
            color: "#00ff41", border: "1px solid #009922", padding: 6,
            fontFamily: "inherit", minHeight: 80 }}
        />
      </label>

      <Field label="Stack" value={state.arch.stack}
        onChange={(v) => onUpdate("arch.stack", v)} />
      <Field label="Estilo arquitetural" value={state.arch.style}
        onChange={(v) => onUpdate("arch.style", v)} />
      <Field label="Estratégia de testes" value={state.quality.testStrategy}
        onChange={(v) => onUpdate("quality.testStrategy", v)} />
      <Field label="Threat model" value={state.security.threatModel}
        onChange={(v) => onUpdate("security.threatModel", v)} />
    </form>
  );
}
