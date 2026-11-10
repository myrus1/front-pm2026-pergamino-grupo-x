interface EmptyStateProps {
  message: string
  hint?: string
}

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {hint && <p className="muted">{hint}</p>}
    </div>
  )
}

export function LoadingState({ message = 'Cargando…' }: { message?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert--error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="button button--ghost button--small" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}
