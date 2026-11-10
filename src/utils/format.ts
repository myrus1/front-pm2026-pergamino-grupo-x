const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? Number(value) : value
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '—'
  }
  return currencyFormatter.format(amount)
}

/** Formatea fechas ISO (yyyy-MM-dd o ISO con hora) en es-AR sin corrimientos de zona. */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return `${day}/${month}/${year}`
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleDateString('es-AR')
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

/** Fecha de hoy en formato yyyy-MM-dd (zona local), comparable con las fechas del backend. */
export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** true si `value` (fecha ISO) es hoy o anterior. */
export function isTodayOrPast(value: string): boolean {
  return value.slice(0, 10) <= todayISO()
}

/** true si ambas fechas ISO caen en el mismo año y mes. */
export function isSameMonth(first: string, second: string): boolean {
  return first.slice(0, 7) === second.slice(0, 7)
}
