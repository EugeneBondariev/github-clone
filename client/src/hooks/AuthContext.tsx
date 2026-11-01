import { createContext, useState } from 'react'
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
    return payload.userId ?? null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(() => {
    const t = localStorage.getItem('token')
    return t ? parseUserId(t) : null
  })

  function login(newToken: string) {
    localStorage.setItem('token', newToken)
    setUserId(parseUserId(newToken))
  }

  function logout() {
    localStorage.removeItem('token')
    setUserId(null)
  }

  return (
    <AuthContext.Provider value={{ userId, login, logout }}>{children}</AuthContext.Provider>
  )
}
