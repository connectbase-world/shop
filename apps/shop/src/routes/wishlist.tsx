import { createFileRoute, Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID } from '@/lib/constants'
import { toProducts } from '@/lib/utils'
import { useWishlist } from '@/hooks/useWishlist'
import { useI18n } from '@/hooks/useI18n'
import { ProductCard } from '@/components/ui/ProductCard'
import type { Product } from '@/lib/types'

export const Route = createFileRoute('/wishlist')({
  component: WishlistPage,
  loader: async () => {
    const result = await cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 })
    const products = toProducts(result.data ?? [])
    return { products }
  },
})

function WishlistPage() {
  const { products } = Route.useLoaderData()
  const { items: wishlistIds } = useWishlist()
  const { t } = useI18n()

  const wishlistProducts: Product[] = wishlistIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">{t.wishlist.title}</h1>
      <p className="text-sm text-gray-500 mb-8">
        {t.product.itemCount.replace('{count}', String(wishlistProducts.length))}
      </p>

      {wishlistProducts.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-sm mb-4">{t.wishlist.empty}</p>
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            {t.cart.goShopping}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
