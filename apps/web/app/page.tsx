"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listProjects, createProject, removeProject } from "@/lib/projects";
import type { Project } from "@/lib/db";
import TermStream from "@/components/TermStream";

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  async function refresh() {
    setProjects(await listProjects());
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function onNew() {
    const p = await createProject();
    router.push(`/project/${p.id}`);
  }
  async function onDelete(id: string) {
    await removeProject(id);
    await refresh();
  }

  return (
    <div className="app">
      <header className="cmdbar">
        <span className="cmdbar__brand">
          <span className="cmdbar__dot" /> SDD&nbsp;Terminal
        </span>
        <span className="cmdbar__sp" />
        <a className="cmdbar__link" href="/settings">
          ⚙ Configurações
        </a>
      </header>

      <main className="home">
        <section className="hero">
          <span className="hero__kicker reveal">
            <span className="cmdbar__dot" /> powered by Superpowers
          </span>
          <h1 className="hero__title reveal d1">
            Orquestre um <span className="accent">time de IA</span> para
            construir seu software.
          </h1>
          <p className="hero__sub reveal d2">
            Responda um formulário sobre o projeto e gere um scaffold
            pré-cabeado para desenvolvimento agêntico: subagent-driven, TDD e
            safety harness — pronto para abrir no Claude Code.
          </p>
          <div className="hero__cta reveal d3">
            <button className="btn btn--primary btn--lg" onClick={onNew}>
              Novo projeto →
            </button>
            <a className="btn btn--lg" href="/settings">
              Configurar IA
            </a>
          </div>

          <div className="termcard reveal d4" aria-hidden="true">
            <div className="termcard__bar">
              <i />
              <i />
              <i />
              <span>~/loja-api · gerado pelo SDD Terminal</span>
            </div>
            <TermStream />
          </div>
        </section>

        <div className="section-title">
          <h2>seus projetos</h2>
          <span className="rule" />
        </div>

        <div className="grid-cards">
          <button className="card card--new" onClick={onNew}>
            {projects.length === 0
              ? "＋ Criar seu primeiro projeto"
              : "＋ Criar projeto"}
          </button>
          {projects.map((p) => (
            <div className="card" key={p.id}>
              <button
                className="card__open"
                onClick={() => router.push(`/project/${p.id}`)}
              >
                {p.name}
              </button>
              <span className="card__meta">
                editado {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
              </span>
              <button
                className="card__del"
                aria-label={`Excluir ${p.name}`}
                onClick={() => onDelete(p.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
