import { createFileRoute, Link } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'
import { PROMOTIONS_TABLE_ID, PRODUCTS_TABLE_ID } from '@/lib/constants'
import { toPromotions, toProducts, formatPrice, getDiscountedPrice } from '@/lib/utils'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { ProductCard } from '@/components/ui/ProductCard'
import { useI18n } from '@/hooks/useI18n'
import { Zap } from 'lucide-react'

export const Route = createFileRoute('/promotions/')({
  component: PromotionsListPage,
  loader: async () => {
    const [promoResult, productResult] = await Promise.all([
      cb.database.getData(PROMOTIONS_TABLE_ID, { limit: 100 }),
      cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 }),
    ])
    const now = new Date()
    const promotions = toPromotions(promoResult.data ?? [])
      .filter(
        (p) =>
          p.is_active &&
          new Date(p.starts_at) <= now &&
          new Date(p.ends_at) >= now,
      )
      .sort((a, b) => a.sort_order - b.sort_order)
    const products = toProducts(productResult.data ?? [])
    return { promotions, products }
  },
})

function PromotionsListPage() {
  const { promotions, products } = Route.useLoaderData()
  const { t } = useI18n()

  if (promotions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center text-gray-400 text-sm">
          {t.promotion.noPromotions}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <Zap className="w-6 h-6" />
        {t.promotion.title}
      </h1>

      <div className="flex flex-col gap-12">
        {promotions.map((promo) => {
          const targetProducts = products.filter((p) => {
            if (promo.target_type === 'all') return true
            if (promo.target_type === 'category') return p.category === promo.target_value
            if (promo.target_type === 'products') return promo.product_ids?.includes(p.id)
            return false
          })

          return (
            <section key={promo.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold">{promo.title}</h2>
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                      {promo.discount_type === 'percent'
                        ? `${promo.discount_value}% OFF`
                        : `${formatPrice(promo.discount_value)} OFF`}
                    </span>
                  </div>
                  {promo.description && (
                    <p className="text-sm text-gray-500">{promo.description}</p>
                  )}
                </div>
                <CountdownTimer targetDate={promo.ends_at} label={t.promotion.endsIn} />
              </div>

              {targetProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8">
                  {targetProducts.slice(0, 8).map((p) => (
                    <ProductCard key={p.id} product={p} promotion={promo} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  대상 상품이 없습니다.
                </p>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
