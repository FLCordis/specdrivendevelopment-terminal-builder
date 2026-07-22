"use client";
import { useState } from "react";
import Link from "next/link";
import type { ProjectState } from "@sdd/engine";
import { useProject } from "@/hooks/useProject";
import { useLivePreview } from "@/hooks/useLivePreview";
import { ProjectForm } from "@/components/ProjectForm";
import { FilePreview } from "@/components/FilePreview";
import { SectionNav } from "@/components/SectionNav";
import { HandoffMeter } from "@/components/HandoffMeter";
import { HandoffReview } from "@/components/HandoffReview";
import { ToolkitPicker } from "@/components/ToolkitPicker";
import { PreviewDrawer } from "@/components/PreviewDrawer";
import {
  SECTIONS, sectionStatus, handoffPending, handoffReadiness,
} from "@/lib/sections";
import { downloadZip } from "@/lib/generate";

export function Editor({ id }: { id: string }) {
  const { state, update, loading } = useProject(id);
  const [sectionId, setSectionId] = useState("inicio");
  const [showPreview, setShowPreview] = useState(false);
  const { files, validation, error } = useLivePreview(state);

  if (loading || !state) return <p className="out__empty">Carregando…</p>;

  const pending = validation ? sectionStatus(state, validation) : {};
  const pendItems = validation ? handoffPending(state, validation) : [];
  const pct = validation ? handoffReadiness(state, validation).pct : 0;
  const section = SECTIONS.find((s) => s.id === sectionId);
  const totalPending = pendItems.length;

  function replaceState(next: ProjectState) {
    // aplica o estado inteiro campo a campo, reusando o autosave do useProject
    update("meta", next.meta);
    update("domain", next.domain);
    update("arch", next.arch);
    update("quality", next.quality);
    update("security", next.security);
  }

  function download() {
    downloadZip(state!, `${state!.meta.name || "projeto"}.zip`);
  }

  return (
    <div className="app">
      <header className="cmdbar">
        <Link href="/" className="btn btn--ghost">← projetos</Link>
        <span className="cmdbar__prompt">
          forge ▸ <b>{state.meta.name || "sem-nome"}</b>
          <span className="cursor" aria-hidden="true" />
        </span>
        <span className="cmdbar__sp" />
        <span className="eyebrow">
          {totalPending > 0 ? `${pct}% · ${totalPending} pendente${totalPending === 1 ? "" : "s"}` : "spec completa ✓"}
        </span>
        <button
          type="button"
          className={`btn${showPreview ? " is-on" : ""}`}
          aria-pressed={showPreview}
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? "Prévia ✕" : "Prévia"}
        </button>
        <Link href="/settings" className="cmdbar__link">⚙</Link>
        <button type="button" className="btn btn--primary" onClick={download}>
          Baixar ZIP
        </button>
      </header>

      <main className="editor editor--focused">
        <aside className="zone zone--rail">
          <HandoffMeter pct={pct} pending={pendItems} onJump={setSectionId} />
          <SectionNav
            sections={SECTIONS} activeId={sectionId} pending={pending} onSelect={setSectionId}
          />
        </aside>

        <section className="zone zone--form">
          <div className="form-wrap">
            <div className="section-head">
              <p className="eyebrow">seção</p>
              <h2>{section?.label}</h2>
              {section?.coach ? <p className="section-head__coach">{section.coach}</p> : null}
            </div>

            {sectionId === "revisar" ? (
              <HandoffReview
                state={state}
                pending={pendItems}
                pct={pct}
                onJump={setSectionId}
                onDownload={download}
              />
            ) : sectionId === "toolkit" ? (
              <ToolkitPicker
                archetype={state.domain.archetype}
                disabled={state.toolkit.disabled}
                onChange={(d) => update("toolkit.disabled", d)}
              />
            ) : (
              <ProjectForm
                sectionId={sectionId} state={state} onUpdate={update} onReplaceState={replaceState}
              />
            )}
          </div>
        </section>
      </main>

      <PreviewDrawer open={showPreview} onClose={() => setShowPreview(false)}>
        {error ? <p className="out__err">{error}</p> : null}
        <FilePreview files={files} />
      </PreviewDrawer>
    </div>
  );
}
