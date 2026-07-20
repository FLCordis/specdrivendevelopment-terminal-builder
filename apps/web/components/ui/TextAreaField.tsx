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
    <div className="field">
      <label>
        <span className="field__label">{label}</span>
        <textarea
          className="textarea"
          aria-label={label}
          rows={rows}
          value={text}
          onChange={(e) => handle(e.target.value)}
        />
      </label>
      <div className="field__foot">
        {hint ? <small className="hint">{hint}</small> : <span />}
        {assist}
      </div>
    </div>
  );
}
