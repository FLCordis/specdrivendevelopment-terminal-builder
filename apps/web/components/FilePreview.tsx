"use client";
import { useState } from "react";
import type { GeneratedFile } from "@sdd/engine";

export function FilePreview({ files }: { files: GeneratedFile[] }) {
  const [selected, setSelected] = useState(0);
  if (files.length === 0) return <p>Nada gerado ainda.</p>;
  const safe = selected < files.length ? selected : 0;
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <ul style={{ listStyle: "none", padding: 0, minWidth: 220 }}>
        {files.map((f, i) => (
          <li key={f.path}>
            <button onClick={() => setSelected(i)}
              style={{ background: i === safe ? "#004d14" : "none",
                color: "#00ff41", border: "none", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left", width: "100%", padding: 4 }}>
              {f.path}
            </button>
          </li>
        ))}
      </ul>
      <pre style={{ flex: 1, background: "#040a04", padding: 12, overflow: "auto",
        border: "1px solid #009922" }}>{files[safe].content}</pre>
    </div>
  );
}
