import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { formatPrice, getDiscountedPrice } from '@/lib/utils'
import { useWishlist } from '@/hooks/useWishlist'
import { useI18n } from '@/hooks/useI18n'
import { getProductName } from '@/lib/i18n/getLocalizedField'
import type { Product, Promotion } from '@/lib/types'

type ProductCardProps = {
  product: Product
  promotion?: Promotion
}

export function ProductCard({ product, promotion }: ProductCardProps) {
  const isSoldOut = product.stock === 0
  const { toggle, has } = useWishlist()
  const { locale } = useI18n()
  const isWished = has(product.id)
  const localizedName = getProductName(product, locale)

  const hasDiscount = !!promotion
  const discountedPrice = promotion
    ? getDiscountedPrice(product.price, promotion)
    : product.price

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
          {hasDiscount && !isSoldOut && promotion.discount_type === 'percent' && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-sm">
                {promotion.discount_value}% OFF
              </span>
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className={`text-sm truncate ${isSoldOut ? 'text-gray-400' : 'text-gray-900'}`}>
            {localizedName}
          </p>
          {hasDiscount && discountedPrice < product.price ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-bold text-red-600">
                {formatPrice(discountedPrice)}
              </p>
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </p>
            </div>
          ) : (
            <p className={`text-sm font-bold mt-1 ${isSoldOut ? 'text-gray-400' : ''}`}>
              {formatPrice(product.price)}
            </p>
          )}
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
