import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID } from '@/lib/constants'
import { ProductForm } from '@/components/products/ProductForm'
import type { ProductFormData } from '@/components/products/ProductForm'

export const Route = createFileRoute('/products/new')({
  component: NewProductPage,
})

function NewProductPage() {
  const navigate = useNavigate()

  const handleSubmit = async (data: ProductFormData) => {
    await cb.database.createData(PRODUCTS_TABLE_ID, { data })
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
        <h1 className="text-2xl font-bold">상품 등록</h1>
      </div>
      <ProductForm onSubmit={handleSubmit} submitLabel="등록" />
    </div>
  )
}
