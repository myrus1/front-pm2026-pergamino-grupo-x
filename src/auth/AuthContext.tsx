import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { login as loginRequest } from '../api/auth'
import { configureApi } from '../api/client'
import type { AuthSession } from '../types/domain'
import { AuthContext, type AuthContextValue } from './context'
import { clearStoredSession, persistSession, readStoredSession } from './storage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession)
  const sessionRef = useRef<AuthSession | null>(session)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const logout = useCallback(() => {
    clearStoredSession()
    sessionRef.current = null
    setSession(null)
  }, [])

  useEffect(() => {
    configureApi(
      () => sessionRef.current?.token ?? null,
      () => {
        clearStoredSession()
        sessionRef.current = null
        setSession(null)
      },
    )
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const nextSession = await loginRequest(email, password)
    // Se actualiza la ref antes del render para que cualquier request inmediata
    // (p. ej. la página de destino al navegar) ya envíe el token nuevo.
    sessionRef.current = nextSession
    persistSession(nextSession)
    setSession(nextSession)
    return nextSession
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
