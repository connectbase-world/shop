import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'
import { registerMember } from '@/lib/registerMember'
import { trackLogin } from '@/lib/analytics'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handle = async () => {
      const result = cb.oauth.getCallbackResult()
      if (result) {
        if (result.error) {
          navigate({ to: '/login' })
        } else {
          localStorage.setItem(
            'shop_user',
            JSON.stringify({
              memberId: result.member_id,
              nickname: result.nickname,
              provider: result.provider,
            }),
          )
          await registerMember(result.member_id, result.nickname || '', result.provider || '')
          trackLogin(result.member_id, result.nickname || '')
          window.location.href = '/'
        }
      } else {
        navigate({ to: '/login' })
      }
    }
    handle()
  }, [navigate])

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-6" />
      <p className="text-gray-600">로그인 처리 중...</p>
    </div>
  )
}
