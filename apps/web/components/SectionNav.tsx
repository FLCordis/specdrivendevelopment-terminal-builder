"use client";
import type { Section } from "../lib/sections";

export function SectionNav({
  sections, activeId, pending, onSelect,
}: {
  sections: Section[];
  activeId: string;
  pending: Record<string, number>;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="nav">
      {sections.map((s) => {
        const count = pending[s.id] ?? 0;
        const label =
          count > 0
            ? `${s.label}, ${count} ${count === 1 ? "pendência" : "pendências"}`
            : s.label;
        return (
          <button
            key={s.id}
            type="button"
            aria-label={label}
            aria-current={s.id === activeId ? "true" : undefined}
            onClick={() => onSelect(s.id)}
            className={`nav__item${s.id === activeId ? " is-active" : ""}`}
          >
            <span className="nav__label">{s.label}</span>
            {count > 0 ? <span className="nav__badge">{count}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
