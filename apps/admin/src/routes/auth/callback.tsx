import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

function AuthCallbackPage() {
  useEffect(() => {
    cb.oauth.getCallbackResult()

    // 팝업으로 열린 경우: SDK가 부모 창에 결과 전달 후 팝업 닫기
    if (window.opener) {
      window.close()
      return
    }

    // 리다이렉트 방식 폴백: 메인으로 이동
    window.location.href = '/'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}
