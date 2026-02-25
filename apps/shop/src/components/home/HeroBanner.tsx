import { useState, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import type { Banner } from '@/lib/types'

type Props = {
  banners?: Banner[]
}

export function HeroBanner({ banners = [] }: Props) {
  const { t } = useI18n()
  const [current, setCurrent] = useState(0)

  const activeBanners = banners.filter((b) => {
    if (!b.is_active) return false
    const now = new Date()
    if (b.starts_at && new Date(b.starts_at) > now) return false
    if (b.ends_at && new Date(b.ends_at) < now) return false
    return true
  })

  const next = useCallback(() => {
    if (activeBanners.length <= 1) return
    setCurrent((c) => (c + 1) % activeBanners.length)
  }, [activeBanners.length])

  const prev = useCallback(() => {
    if (activeBanners.length <= 1) return
    setCurrent((c) => (c - 1 + activeBanners.length) % activeBanners.length)
  }, [activeBanners.length])

  useEffect(() => {
    if (activeBanners.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, activeBanners.length])

  // DB 배너가 없으면 기본 히어로 표시
  if (activeBanners.length === 0) {
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

  const banner = activeBanners[current]

  const content = (
    <div className="relative min-h-[60vh]">
      <picture>
        {banner.mobile_image && (
          <source media="(max-width: 768px)" srcSet={banner.mobile_image} />
        )}
        <img
          src={banner.image}
          alt={banner.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </picture>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex items-center justify-center min-h-[60vh] text-center px-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3 drop-shadow-lg">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="text-white/90 text-sm md:text-base mb-6 max-w-md mx-auto drop-shadow">
              {banner.subtitle}
            </p>
          )}
          {banner.link_url && (
            <span className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 text-sm hover:bg-gray-100 transition-colors">
              {t.home.shopNow}
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <section className="relative min-h-[60vh] overflow-hidden">
      {banner.link_url ? (
        banner.link_type === 'external' ? (
          <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
            {content}
          </a>
        ) : (
          <Link to={banner.link_url}>{content}</Link>
        )
      ) : (
        content
      )}

      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
