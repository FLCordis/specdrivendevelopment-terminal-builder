"use client";
import type { ProjectState } from "@sdd/engine";
import type { PendingItem } from "../lib/sections";

/** Tela final "Revisar & Baixar": resumo do spec + pendências clicáveis + próximo passo + download. */
export function HandoffReview({
  state, pending, pct, onJump, onDownload,
}: {
  state: ProjectState;
  pending: PendingItem[];
  pct: number;
  onJump: (sectionId: string) => void;
  onDownload: () => void;
}) {
  const ready = pending.length === 0;
  const rows: [string, string][] = [
    ["Nome", state.meta.name || "—"],
    ["Tipo", state.domain.projectType || "—"],
    ["Stack", state.arch.stack || "—"],
    ["Casos de uso", String(state.domain.useCases.length)],
    ["Features", String(state.features.length)],
    ["Cobertura alvo", `${state.quality.coverageTarget}%`],
  ];

  return (
    <div className="review">
      <div className="review__meter">
        <div className="meter__bar review__bar">
          <span className="meter__fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="review__pct">{pct}% pronto</span>
      </div>

      <dl className="review__grid">
        {rows.map(([k, v]) => (
          <div className="review__cell" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {ready ? (
        <p className="review__ok">✓ Nenhuma pendência. O SPEC está completo — sem <code>[NEEDS CLARIFICATION]</code> nos campos-chave.</p>
      ) : (
        <div className="review__pending">
          <p className="review__pend-head">Pendências ({pending.length}) — clique para resolver</p>
          <ul className="review__list">
            {pending.map((p) => (
              <li key={p.field}>
                <button type="button" className="review__item" onClick={() => onJump(p.sectionId)}>
                  <span className="review__dot" aria-hidden="true" />
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="review__next">
        <p className="eyebrow">próximo passo</p>
        <ol className="review__steps">
          <li>Baixe o <b>.zip</b> e descompacte na pasta do projeto.</li>
          <li>Abra no Claude Code e siga o <code>START.md</code> (instala a Superpowers).</li>
          <li>Diga: <code>&quot;comece a primeira feature&quot;</code>.</li>
        </ol>
        <button type="button" className="btn btn--primary btn--lg" onClick={onDownload}>
          Baixar ZIP →
        </button>
        {ready ? null : (
          <p className="review__warn">
            Dá pra baixar já — mas resolver as pendências gera um SPEC mais completo (menos <code>[NEEDS CLARIFICATION]</code> pro agente adivinhar).
          </p>
        )}
      </div>
    </div>
  );
}
