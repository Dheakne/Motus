interface ErrorBoxProps {
  error: unknown;
  onRetry?: () => void;
}

/** Caixa de erro padrão das telas, com botão de tentar de novo. */
export function ErrorBox({ error, onRetry }: ErrorBoxProps) {
  const message = error instanceof Error ? error.message : 'Erro inesperado';
  return (
    <div className="error-card" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return <p className="muted loading-text">{label}</p>;
}
