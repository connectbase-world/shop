import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, ShoppingBag, Heart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useI18n } from '@/hooks/useI18n'
import { getProductName, getProductDescription } from '@/lib/i18n/getLocalizedField'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import { ShareButtons } from '@/components/product/ShareButtons'
import { trackAddToCart } from '@/lib/analytics'
import type { Product, ProductVariant } from '@/lib/types'

type ProductInfoProps = {
  product: Product
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const { addItem } = useCart()
  const { toggle, has } = useWishlist()
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const localizedName = getProductName(product, locale)
  const localizedDescription = getProductDescription(product, locale)

  const hasOptions = product.options && product.options.length > 0 && product.variants && product.variants.length > 0
  const allOptionsSelected = hasOptions
    ? product.options!.every((opt) => selectedOptions[opt.name])
    : true

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!hasOptions || !allOptionsSelected) return null
    return product.variants!.find((v) =>
      Object.entries(selectedOptions).every(([k, val]) => v.options[k] === val),
    ) ?? null
  }, [hasOptions, allOptionsSelected, selectedOptions, product.variants])

  const currentPrice = hasOptions && selectedVariant
    ? product.price + selectedVariant.additional_price
    : product.price

  const currentStock = hasOptions
    ? (selectedVariant?.stock ?? 0)
    : product.stock

  const isSoldOut = hasOptions
    ? (allOptionsSelected ? currentStock === 0 : product.variants!.every((v) => v.stock === 0))
    : product.stock === 0

  const canPurchase = !isSoldOut && (!hasOptions || (allOptionsSelected && currentStock > 0))
  const isWished = has(product.id)

  const handleSelectOption = (optName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optName]: value }))
    setQuantity(1)
  }

  const handleAddToCart = () => {
    if (!canPurchase) return
    addItem(product, quantity, hasOptions ? selectedOptions : undefined)
    trackAddToCart({ id: product.id, name: product.name, category: product.category, price: currentPrice }, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    if (!canPurchase) return
    const translations = product.translations
      ? Object.fromEntries(
          Object.entries(product.translations).map(([loc, t]) => [loc, { name: t?.name }]),
        )
      : undefined
    const buyNowItem = {
      productId: product.id,
      name: product.name,
      price: currentPrice,
      image: product.image,
      quantity,
      category: product.category,
      translations,
      selectedOptions: hasOptions ? selectedOptions : undefined,
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
                {t.common.soldOut}
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
        <h1 className="text-2xl font-bold">{localizedName}</h1>
      </div>

      <p className="text-2xl font-bold">{formatPrice(currentPrice)}</p>

      {localizedDescription && (
        <p className="text-sm text-gray-600 leading-relaxed">
          {localizedDescription}
        </p>
      )}

      {/* 옵션 선택 */}
      {hasOptions && (
        <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
          {product.options!.map((opt) => (
            <div key={opt.name}>
              <span className="text-sm text-gray-600 mb-2 block">{opt.name}</span>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((val) => {
                  const isSelected = selectedOptions[opt.name] === val
                  // Check if this value has any stock in any variant
                  const hasStock = product.variants!.some((v) => {
                    if (v.options[opt.name] !== val) return false
                    // Check other selected options match
                    return Object.entries(selectedOptions).every(([k, sv]) =>
                      k === opt.name || v.options[k] === sv || !selectedOptions[k],
                    ) && v.stock > 0
                  })
                  return (
                    <button
                      key={val}
                      onClick={() => handleSelectOption(opt.name, val)}
                      disabled={!hasStock}
                      className={`px-4 py-2 text-sm border transition-colors ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : hasStock
                            ? 'border-gray-200 hover:border-gray-400'
                            : 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                      }`}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {selectedVariant && selectedVariant.additional_price > 0 && (
            <p className="text-xs text-gray-500">
              추가 금액: +{formatPrice(selectedVariant.additional_price)}
            </p>
          )}
        </div>
      )}

      {canPurchase && (
        <div className={`${hasOptions ? '' : 'border-t border-gray-100 pt-6'} flex flex-col gap-4`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t.common.quantity}</span>
            <QuantitySelector
              quantity={quantity}
              onChange={setQuantity}
              max={currentStock}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t.product.totalPrice}</span>
            <span className="font-bold text-lg">
              {formatPrice(currentPrice * quantity)}
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
            {t.product.soldOutMessage}
          </button>
        </div>
      ) : !allOptionsSelected && hasOptions ? (
        <div>
          <button
            disabled
            className="w-full py-4 bg-gray-200 text-gray-500 text-sm font-medium cursor-not-allowed"
          >
            옵션을 선택해주세요
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <button
            className="w-full py-4 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            onClick={handleBuyNow}
          >
            {t.product.buyNow}
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
                {t.product.addedToCart}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                {t.product.addToCart}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 공유 */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <ShareButtons title={localizedName} />
      </div>
    </div>
  )
}
