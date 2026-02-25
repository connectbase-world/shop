import { useState, useEffect } from 'react'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID } from '@/lib/constants'
import { toProducts } from '@/lib/utils'
import { ProductCard } from '@/components/ui/ProductCard'
import { useRecentProducts } from '@/hooks/useRecentProducts'
import { useI18n } from '@/hooks/useI18n'
import type { Product } from '@/lib/types'

type Props = {
  excludeId?: string
}

export function RecentProducts({ excludeId }: Props) {
  const { t } = useI18n()
  const { getRecentIds } = useRecentProducts()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const ids = getRecentIds().filter((id) => id !== excludeId)
    if (ids.length === 0) return

    const fetch = async () => {
      try {
        const result = await cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 })
        const all = toProducts(result.data ?? [])
        const ordered = ids
          .map((id) => all.find((p) => p.id === id))
          .filter((p): p is Product => !!p)
          .slice(0, 6)
        setProducts(ordered)
      } catch { /* ignore */ }
    }
    fetch()
  }, [getRecentIds, excludeId])

  if (products.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-bold mb-6">{t.product.recentlyViewed}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
