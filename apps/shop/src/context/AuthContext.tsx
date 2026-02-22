import { createContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { cb } from '@/lib/connectbase'

type User = {
  memberId: string
  nickname?: string
  provider?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('shop_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('shop_user')
      }
    }
    setLoading(false)
  }, [])

  const logout = useCallback(async () => {
    try {
      await cb.auth.signOut()
    } catch {
      // ignore
    }
    try {
      cb.clearTokens()
    } catch {
      // ignore
    }
    localStorage.removeItem('shop_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
