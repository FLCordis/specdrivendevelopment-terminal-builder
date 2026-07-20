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
      <button type="button" className="btn btn--primary" onClick={onNew}>
        Novo projeto
      </button>

      {projects.length === 0 ? (
        <p className="empty">Nenhum projeto ainda. Crie o primeiro para começar.</p>
      ) : (
        <ul className="projlist">
          {projects.map((p) => (
            <li key={p.id} className="projitem">
              <button
                type="button"
                className="projitem__open"
                onClick={() => onOpen(p.id)}
              >
                {p.name}
              </button>
              <span className="projitem__meta">
                {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
              </span>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => onDelete(p.id)}
                aria-label={`Excluir ${p.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
