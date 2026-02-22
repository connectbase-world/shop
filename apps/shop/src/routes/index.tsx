import { createFileRoute } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID } from '@/lib/constants'
import { HeroBanner } from '@/components/home/HeroBanner'
import { CategorySection } from '@/components/home/CategorySection'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { toProducts } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: async () => {
    if (!PRODUCTS_TABLE_ID) return { featuredProducts: [] }
    try {
      const result = await cb.database.getData(PRODUCTS_TABLE_ID, {
        limit: 8,
        offset: 0,
      })
      return { featuredProducts: toProducts(result.rows ?? result.data ?? []) }
    } catch {
      return { featuredProducts: [] }
    }
  },
})

function HomePage() {
  const { featuredProducts } = Route.useLoaderData()

  return (
    <>
      <HeroBanner />
      <CategorySection />
      <FeaturedProducts products={featuredProducts} />
    </>
  )
}
