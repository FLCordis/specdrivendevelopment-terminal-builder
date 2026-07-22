"use client";
import { useEffect, useState } from "react";

/** Segmento do "output" do terminal. `c` = classe de cor (k=chave, c=comentário, p=prompt). */
type Seg = { t: string; c?: "k" | "c" | "p" };

const SCRIPT: Seg[] = [
  { t: "# o que sai no .zip\n", c: "c" },
  { t: "CLAUDE.md", c: "k" },
  { t: "          " },
  { t: "constituição — manda usar Superpowers\n", c: "c" },
  { t: "docs/superpowers/", c: "k" },
  { t: "  " },
  { t: "SPEC + contexto + roadmap\n", c: "c" },
  { t: ".claude/hooks/", c: "k" },
  { t: "     " },
  { t: "guard-destructive (bloqueia rm -rf, push)\n\n", c: "c" },
  { t: "▸ ", c: "p" },
  { t: "abra no Claude Code: " },
  { t: '"comece a primeira feature"', c: "k" },
];

const TOTAL = SCRIPT.reduce((n, s) => n + s.t.length, 0);

/** Renderiza os segmentos até revelar no máximo `limit` caracteres (corta o último parcialmente). */
function paint(limit: number) {
  const out: React.ReactNode[] = [];
  let rem = limit;
  for (let i = 0; i < SCRIPT.length && rem > 0; i++) {
    const s = SCRIPT[i];
    out.push(
      <span key={i} className={s.c}>
        {s.t.slice(0, rem)}
      </span>,
    );
    rem -= s.t.length;
  }
  return out;
}

/** Terminal do hero: "digita" o output em streaming, com fallback instantâneo p/ movimento reduzido. */
export default function TermStream() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(TOTAL);
      return;
    }
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(TOTAL, n + 3);
      setShown(n);
      if (n >= TOTAL) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, []);

  const typing = shown < TOTAL;
  return (
    <div className="termcard__body">
      {/* ghost invisível reserva a altura final — zero layout shift enquanto digita */}
      <div className="term__ghost" aria-hidden="true">
        {paint(TOTAL)}
      </div>
      <div className="term__live">
        {paint(shown)}
        <span className={`cursor${typing ? " cursor--solid" : ""}`} />
      </div>
    </div>
  );
}
