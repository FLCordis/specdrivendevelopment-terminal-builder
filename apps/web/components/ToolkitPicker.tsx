"use client";
import { toolkitFor, type ToolkitItemMeta } from "../lib/toolkit";

const KIND_LABEL: Record<string, string> = {
  skill: "Skills", agent: "Subagents", hook: "Hooks", command: "Commands",
};

export function ToolkitPicker({
  archetype, disabled, onChange,
}: {
  archetype: string;
  disabled: string[];
  onChange: (disabled: string[]) => void;
}) {
  const items = toolkitFor(archetype);
  if (items.length === 0) {
    return (
      <p className="empty">
        Nenhum kit curado para este arquétipo ainda — a Superpowers cresce o
        resto sob demanda.
      </p>
    );
  }

  const toggle = (id: string) => {
    const set = new Set(disabled);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange([...set]);
  };

  const kinds: ToolkitItemMeta["kind"][] = ["skill", "agent", "hook", "command"];
  return (
    <div className="toolkit">
      {kinds.map((kind) => {
        const group = items.filter((i) => i.kind === kind);
        if (group.length === 0) return null;
        return (
          <fieldset className="toolkit__group" key={kind}>
            <legend>{KIND_LABEL[kind]}</legend>
            {group.map((item) => (
              <label className="toolkit__item" key={item.id}>
                <input
                  type="checkbox"
                  aria-label={item.label}
                  checked={!disabled.includes(item.id)}
                  onChange={() => toggle(item.id)}
                />
                <span className="toolkit__text">
                  <b>{item.label}</b>
                  <small>{item.summary}</small>
                </span>
              </label>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}
