"use client";
import { useEffect } from "react";

/** Slide-over da direita com a prévia ao vivo dos arquivos gerados. */
export function PreviewDrawer({
  open, onClose, children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label="Prévia dos arquivos gerados">
      <button type="button" className="drawer__backdrop" aria-label="Fechar prévia" onClick={onClose} />
      <div className="drawer__panel">
        <div className="drawer__head">
          <span className="eyebrow">prévia ao vivo</span>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            fechar ✕
          </button>
        </div>
        <div className="drawer__body">{children}</div>
      </div>
    </div>
  );
}
