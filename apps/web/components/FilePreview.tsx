"use client";
import { useState } from "react";
import type { GeneratedFile } from "@sdd/engine";
import { buildTree } from "../lib/file-tree";
import { FileTree } from "./FileTree";

export function FilePreview({ files }: { files: GeneratedFile[] }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  if (files.length === 0) return <p className="out__empty">Nada gerado ainda.</p>;

  const current = files.find((f) => f.path === selectedPath) ?? files[0];

  return (
    <div className="out">
      <div className="out__tree">
        <FileTree
          nodes={buildTree(files)}
          selectedPath={current.path}
          onSelect={setSelectedPath}
        />
      </div>
      <pre className="out__body">{current.content}</pre>
    </div>
  );
}
