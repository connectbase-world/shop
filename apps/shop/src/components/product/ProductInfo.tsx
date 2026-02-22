import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, ShoppingBag, Heart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import type { Product } from '@/lib/types'

type ProductInfoProps = {
  product: Product
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()
  const { toggle, has } = useWishlist()
  const navigate = useNavigate()

  const isSoldOut = product.stock === 0
  const isWished = has(product.id)

  const handleAddToCart = () => {
    if (isSoldOut) return
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    if (isSoldOut) return
    const buyNowItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      category: product.category,
    }
    localStorage.setItem('buyNow_item', JSON.stringify(buyNowItem))
    navigate({ to: '/checkout', search: { buyNow: 'true' } })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">{product.category}</p>
            {isSoldOut && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                품절
              </span>
            )}
          </div>
          <button
            onClick={() => toggle(product.id)}
            className="p-1.5 hover:bg-gray-50 rounded-full transition-colors"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isWished ? 'fill-red-500 text-red-500' : 'text-gray-300'
              }`}
            />
          </button>
        </div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
      </div>

      <p className="text-2xl font-bold">{formatPrice(product.price)}</p>

      {product.description && (
        <p className="text-sm text-gray-600 leading-relaxed">
          {product.description}
        </p>
      )}

      {!isSoldOut && (
        <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">수량</span>
            <QuantitySelector
              quantity={quantity}
              onChange={setQuantity}
              max={product.stock}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">총 상품 금액</span>
            <span className="font-bold text-lg">
              {formatPrice(product.price * quantity)}
            </span>
          </div>
        </div>
      )}

      {isSoldOut ? (
        <div className="border-t border-gray-100 pt-6">
          <button
            disabled
            className="w-full py-4 bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
          >
            품절된 상품입니다
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <button
            className="w-full py-4 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            onClick={handleBuyNow}
          >
            바로구매
          </button>
          <button
            className={`w-full py-4 text-sm font-medium border transition-colors ${
              added
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-black border-gray-200 hover:bg-gray-50'
            }`}
            onClick={handleAddToCart}
          >
            {added ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                장바구니에 담았습니다
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                장바구니 담기
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
