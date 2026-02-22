import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import type { CartItem as CartItemType } from '@/lib/types'

type CartItemProps = {
  item: CartItemType
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 py-6 border-b border-gray-100">
      <Link
        to="/products/$productId"
        params={{ productId: item.productId }}
        className="w-20 h-24 md:w-24 md:h-30 bg-gray-100 rounded-sm overflow-hidden shrink-0"
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </Link>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex justify-between gap-2">
          <Link
            to="/products/$productId"
            params={{ productId: item.productId }}
            className="text-sm font-medium truncate hover:underline"
          >
            {item.name}
          </Link>
          <button
            className="shrink-0 p-1 text-gray-400 hover:text-gray-900 transition-colors"
            onClick={onRemove}
            aria-label="삭제"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <QuantitySelector
            quantity={item.quantity}
            onChange={onUpdateQuantity}
          />
          <p className="text-sm font-bold">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  )
}
