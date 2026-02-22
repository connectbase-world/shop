import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID, CATEGORIES } from '@/lib/constants'
import { toProducts } from '@/lib/utils'
import { ProductTable } from '@/components/products/ProductTable'
import { DeleteDialog } from '@/components/products/DeleteDialog'
import type { Product } from '@/lib/types'

type ProductsSearch = {
  category?: string
}

export const Route = createFileRoute('/products/')(
  {
    validateSearch: (search: Record<string, unknown>): ProductsSearch => ({
      category: (search.category as string) || undefined,
    }),
    loader: async () => {
      const result = await cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 })
      const products = toProducts(result.data ?? [])
      return { products }
    },
    component: ProductListPage,
  },
)

function ProductListPage() {
  const { products } = Route.useLoaderData()
  const { category } = Route.useSearch()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = products
    .filter((p) => !category || p.category === category)
    .filter(
      (p) =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()),
    )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await cb.database.deleteData(PRODUCTS_TABLE_ID, deleteTarget.id)
      setDeleteTarget(null)
      router.invalidate()
    } catch {
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">상품 관리</h1>
        <Link
          to="/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          상품 등록
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="상품명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              to="/products"
              search={cat.key === 'all' ? {} : { category: cat.label }}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                (cat.key === 'all' && !category) || category === cat.label
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {filtered.length}개 상품
      </p>

      <ProductTable products={filtered} onDelete={setDeleteTarget} />

      {deleteTarget && (
        <DeleteDialog
          productName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
