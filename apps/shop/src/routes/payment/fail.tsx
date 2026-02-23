import { createFileRoute, Link } from '@tanstack/react-router'
import { XCircle } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'

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
  const { t } = useI18n()

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
      <h1 className="text-2xl font-bold mb-2">{t.payment.failedTitle}</h1>
      {message && (
        <p className="text-sm text-gray-600 mb-1">{message}</p>
      )}
      {code && (
        <p className="text-xs text-gray-400 mb-8">{t.payment.errorCode.replace('{code}', code)}</p>
      )}
      {!code && !message && (
        <p className="text-sm text-gray-600 mb-8">
          {t.payment.failedDescription}
        </p>
      )}
      <div className="flex justify-center gap-4">
        <Link
          to="/cart"
          className="inline-block px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          {t.payment.retry}
        </Link>
        <Link
          to="/"
          className="inline-block px-8 py-3 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
        >
          {t.payment.goHome}
        </Link>
      </div>
    </div>
  )
}
