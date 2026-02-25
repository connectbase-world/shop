import { createFileRoute } from '@tanstack/react-router'
import { useCart } from '@/hooks/useCart'
import { useI18n } from '@/hooks/useI18n'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { EmptyState } from '@/components/ui/EmptyState'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } =
    useCart()
  const { t } = useI18n()

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-8">{t.cart.title}</h1>
        <EmptyState
          title={t.cart.empty}
          description={t.cart.emptyDescription}
          actionLabel={t.cart.goShopping}
          actionTo="/products"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">{t.cart.title} ({totalItems})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
        <div>
          {items.map((item, idx) => (
            <CartItem
              key={`${item.productId}-${JSON.stringify(item.selectedOptions ?? {})}-${idx}`}
              item={item}
              onUpdateQuantity={(qty) =>
                updateQuantity(item.productId, qty, item.selectedOptions)
              }
              onRemove={() => removeItem(item.productId, item.selectedOptions)}
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
