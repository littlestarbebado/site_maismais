import { useState, type ReactNode } from 'react';

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <span aria-hidden="true" className="arrow">
      {diagonal ? '↗' : '→'}
    </span>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function PrivacyNote() {
  return (
    <p className="privacy-note">
      Os dados recolhidos serão utilizados exclusivamente para fins de convívio e eventual repetição
      da experiência.
    </p>
  );
}
export function Honeypot() {
  return (
    <div className="honeypot" aria-hidden="true">
      <label>
        Deixa este campo vazio
        <input name="bot-field" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="form-error" role="alert">
      {message}
    </p>
  ) : null;
}
export function DownloadButton({
  onDownload,
  children,
}: {
  onDownload: () => Promise<void>;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <button
        className="text-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await onDownload();
          } catch {
            setError('Não foi possível guardar a imagem. Tenta novamente.');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'A preparar a imagem…' : children} <span aria-hidden="true">↓</span>
      </button>
      <ErrorMessage message={error} />
    </div>
  );
}
