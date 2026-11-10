import { useState } from 'react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="button button--ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="button button--danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}

interface CommentDialogProps {
  title: string
  label: string
  required?: boolean
  busy?: boolean
  confirmLabel?: string
  danger?: boolean
  onConfirm: (comment: string) => void
  onCancel: () => void
}

export function CommentDialog({
  title,
  label,
  required = false,
  busy = false,
  confirmLabel = 'Enviar',
  danger = false,
  onConfirm,
  onCancel,
}: CommentDialogProps) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    if (required && !comment.trim()) {
      setError('Este comentario es obligatorio.')
      return
    }
    onConfirm(comment.trim())
  }

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="button button--ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className={`button ${danger ? 'button--danger' : 'button--primary'}`}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Enviando…' : confirmLabel}
          </button>
        </>
      }
    >
      <label className="field">
        <span className="field__label">{label}</span>
        <textarea
          rows={3}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value)
            setError(null)
          }}
          placeholder={required ? 'Escribí el motivo…' : 'Opcional'}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
    </Modal>
  )
}
