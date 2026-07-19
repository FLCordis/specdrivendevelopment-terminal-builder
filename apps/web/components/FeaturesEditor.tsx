"use client";
import type { Feature } from "@sdd/engine";

export function FeaturesEditor({
  features, onChange,
}: {
  features: Feature[];
  onChange: (features: Feature[]) => void;
}) {
  function patch(index: number, next: Partial<Feature>) {
    onChange(features.map((f, i) => (i === index ? { ...f, ...next } : f)));
  }

  function toggleDep(index: number, depName: string) {
    const current = features[index].dependsOn;
    const next = current.includes(depName)
      ? current.filter((d) => d !== depName)
      : [...current, depName];
    patch(index, { dependsOn: next });
  }

  return (
    <div>
      <p style={{ color: "#00bb30" }}>
        Features sem dependência rodam em paralelo. Use "depende de" para serializar.
      </p>

      {features.map((f, i) => (
        <fieldset key={i} style={{ border: "1px solid #009922", marginBottom: 12, padding: 8 }}>
          <legend style={{ color: "#00ff41" }}>Feature {i + 1}</legend>

          <label style={{ display: "block", marginBottom: 6 }}>
            <span>Nome</span>
            <input
              aria-label={`Nome da feature ${i + 1}`}
              value={f.name}
              onChange={(e) => patch(i, { name: e.target.value })}
              style={{ display: "block", width: "100%", background: "#040a04",
                color: "#00ff41", border: "1px solid #009922", padding: 6, fontFamily: "inherit" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 6 }}>
            <span>Semente de spec</span>
            <input
              aria-label={`Semente da feature ${i + 1}`}
              value={f.specSeed}
              onChange={(e) => patch(i, { specSeed: e.target.value })}
              style={{ display: "block", width: "100%", background: "#040a04",
                color: "#00ff41", border: "1px solid #009922", padding: 6, fontFamily: "inherit" }}
            />
          </label>

          <div style={{ marginBottom: 6 }}>
            <span style={{ color: "#00bb30" }}>Depende de:</span>
            {features.filter((_, j) => j !== i).length === 0 ? (
              <small style={{ color: "#00bb30" }}> (nenhuma outra feature)</small>
            ) : (
              features.map((other, j) =>
                j === i ? null : (
                  <label key={j} style={{ marginLeft: 8 }}>
                    <input
                      type="checkbox"
                      aria-label={`Feature ${i + 1} depende de ${other.name}`}
                      checked={f.dependsOn.includes(other.name)}
                      onChange={() => toggleDep(i, other.name)}
                    />
                    {other.name || `(feature ${j + 1})`}
                  </label>
                ),
              )
            )}
          </div>

          <button
            type="button"
            aria-label={`Remover feature ${i + 1}`}
            onClick={() => onChange(features.filter((_, j) => j !== i))}
            style={{ background: "none", color: "#ff4444", border: "1px solid #009922",
              cursor: "pointer", fontFamily: "inherit", padding: "2px 8px" }}
          >
            Remover
          </button>
        </fieldset>
      ))}

      <button
        type="button"
        onClick={() => onChange([...features, { name: "", specSeed: "", dependsOn: [] }])}
        style={{ background: "#004d14", color: "#00ff41", border: "1px solid #009922",
          cursor: "pointer", fontFamily: "inherit", padding: "6px 12px" }}
      >
        Adicionar feature
      </button>
    </div>
  );
}
