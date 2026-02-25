import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID, CATEGORIES, PRODUCTS_PER_PAGE } from '@/lib/constants'
import { ProductCard } from '@/components/ui/ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { toProducts } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { getCategoryLabel } from '@/lib/i18n'
import { getProductName, getProductDescription } from '@/lib/i18n/getLocalizedField'

type ProductSearch = {
  category?: string
  page?: number
  q?: string
  sort?: string
}

export const Route = createFileRoute('/products/')({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    category: (search.category as string) || undefined,
    page: Number(search.page) || 1,
    q: (search.q as string) || undefined,
    sort: (search.sort as string) || undefined,
  }),
  loaderDeps: ({ search }) => ({ search }),
  component: ProductListPage,
  loader: async ({ deps: { search } }) => {
    if (!PRODUCTS_TABLE_ID) return { products: [], total: 0 }
    const limit = PRODUCTS_PER_PAGE
    const offset = ((search.page || 1) - 1) * limit
    try {
      if (search.category && search.category !== 'all') {
        const result = await cb.database.queryData(PRODUCTS_TABLE_ID, {
          where: {
            field: 'category',
            operator: 'eq',
            value: search.category,
          },
          orderBy: 'created_at',
          orderDirection: 'desc',
          limit,
          offset,
        })
        return {
          products: toProducts(result.rows ?? result.data ?? []),
          total: result.total_rows ?? result.total ?? 0,
        }
      }
      const result = await cb.database.getData(PRODUCTS_TABLE_ID, {
        limit,
        offset,
      })
      return {
        products: toProducts(result.rows ?? result.data ?? []),
        total: result.total_rows ?? result.total ?? 0,
      }
    } catch {
      return { products: [], total: 0 }
    }
  },
})

function ProductListPage() {
  const { products, total } = Route.useLoaderData()
  const { category, page, q, sort } = Route.useSearch()
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const currentPage = page || 1
  const [searchInput, setSearchInput] = useState(q || '')

  const filtered = q
    ? products.filter((p) => {
        const keyword = q.toLowerCase()
        const name = getProductName(p, locale)
        const desc = getProductDescription(p, locale)
        return (
          name.toLowerCase().includes(keyword) ||
          desc?.toLowerCase().includes(keyword)
        )
      })
    : products

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    if (sort === 'name') return a.name.localeCompare(b.name, 'ko')
    // 기본: 최신순 (created_at desc)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const displayTotal = q ? filtered.length : total
  const hasMore = !q && currentPage * PRODUCTS_PER_PAGE < total

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchInput.trim()
    navigate({
      to: '/products',
      search: {
        category,
        q: trimmed || undefined,
      },
    })
  }

  const clearSearch = () => {
    setSearchInput('')
    navigate({
      to: '/products',
      search: { category },
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.common.products}</h1>
        {displayTotal > 0 && (
          <span className="text-sm text-gray-500">
            {t.product.itemCount.replace('{count}', String(displayTotal))}
          </span>
        )}
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.header.searchPlaceholder}
            className="w-full pl-10 pr-10 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => {
          const isActive =
            cat.key === 'all'
              ? !category || category === 'all'
              : category === cat.key
          return (
            <Link
              key={cat.key}
              to="/products"
              search={cat.key === 'all' ? { q } : { category: cat.key, q }}
              className={`px-4 py-2 text-sm whitespace-nowrap rounded-sm transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getCategoryLabel(cat.key, t)}
            </Link>
          )
        })}
      </div>

      {/* 정렬 + 검색 결과 */}
      <div className="flex items-center justify-between mb-6">
        {q ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>"{q}" {t.product.searchResults}</span>
            <button onClick={clearSearch} className="text-xs text-gray-400 hover:text-black underline">
              {t.product.clearSearch}
            </button>
          </div>
        ) : <div />}
        <select
          value={sort || 'latest'}
          onChange={(e) => {
            const v = e.target.value === 'latest' ? undefined : e.target.value
            navigate({ to: '/products', search: { category, q, sort: v } })
          }}
          className="px-3 py-1.5 border border-gray-200 text-sm outline-none bg-white rounded-sm"
        >
          <option value="latest">최신순</option>
          <option value="price_asc">낮은 가격순</option>
          <option value="price_desc">높은 가격순</option>
          <option value="name">이름순</option>
        </select>
      </div>

      {/* 상품 그리드 */}
      {sorted.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-12 text-center">
              <button
                className="px-8 py-3 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
                onClick={() =>
                  navigate({
                    to: '/products',
                    search: { category, page: currentPage + 1, q, sort },
                  })
                }
              >
                {t.common.more}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={q
            ? t.product.noSearchResults.replace('{q}', q)
            : t.product.noProducts}
          description={q
            ? t.product.tryDifferentSearch
            : t.product.tryDifferentCategory}
        />
      )}
    </div>
  )
}
