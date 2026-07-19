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
    <nav>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {sections.map((s) => {
          const count = pending[s.id] ?? 0;
          const label = count > 0 ? `${s.label}, ${count} pendências` : s.label;
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-label={label}
                onClick={() => onSelect(s.id)}
                style={{
                  display: "flex", justifyContent: "space-between", width: "100%",
                  background: s.id === activeId ? "#004d14" : "none",
                  color: "#00ff41", border: "none", borderBottom: "1px solid #004d14",
                  cursor: "pointer", fontFamily: "inherit", padding: 8, textAlign: "left",
                }}
              >
                <span>{s.label}</span>
                {count > 0 ? <span style={{ color: "#ffb000" }}>{count}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
