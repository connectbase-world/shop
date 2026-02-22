import { createFileRoute, Link } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID } from '@/lib/constants'
import { ProductImageGallery } from '@/components/product/ProductImageGallery'
import { ProductInfo } from '@/components/product/ProductInfo'
import { ProductReviews } from '@/components/product/ProductReviews'
import { ProductCard } from '@/components/ui/ProductCard'
import { toProduct, toProducts } from '@/lib/utils'

export const Route = createFileRoute('/products/$productId')({
  component: ProductDetailPage,
  loader: async ({ params }) => {
    if (!PRODUCTS_TABLE_ID) throw new Error('상품을 찾을 수 없습니다')
    const [productResult, allResult] = await Promise.all([
      cb.database.getDataById(PRODUCTS_TABLE_ID, params.productId),
      cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 }),
    ])
    if (!productResult) throw new Error('상품을 찾을 수 없습니다')
    const product = productResult.data ? toProduct(productResult) : productResult
    const allProducts = toProducts(allResult.data ?? [])
    const relatedProducts = allProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4)
    return { product, relatedProducts }
  },
})

function ProductDetailPage() {
  const { product, relatedProducts } = Route.useLoaderData()

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8">
        <Link to="/" className="hover:text-gray-900">
          홈
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-gray-900">
          상품
        </Link>
        <span>/</span>
        <Link
          to="/products"
          search={{ category: product.category }}
          className="hover:text-gray-900"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* 상품 상세 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductImageGallery
          mainImage={product.image}
          images={product.images || []}
          alt={product.name}
        />
        <ProductInfo product={product} />
      </div>

      {/* 상세 이미지 */}
      {product.detail_images && product.detail_images.length > 0 && (
        <div className="mt-16 border-t border-gray-100 pt-12">
          <h2 className="text-lg font-bold mb-8 text-center">상품 상세 정보</h2>
          <div className="flex flex-col items-center">
            {product.detail_images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                alt={`${product.name} 상세 ${i + 1}`}
                className="w-full max-w-3xl"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}

      {/* 리뷰 */}
      <div className="mt-16 border-t border-gray-100 pt-12 max-w-3xl mx-auto">
        <ProductReviews productId={product.id} />
      </div>

      {/* 연관 상품 */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t border-gray-100 pt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">같은 카테고리 추천 상품</h2>
            <Link
              to="/products"
              search={{ category: product.category }}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              더보기
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
