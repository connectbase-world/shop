import { Link } from '@tanstack/react-router'
import { Zap, ArrowRight } from 'lucide-react'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { useI18n } from '@/hooks/useI18n'
import type { Promotion } from '@/lib/types'

type Props = {
  promotions: Promotion[]
}

export function TimeSale({ promotions }: Props) {
  const { t } = useI18n()

  if (promotions.length === 0) return null

  // 가장 빠르게 종료되는 프로모션을 하이라이트
  const highlight = promotions[0]

  return (
    <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{t.promotion.title}</h2>
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-white/70 text-sm">{highlight.title}</p>
              {highlight.description && (
                <p className="text-white/50 text-xs mt-0.5">{highlight.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-white/50 mb-1">{t.promotion.endsIn}</p>
              <CountdownTimer targetDate={highlight.ends_at} />
            </div>

            {highlight.discount_type === 'percent' && (
              <div className="bg-red-500 px-4 py-2 rounded-lg text-center">
                <p className="text-2xl font-black">{highlight.discount_value}%</p>
                <p className="text-xs font-medium -mt-0.5">OFF</p>
              </div>
            )}

            <Link
              to="/promotions"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-2.5 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors shrink-0"
            >
              {t.promotion.viewProducts}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
