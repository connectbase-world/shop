import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID } from '@/lib/constants'
import { toProduct } from '@/lib/utils'
import { ProductForm } from '@/components/products/ProductForm'
import type { ProductFormData } from '@/components/products/ProductForm'

export const Route = createFileRoute('/products/$productId/edit')({
  loader: async ({ params }) => {
    const result = await cb.database.getDataById(PRODUCTS_TABLE_ID, params.productId)
    const product = toProduct(result)
    return { product }
  },
  component: EditProductPage,
})

function EditProductPage() {
  const { product } = Route.useLoaderData()
  const { productId } = Route.useParams()
  const navigate = useNavigate()

  const initialData: ProductFormData = {
    name: product.name,
    price: product.price,
    description: product.description,
    image: product.image,
    images: product.images ?? [],
    detail_images: product.detail_images ?? [],
    category: product.category,
    is_featured: product.is_featured,
    stock: product.stock,
    translations: product.translations,
  }

  const handleSubmit = async (data: ProductFormData) => {
    await cb.database.updateData(PRODUCTS_TABLE_ID, productId, { data })
    navigate({ to: '/products' })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/products"
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">상품 수정</h1>
      </div>
      <ProductForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="저장"
      />
    </div>
  )
}
