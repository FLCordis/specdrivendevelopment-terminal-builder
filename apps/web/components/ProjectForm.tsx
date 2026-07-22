"use client";
import type { ProjectState } from "@sdd/engine";
import { Field } from "./ui/Field";
import { TextAreaField } from "./ui/TextAreaField";
import { AssistButton } from "./AssistButton";
import { FeaturesEditor } from "./FeaturesEditor";
import {
  ARCHETYPE_LIST, applyArchetype, hintFor, isFieldVisible, type ArchetypeId,
} from "../lib/archetypes";

function lines(items: string[]): string {
  return items.join("\n");
}
function toArray(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function ProjectForm({
  sectionId, state, onUpdate, onReplaceState,
}: {
  sectionId: string;
  state: ProjectState;
  onUpdate: (path: string, value: unknown) => void;
  onReplaceState: (next: ProjectState) => void;
}) {
  // fallback para "generic" se o archetype for um valor desconhecido
  // (ex.: JSON importado com archetype inválido) — evita crash do editor
  const archetype: ArchetypeId = ARCHETYPE_LIST.some(
    (a) => a.id === state.domain.archetype,
  )
    ? (state.domain.archetype as ArchetypeId)
    : "generic";
  const visible = (path: string) => isFieldVisible(archetype, path);
  const hint = (path: string) => hintFor(archetype, path);
  const assistFor = (path: string) => (
    <AssistButton field={path} context={state} onAccept={(s) => onUpdate(path, s)} />
  );

  if (sectionId === "inicio") {
    return (
      <div>
        <div className="field">
          <label>
            <span className="field__label">Arquétipo do projeto</span>
            <select
              className="select"
              aria-label="Arquétipo do projeto"
              value={archetype}
              onChange={(e) => onReplaceState(applyArchetype(state, e.target.value as ArchetypeId))}
            >
              {ARCHETYPE_LIST.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </label>
          <small className="hint">
            Preenche defaults sensatos e esconde perguntas irrelevantes. Não sobrescreve o que você já escreveu.
          </small>
        </div>

        <Field
          label="Nome do projeto"
          value={state.meta.name}
          onChange={(v) => onUpdate("meta.name", v)}
        />

        <Field
          label="Descrição (1 linha: o que é / pra quem)"
          value={state.meta.description}
          onChange={(v) => onUpdate("meta.description", v)}
          hint={hint("meta.description")} assist={assistFor("meta.description")}
        />
      </div>
    );
  }

  if (sectionId === "produto") {
    return (
      <div>
        <Field
          label="Tipo de projeto" value={state.domain.projectType}
          onChange={(v) => onUpdate("domain.projectType", v)}
          hint={hint("domain.projectType")}
        />
        <TextAreaField
          label="Casos de uso (um por linha)" value={lines(state.domain.useCases)}
          onChange={(v) => onUpdate("domain.useCases", toArray(v))}
          hint={hint("domain.useCases")} assist={assistFor("domain.useCases")}
        />
        <TextAreaField
          label="Não-objetivos (um por linha)" value={lines(state.domain.nonGoals)}
          onChange={(v) => onUpdate("domain.nonGoals", toArray(v))}
          hint={hint("domain.nonGoals")} assist={assistFor("domain.nonGoals")}
        />
      </div>
    );
  }

  if (sectionId === "arquitetura") {
    return (
      <div>
        <Field
          label="Stack" value={state.arch.stack}
          onChange={(v) => onUpdate("arch.stack", v)} hint={hint("arch.stack")}
        />
        <Field
          label="Estilo arquitetural" value={state.arch.style}
          onChange={(v) => onUpdate("arch.style", v)}
          hint={hint("arch.style")} assist={assistFor("arch.style")}
        />
        <TextAreaField
          label="Restrições não-funcionais (uma por linha)"
          value={lines(state.domain.constraints)}
          onChange={(v) => onUpdate("domain.constraints", toArray(v))}
          hint="ex.: p95 < 200ms, roda offline, zero dependências externas"
          assist={assistFor("domain.constraints")}
        />
      </div>
    );
  }

  if (sectionId === "qualidade") {
    return (
      <div>
        <Field
          label="Estratégia de testes" value={state.quality.testStrategy}
          onChange={(v) => onUpdate("quality.testStrategy", v)}
          hint={hint("quality.testStrategy")}
        />
        <div className="field">
          <label>
            <span className="field__label">Alvo de cobertura (%)</span>
            <input
              className="input"
              type="number" min={0} max={100}
              aria-label="Alvo de cobertura (%)"
              value={state.quality.coverageTarget}
              onChange={(e) => onUpdate("quality.coverageTarget", Number(e.target.value))}
            />
          </label>
        </div>
        <label className="checkline">
          <input
            type="checkbox" aria-label="Usa CI"
            checked={state.quality.ci}
            onChange={(e) => onUpdate("quality.ci", e.target.checked)}
          />
          <span> Usa CI</span>
        </label>
        <Field
          label="Definition of done (como sabemos que ficou pronto)"
          value={state.meta.definitionOfDone}
          onChange={(v) => onUpdate("meta.definitionOfDone", v)}
          hint="ex.: checkout completo com 90% de cobertura e sec-review aprovado"
          assist={assistFor("meta.definitionOfDone")}
        />
      </div>
    );
  }

  if (sectionId === "seguranca") {
    return (
      <div>
        {visible("security.threatModel") ? (
          <Field
            label="Threat model" value={state.security.threatModel}
            onChange={(v) => onUpdate("security.threatModel", v)}
            hint={hint("security.threatModel")} assist={assistFor("security.threatModel")}
          />
        ) : null}
        {visible("security.gates") ? (
          <TextAreaField
            label="Gates obrigatórios (um por linha)" value={lines(state.security.gates)}
            onChange={(v) => onUpdate("security.gates", toArray(v))}
            hint={hint("security.gates")}
          />
        ) : null}
        <label className="checkline">
          <input
            type="checkbox" aria-label="Usa Git"
            checked={state.meta.useGit}
            onChange={(e) => onUpdate("meta.useGit", e.target.checked)}
          />
          <span> Usa Git (habilita os guardas de git no harness)</span>
        </label>
      </div>
    );
  }

  if (sectionId === "features") {
    return (
      <FeaturesEditor
        features={state.features}
        onChange={(features) => onUpdate("features", features)}
      />
    );
  }

  return null;
}
