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
    <div className="field">
      <label>
        <span className={`field__label${clarify ? " field__label--warn" : ""}`}>
          {label}{clarify ? " ⚠" : ""}
        </span>
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <div className="field__foot">
        {hint ? <small className="hint">{hint}</small> : <span />}
        {assist}
      </div>
    </div>
  );
}
