"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function TextAreaField({
  label, value, onChange, hint, assist, rows = 5,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  assist?: ReactNode;
  rows?: number;
}) {
  const [text, setText] = useState(value);
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(value);
      lastEmitted.current = value;
    }
  }, [value]);

  function handle(next: string) {
    setText(next);
    lastEmitted.current = next;
    onChange(next);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block" }}>
        <span style={{ color: "#00ff41" }}>{label}</span>
        <textarea
          aria-label={label}
          rows={rows}
          value={text}
          onChange={(e) => handle(e.target.value)}
          style={{
            display: "block", width: "100%", background: "#040a04",
            color: "#00ff41", border: "1px solid #009922", padding: 6,
            fontFamily: "inherit",
          }}
        />
      </label>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        {hint ? <small style={{ color: "#00bb30" }}>{hint}</small> : <span />}
        {assist}
      </div>
    </div>
  );
}
