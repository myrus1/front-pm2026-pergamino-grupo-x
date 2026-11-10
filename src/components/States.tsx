interface EmptyStateProps {
  message: string
  hint?: string
}

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 8.5 6.2 5h11.6L20 8.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <path d="M4 12h4l1.5 2h5L16 12h4" />
        </svg>
      </span>
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
