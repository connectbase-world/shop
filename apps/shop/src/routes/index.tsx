import { createFileRoute } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID, BANNERS_TABLE_ID, PROMOTIONS_TABLE_ID } from '@/lib/constants'
import { HeroBanner } from '@/components/home/HeroBanner'
import { CategorySection } from '@/components/home/CategorySection'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { TimeSale } from '@/components/home/TimeSale'
import { toProducts, toBanners, toPromotions } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: async () => {
    try {
      const [productResult, bannerResult, promotionResult] = await Promise.all([
        cb.database.getData(PRODUCTS_TABLE_ID, { limit: 8, offset: 0 }),
        cb.database.getData(BANNERS_TABLE_ID, { limit: 100 }),
        cb.database.getData(PROMOTIONS_TABLE_ID, { limit: 100 }),
      ])
      const banners = toBanners(bannerResult.data ?? [])
        .filter((b) => b.position === 'hero')
        .sort((a, b) => a.sort_order - b.sort_order)
      const now = new Date()
      const promotions = toPromotions(promotionResult.data ?? [])
        .filter(
          (p) =>
            p.is_active &&
            new Date(p.starts_at) <= now &&
            new Date(p.ends_at) >= now,
        )
        .sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime())
      const allProducts = toProducts(productResult.rows ?? productResult.data ?? [])
      return { featuredProducts: allProducts, banners, promotions }
    } catch {
      return { featuredProducts: [], banners: [], promotions: [] }
    }
  },
})

function HomePage() {
  const { featuredProducts, banners, promotions } = Route.useLoaderData()

  return (
    <>
      <HeroBanner banners={banners} />
      {promotions.length > 0 && <TimeSale promotions={promotions} />}
      <CategorySection />
      <FeaturedProducts products={featuredProducts} />
    </>
  )
}
