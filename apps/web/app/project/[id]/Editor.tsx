"use client";
import { useState } from "react";
import { useProject } from "@/hooks/useProject";
import { BasicForm } from "@/components/BasicForm";
import { FilePreview } from "@/components/FilePreview";
import { runGenerate, downloadZip } from "@/lib/generate";
import type { GeneratedFile } from "@sdd/engine";

export function Editor({ id }: { id: string }) {
  const { state, update, loading } = useProject(id);
  const [files, setFiles] = useState<GeneratedFile[]>([]);

  if (loading || !state) return <p>Carregando…</p>;

  function onGenerate() {
    if (!state) return;
    const { pkg } = runGenerate(state);
    setFiles(pkg.files);
  }

  return (
    <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, padding: 24 }}>
      <section>
        <BasicForm state={state} onUpdate={update} />
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button onClick={onGenerate}>Gerar</button>
          <button onClick={() => downloadZip(state, `${state.meta.name || "projeto"}.zip`)}>
            Baixar ZIP
          </button>
        </div>
      </section>
      <section><FilePreview files={files} /></section>
    </main>
  );
}
