import { useCallback, useEffect, useState, type DependencyList } from 'react'

interface ApiResource<T> {
  data: T | null
  error: string | null
  loading: boolean
  reload: () => void
  setData: (value: T | null) => void
}

/** Carga un recurso con estados de carga/error y permite recargarlo. */
export function useApiResource<T>(loader: () => Promise<T>, deps: DependencyList): ApiResource<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    loader()
      .then((result) => {
        if (active) {
          setData(result)
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
    // `loader` se omite a propósito: se controla la recarga con `deps` y `reload`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return { data, error, loading, reload, setData }
}
