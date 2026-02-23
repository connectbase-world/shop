import { useState, useCallback } from 'react'
import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { checkAdminSession, adminLogout, checkMemberRole } from '@/lib/adminAuth'
import { cb } from '@/lib/connectbase'
import { Shield, AlertTriangle } from 'lucide-react'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
        <a href="/" className="text-sm text-gray-500 hover:text-gray-900">대시보드로 돌아가기</a>
      </div>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">오류가 발생했습니다</h1>
        <p className="text-sm text-gray-500 mb-4">{error.message}</p>
        <a href="/" className="text-sm text-gray-500 hover:text-gray-900">대시보드로 돌아가기</a>
      </div>
    </div>
  ),
})

function RootComponent() {
  const [authenticated, setAuthenticated] = useState(checkAdminSession)
  const { location } = useRouterState()

  const handleLogout = useCallback(() => {
    adminLogout()
    setAuthenticated(false)
  }, [])

  // OAuth 콜백 경로는 인증 체크 없이 바로 렌더링 (팝업에서 실행됨)
  if (location.pathname === '/auth/callback') {
    return <Outlet />
  }

  if (!authenticated) {
    return <AdminLoginPage onLogin={() => setAuthenticated(true)} />
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <Outlet />
    </AdminLayout>
  )
}

function AdminLoginPage({ onLogin }: { onLogin: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const callbackUrl = `${window.location.origin}/auth/callback`

  const SHOP_URL = 'https://019c852d-4741-7765-a06a-70acf93fb09b.web.connectbase.world'

  const handleOAuth = async (provider: 'google' | 'naver') => {
    setLoading(provider)
    setError('')
    try {
      const result = await cb.oauth.signInWithPopup(provider, callbackUrl)
      const check = await checkMemberRole(result.member_id, result.nickname || '')
      if (check.success) {
        onLogin()
      } else {
        setError(check.error || '관리자 권한이 없습니다.')
      }
    } catch (e) {
      setError(`로그인 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center mb-1">Shop Admin</h1>
          <p className="text-sm text-gray-500 text-center mb-6">관리자 계정으로 로그인하세요</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleOAuth('google')}
              disabled={loading !== null}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading === 'google' ? '로그인 중...' : 'Google로 로그인'}
            </button>

            <button
              onClick={() => handleOAuth('naver')}
              disabled={loading !== null}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-[#03C75A] text-white rounded-md text-sm font-medium hover:bg-[#02b351] transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
              </svg>
              {loading === 'naver' ? '로그인 중...' : 'Naver로 로그인'}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
