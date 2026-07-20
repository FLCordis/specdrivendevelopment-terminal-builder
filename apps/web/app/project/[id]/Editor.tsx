"use client";
import { useState } from "react";
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

  if (loading || !state) return <p>Carregando…</p>;

  const pending = validation ? sectionStatus(state, validation) : {};

  function replaceState(next: ProjectState) {
    // aplica o estado inteiro campo a campo, reusando o autosave do useProject
    update("meta", next.meta);
    update("domain", next.domain);
    update("arch", next.arch);
    update("quality", next.quality);
    update("security", next.security);
  }

  return (
    <main style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 24, padding: 24 }}>
      <aside>
        <SectionNav
          sections={SECTIONS} activeId={sectionId} pending={pending} onSelect={setSectionId}
        />
        <button
          onClick={() => downloadZip(state, `${state.meta.name || "projeto"}.zip`)}
          style={{ marginTop: 16, width: "100%", background: "#004d14", color: "#00ff41",
            border: "1px solid #009922", cursor: "pointer", fontFamily: "inherit", padding: 8 }}
        >
          Baixar ZIP
        </button>
      </aside>

      <section>
        <ProjectForm
          sectionId={sectionId} state={state} onUpdate={update} onReplaceState={replaceState}
        />
      </section>

      <section>
        {error ? <p style={{ color: "#ff4444" }}>{error}</p> : null}
        <FilePreview files={files} />
      </section>
    </main>
  );
}
