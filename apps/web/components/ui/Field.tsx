"use client";
import type { ReactNode } from "react";

export function Field({
  label, value, onChange, clarify, hint, assist,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  clarify?: boolean;
  hint?: string;
  assist?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block" }}>
        <span style={{ color: clarify ? "#ffb000" : "#00ff41" }}>
          {label}{clarify ? " ⚠" : ""}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
