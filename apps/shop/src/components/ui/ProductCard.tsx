import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useWishlist } from '@/hooks/useWishlist'
import { useI18n } from '@/hooks/useI18n'
import { getProductName } from '@/lib/i18n/getLocalizedField'
import type { Product } from '@/lib/types'

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const isSoldOut = product.stock === 0
  const { toggle, has } = useWishlist()
  const { locale } = useI18n()
  const isWished = has(product.id)
  const localizedName = getProductName(product, locale)

  return (
    <div className="group relative">
      <Link
        to="/products/$productId"
        params={{ productId: product.id }}
        className="block"
      >
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm relative">
          <img
            src={product.image}
            alt={localizedName}
            loading="lazy"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isSoldOut ? 'opacity-50' : ''}`}
          />
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-3 py-1.5 bg-black/70 text-white text-xs font-medium rounded-sm">
                SOLD OUT
              </span>
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className={`text-sm truncate ${isSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>
            {localizedName}
          </p>
          <p className={`text-sm font-bold mt-1 ${isSoldOut ? 'text-gray-400' : ''}`}>
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle(product.id)
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'
          }`}
        />
      </button>
    </div>
  )
}
