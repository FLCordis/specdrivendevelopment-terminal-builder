"use client";
import { useState } from "react";
import type { GeneratedFile } from "@sdd/engine";
import { buildTree } from "../lib/file-tree";
import { FileTree } from "./FileTree";

export function FilePreview({ files }: { files: GeneratedFile[] }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  if (files.length === 0) return <p>Nada gerado ainda.</p>;

  const current =
    files.find((f) => f.path === selectedPath) ?? files[0];

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ minWidth: 240 }}>
        <FileTree
          nodes={buildTree(files)}
          selectedPath={current.path}
          onSelect={setSelectedPath}
        />
      </div>
      <pre style={{ flex: 1, background: "#040a04", padding: 12, overflow: "auto",
        border: "1px solid #009922" }}>{current.content}</pre>
    </div>
  );
}
