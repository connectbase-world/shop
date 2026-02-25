import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { X, Search } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PROMOTIONS_TABLE_ID, PRODUCTS_TABLE_ID, CATEGORIES } from '@/lib/constants'
import { toProducts } from '@/lib/utils'
import type { Promotion, Product } from '@/lib/types'

type Props = {
  promotion?: Promotion
}

export function PromotionForm({ promotion }: Props) {
  const router = useRouter()

  const [title, setTitle] = useState(promotion?.title ?? '')
  const [description, setDescription] = useState(promotion?.description ?? '')
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>(promotion?.discount_type ?? 'percent')
  const [discountValue, setDiscountValue] = useState(promotion?.discount_value ?? 10)
  const [maxDiscount, setMaxDiscount] = useState(promotion?.max_discount ?? 0)
  const [targetType, setTargetType] = useState<'all' | 'category' | 'products'>(promotion?.target_type ?? 'all')
  const [targetValue, setTargetValue] = useState(promotion?.target_value ?? '')
  const [productIds, setProductIds] = useState<string[]>(promotion?.product_ids ?? [])
  const [startsAt, setStartsAt] = useState(promotion?.starts_at ?? '')
  const [endsAt, setEndsAt] = useState(promotion?.ends_at ?? '')
  const [isActive, setIsActive] = useState(promotion?.is_active ?? true)
  const [sortOrder, setSortOrder] = useState(promotion?.sort_order ?? 0)
  const [saving, setSaving] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 }).then((result) => {
      setProducts(toProducts(result.data ?? []))
    })
  }, [])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleProduct = (id: string) => {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startsAt || !endsAt) {
      alert('제목, 시작일, 종료일은 필수입니다.')
      return
    }

    setSaving(true)
    const data = {
      title: title.trim(),
      description: description.trim(),
      image: '',
      discount_type: discountType,
      discount_value: discountValue,
      max_discount: maxDiscount,
      target_type: targetType,
      target_value: targetValue,
      product_ids: targetType === 'products' ? productIds : [],
      starts_at: startsAt,
      ends_at: endsAt,
      is_active: isActive,
      sort_order: sortOrder,
      created_at: promotion?.created_at ?? new Date().toISOString(),
    }

    try {
      if (promotion) {
        await cb.database.updateData(PROMOTIONS_TABLE_ID, promotion.id, { data })
      } else {
        await cb.database.createData(PROMOTIONS_TABLE_ID, { data })
      }
      router.navigate({ to: '/promotions' })
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">프로모션 제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">설명</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">할인 타입 *</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percent')}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            >
              <option value="percent">퍼센트 (%)</option>
              <option value="fixed">정액 (원)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">할인 값 *</label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              min={0}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">최대 할인액</label>
            <input
              type="number"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              min={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">대상 *</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as 'all' | 'category' | 'products')}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            >
              <option value="all">전체 상품</option>
              <option value="category">카테고리</option>
              <option value="products">특정 상품</option>
            </select>
          </div>
          {targetType === 'category' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">카테고리</label>
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              >
                <option value="">선택</option>
                {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {targetType === 'products' && (
          <div>
            <label className="block text-sm font-medium mb-1.5">상품 선택</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명 검색..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              />
            </div>
            {productIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {productIds.map((pid) => {
                  const p = products.find((pr) => pr.id === pid)
                  return (
                    <span
                      key={pid}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs rounded"
                    >
                      {p?.name || pid}
                      <button
                        type="button"
                        onClick={() => toggleProduct(pid)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
              {filteredProducts.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">시작일 *</label>
            <input
              type="datetime-local"
              value={startsAt ? startsAt.slice(0, 16) : ''}
              onChange={(e) => setStartsAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">종료일 *</label>
            <input
              type="datetime-local"
              value={endsAt ? endsAt.slice(0, 16) : ''}
              onChange={(e) => setEndsAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">정렬 순서</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">활성화</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? '저장 중...' : promotion ? '수정' : '생성'}
        </button>
        <button
          type="button"
          onClick={() => router.navigate({ to: '/promotions' })}
          className="px-6 py-2.5 border border-gray-200 text-sm rounded-md hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  )
}
