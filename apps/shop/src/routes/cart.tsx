import { createFileRoute } from '@tanstack/react-router'
import { useCart } from '@/hooks/useCart'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { EmptyState } from '@/components/ui/EmptyState'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } =
    useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">장바구니</h1>
        <EmptyState
          title="장바구니가 비어있습니다"
          description="마음에 드는 상품을 담아보세요"
          actionLabel="상품 보러가기"
          actionTo="/products"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">장바구니 ({totalItems})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
        <div>
          {items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              onUpdateQuantity={(qty) =>
                updateQuantity(item.productId, qty)
              }
              onRemove={() => removeItem(item.productId)}
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <CartSummary totalPrice={totalPrice} totalItems={totalItems} />
        </div>
      </div>
    </div>
  )
}
