"use client";
import type { PendingItem } from "../lib/sections";

/** Medidor de prontidão do handoff no rail: barra + % + pendências clicáveis. */
export function HandoffMeter({
  pct, pending, onJump,
}: {
  pct: number;
  pending: PendingItem[];
  onJump: (sectionId: string) => void;
}) {
  const ready = pending.length === 0;
  return (
    <div className="meter">
      <div className="meter__top">
        <span className="meter__pct">{pct}%</span>
        <span className="meter__cap">pronto pro handoff</span>
      </div>
      <div
        className="meter__bar"
        role="progressbar"
        aria-label="Prontidão do handoff"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="meter__fill" style={{ width: `${pct}%` }} />
      </div>
      {ready ? (
        <p className="meter__done">✓ spec completa</p>
      ) : (
        <div className="meter__pend">
          <span className="meter__lbl">faltam {pending.length}:</span>
          <div className="chips">
            {pending.map((p) => (
              <button
                key={p.field}
                type="button"
                className="chip"
                onClick={() => onJump(p.sectionId)}
                title={`Ir para: ${p.label}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
