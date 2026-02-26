import { createContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { cb } from '@/lib/connectbase'
import { MEMBERS_TABLE_ID } from '@/lib/constants'
import { trackLogout } from '@/lib/analytics'

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

function isValidUser(data: unknown): data is User {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return typeof obj.memberId === 'string' && obj.memberId.length > 0
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem('shop_user')
      if (!stored) {
        setLoading(false)
        return
      }

      try {
        const parsed = JSON.parse(stored)
        if (!isValidUser(parsed)) {
          localStorage.removeItem('shop_user')
          setLoading(false)
          return
        }

        // members 테이블에 존재하는지 비동기 검증
        setUser(parsed)
        try {
          const result = await cb.database.getData(MEMBERS_TABLE_ID, { limit: 1000 })
          const exists = (result.data ?? []).some(
            (r: { data: Record<string, unknown> }) => r.data.member_id === parsed.memberId,
          )
          if (!exists) {
            localStorage.removeItem('shop_user')
            setUser(null)
          }
        } catch {
          // 네트워크 오류 시 기존 세션 유지
        }
      } catch {
        localStorage.removeItem('shop_user')
      }
      setLoading(false)
    }
    init()
  }, [])

  const logout = useCallback(async () => {
    trackLogout()
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
