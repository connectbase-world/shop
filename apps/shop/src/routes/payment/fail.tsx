import { createFileRoute, Link } from '@tanstack/react-router'
import { XCircle } from 'lucide-react'

type PaymentFailSearch = {
  code?: string
  message?: string
}

export const Route = createFileRoute('/payment/fail')({
  validateSearch: (search: Record<string, unknown>): PaymentFailSearch => ({
    code: search.code as string | undefined,
    message: search.message as string | undefined,
  }),
  component: PaymentFailPage,
})

function PaymentFailPage() {
  const { code, message } = Route.useSearch()

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
      <h1 className="text-2xl font-bold mb-2">결제에 실패했습니다</h1>
      {message && (
        <p className="text-sm text-gray-600 mb-1">{message}</p>
      )}
      {code && (
        <p className="text-xs text-gray-400 mb-8">에러 코드: {code}</p>
      )}
      {!code && !message && (
        <p className="text-sm text-gray-600 mb-8">
          결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.
        </p>
      )}
      <div className="flex justify-center gap-4">
        <Link
          to="/cart"
          className="inline-block px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          다시 시도
        </Link>
        <Link
          to="/"
          className="inline-block px-8 py-3 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}
