import { createContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface AuthContextValue {
  userId: number | null
  login: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  userId: null,
  login: () => {},
  logout: () => {},
})

export function parseUserId(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload.userId ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(() => {
    const t = localStorage.getItem('token')
    if (!t) return null
    const id = parseUserId(t)
    if (id === null) localStorage.removeItem('token')
    return id
  })

  function login(newToken: string) {
    localStorage.setItem('token', newToken)
    setUserId(parseUserId(newToken))
  }

  function logout() {
    localStorage.removeItem('token')
    setUserId(null)
  }

  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  return <AuthContext.Provider value={{ userId, login, logout }}>{children}</AuthContext.Provider>
}
