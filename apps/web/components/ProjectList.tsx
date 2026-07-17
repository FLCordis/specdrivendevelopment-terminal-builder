"use client";
import type { Project } from "../lib/db";

export function ProjectList({
  projects, onOpen, onDelete, onNew,
}: {
  projects: Project[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div>
      <button onClick={onNew} style={{ marginBottom: 16, background: "#004d14",
        color: "#00ff41", border: "1px solid #009922", padding: "6px 12px",
        fontFamily: "inherit", cursor: "pointer" }}>
        Novo projeto
      </button>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {projects.map((p) => (
          <li key={p.id} style={{ display: "flex", justifyContent: "space-between",
            borderBottom: "1px solid #004d14", padding: "8px 0" }}>
            <span onClick={() => onOpen(p.id)} style={{ cursor: "pointer" }}>{p.name}</span>
            <button onClick={() => onDelete(p.id)} aria-label={`Excluir ${p.name}`}
              style={{ background: "none", color: "#ff4444", border: "none",
                cursor: "pointer", fontFamily: "inherit" }}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
