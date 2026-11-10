import { createContext } from 'react'
import type { AuthSession, SessionUser } from '../types/domain'

export interface AuthContextValue {
  session: AuthSession | null
  user: SessionUser | null
  login: (email: string, password: string) => Promise<AuthSession>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
