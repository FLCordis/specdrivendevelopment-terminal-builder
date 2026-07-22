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

  // Renomear cascateia o novo nome nos dependsOn das outras features,
  // para as dependências não ficarem apontando para o nome antigo (órfãs).
  function renameFeature(index: number, newName: string) {
    const oldName = features[index].name;
    onChange(
      features.map((f, i) => {
        if (i === index) return { ...f, name: newName };
        if (oldName && f.dependsOn.includes(oldName)) {
          return { ...f, dependsOn: f.dependsOn.map((d) => (d === oldName ? newName : d)) };
        }
        return f;
      }),
    );
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
      <p className="feat-lead">
        Features sem dependência rodam em paralelo. Use “depende de” para serializar.
      </p>

      {features.map((f, i) => (
        <fieldset key={i} className="feat">
          <legend className="feat__legend">FEATURE {i + 1}</legend>

          <div className="field">
            <label>
              <span className="field__label">Nome</span>
              <input
                className="input"
                aria-label={`Nome da feature ${i + 1}`}
                value={f.name}
                onChange={(e) => renameFeature(i, e.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <label>
              <span className="field__label">Semente de spec</span>
              <input
                className="input"
                aria-label={`Semente da feature ${i + 1}`}
                value={f.specSeed}
                onChange={(e) => patch(i, { specSeed: e.target.value })}
              />
            </label>
          </div>

          <div className="field">
            <span className="field__label">Depende de</span>
            <div className="deps">
            {(() => {
              // só features com nome não-vazio podem ser dependência
              // (o roadmap identifica por nome; sem nome não há como referenciar)
              const options = features
                .map((other, j) => ({ other, j }))
                .filter(({ other, j }) => j !== i && other.name.trim() !== "");
              if (options.length === 0) {
                return <small className="hint">(nenhuma outra feature nomeada)</small>;
              }
              return options.map(({ other, j }) => (
                <label key={j} className="dep">
                  <input
                    type="checkbox"
                    aria-label={`Feature ${i + 1} depende de ${other.name}`}
                    checked={f.dependsOn.includes(other.name)}
                    onChange={() => toggleDep(i, other.name)}
                  />
                  {other.name}
                </label>
              ));
            })()}
            </div>
          </div>

          <button
            type="button"
            className="btn btn--danger"
            aria-label={`Remover feature ${i + 1}`}
            onClick={() => onChange(features.filter((_, j) => j !== i))}
          >
            Remover
          </button>
        </fieldset>
      ))}

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => onChange([...features, { name: "", specSeed: "", dependsOn: [] }])}
      >
        Adicionar feature
      </button>
    </div>
  );
}
