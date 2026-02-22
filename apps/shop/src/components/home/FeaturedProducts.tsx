import { ProductCard } from '@/components/ui/ProductCard'
import type { Product } from '@/lib/types'

type FeaturedProductsProps = {
  products: Product[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-lg font-bold mb-8">추천 상품</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
