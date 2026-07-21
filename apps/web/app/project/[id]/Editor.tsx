"use client";
import { useState } from "react";
import Link from "next/link";
import type { ProjectState } from "@sdd/engine";
import { useProject } from "@/hooks/useProject";
import { useLivePreview } from "@/hooks/useLivePreview";
import { ProjectForm } from "@/components/ProjectForm";
import { FilePreview } from "@/components/FilePreview";
import { SectionNav } from "@/components/SectionNav";
import { SECTIONS, sectionStatus } from "@/lib/sections";
import { downloadZip } from "@/lib/generate";

export function Editor({ id }: { id: string }) {
  const { state, update, loading } = useProject(id);
  const [sectionId, setSectionId] = useState("inicio");
  const { files, validation, error } = useLivePreview(state);

  if (loading || !state) return <p className="out__empty">Carregando…</p>;

  const pending = validation ? sectionStatus(state, validation) : {};
  const section = SECTIONS.find((s) => s.id === sectionId);
  const totalPending = Object.values(pending).reduce((a, b) => a + b, 0);

  function replaceState(next: ProjectState) {
    // aplica o estado inteiro campo a campo, reusando o autosave do useProject
    update("meta", next.meta);
    update("domain", next.domain);
    update("arch", next.arch);
    update("quality", next.quality);
    update("security", next.security);
  }

  return (
    <div className="app">
      <header className="cmdbar">
        <Link href="/" className="btn btn--ghost">← projetos</Link>
        <span className="cmdbar__prompt">
          sdd ▸ <b>{state.meta.name || "sem-nome"}</b>
          <span className="cursor" aria-hidden="true" />
        </span>
        <span className="cmdbar__sp" />
        <span className="eyebrow">
          {totalPending > 0
            ? `${totalPending} ${totalPending === 1 ? "pendência" : "pendências"}`
            : "spec completa"}
        </span>
        <Link href="/settings" className="cmdbar__link">⚙</Link>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => downloadZip(state, `${state.meta.name || "projeto"}.zip`)}
        >
          Baixar ZIP
        </button>
      </header>

      <main className="editor">
        <aside className="zone zone--rail">
          <SectionNav
            sections={SECTIONS} activeId={sectionId} pending={pending} onSelect={setSectionId}
          />
        </aside>

        <section className="zone zone--form">
          <div className="section-head">
            <p className="eyebrow">seção</p>
            <h2>{section?.label}</h2>
          </div>
          <ProjectForm
            sectionId={sectionId} state={state} onUpdate={update} onReplaceState={replaceState}
          />
        </section>

        <section className="zone zone--out">
          {error ? <p className="out__err">{error}</p> : null}
          <FilePreview files={files} />
        </section>
      </main>
    </div>
  );
}
