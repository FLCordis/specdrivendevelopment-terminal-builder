"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PROVIDERS,
  getAiConfig,
  saveAiConfig,
  type AiConfig,
  type ProviderId,
} from "@/lib/settings";

export default function SettingsPage() {
  const [provider, setProvider] = useState<ProviderId>("anthropic");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [reveal, setReveal] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getAiConfig().then((cfg) => {
      if (!cfg) return;
      setProvider(cfg.provider);
      setModel(cfg.model);
      setApiKey(cfg.apiKey);
      setBaseUrl(cfg.baseUrl ?? "");
    });
  }, []);

  const meta = PROVIDERS.find((p) => p.id === provider)!;

  function pickProvider(id: ProviderId) {
    setProvider(id);
    const m = PROVIDERS.find((p) => p.id === id)!;
    if (!m.models.includes(model)) setModel(m.models[0]);
    setSaved(false);
  }

  async function onSave() {
    const cfg: AiConfig = {
      provider,
      model: model.trim() || meta.models[0],
      apiKey: apiKey.trim(),
      ...(provider === "custom" ? { baseUrl: baseUrl.trim() } : {}),
    };
    await saveAiConfig(cfg);
    setSaved(true);
  }

  return (
    <div className="app">
      <header className="cmdbar">
        <Link href="/" className="btn btn--ghost">← projetos</Link>
        <span className="cmdbar__prompt">
          forge ▸ <b>configurações</b>
        </span>
        <span className="cmdbar__sp" />
        <span className="eyebrow">
          {apiKey ? <span className="badge-ok">● IA conectada</span> : <span className="badge-off">○ IA desligada</span>}
        </span>
      </header>

      <main className="page">
        <div className="page__head">
          <p className="eyebrow">assistente de IA</p>
          <h1>Configure sua IA</h1>
          <p>
            Escolha o provedor e cole sua chave. Ela fica salva{" "}
            <b>só no seu navegador</b> (IndexedDB) e é usada apenas para os
            botões ✨ de sugestão no formulário. O app funciona 100% sem isso.
          </p>
        </div>

        <div className="panel">
          <div className="field">
            <span className="field__label">Provedor</span>
            <select
              className="select"
              aria-label="Provedor de IA"
              value={provider}
              onChange={(e) => pickProvider(e.target.value as ProviderId)}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="row">
            <div className="field">
              <span className="field__label">Modelo</span>
              <input
                className="input"
                aria-label="Modelo"
                list="model-options"
                value={model}
                placeholder={meta.models[0]}
                onChange={(e) => { setModel(e.target.value); setSaved(false); }}
              />
              <datalist id="model-options">
                {meta.models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              <small className="hint">Sugeridos para {meta.label}. Pode digitar outro.</small>
            </div>
          </div>

          {provider === "custom" ? (
            <div className="field">
              <span className="field__label">Base URL (compatível com OpenAI)</span>
              <input
                className="input"
                aria-label="Base URL"
                placeholder="https://api.groq.com/openai/v1"
                value={baseUrl}
                onChange={(e) => { setBaseUrl(e.target.value); setSaved(false); }}
              />
            </div>
          ) : null}

          <div className="field">
            <span className="field__label">Chave de API</span>
            <div className="inline-key">
              <input
                className="input"
                aria-label="Chave de API"
                type={reveal ? "text" : "password"}
                placeholder={meta.keyHint}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
              />
              <button type="button" className="btn" onClick={() => setReveal((r) => !r)}>
                {reveal ? "ocultar" : "mostrar"}
              </button>
            </div>
          </div>

          <div className="field__foot" style={{ marginTop: 18 }}>
            {saved ? <span className="saved">✓ salvo</span> : <span className="hint">alterações não salvas</span>}
            <button type="button" className="btn btn--primary" onClick={onSave}>
              Salvar configuração
            </button>
          </div>
        </div>

        <p className="note">
          Nota de privacidade: a chave é enviada apenas ao endpoint deste app
          (<code>/api/assist</code>) no momento da sugestão, para chamar o
          provedor no servidor e evitar CORS. Nada é compartilhado além disso.
        </p>
      </main>
    </div>
  );
}
