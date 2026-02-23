import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'

export function HeroBanner() {
  const { t } = useI18n()

  return (
    <section className="relative bg-gray-100 flex items-center justify-center min-h-[60vh]">
      <div className="text-center px-4">
        <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-4">
          New Collection
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          2026 S/S
        </h1>
        <p className="text-gray-600 text-sm md:text-base mb-8 max-w-md mx-auto">
          {t.home.heroDescription}
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 text-sm hover:bg-gray-800 transition-colors"
        >
          {t.home.shopNow}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
