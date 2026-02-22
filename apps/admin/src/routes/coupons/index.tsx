import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Plus, Search, Pencil, Trash2, Copy } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { COUPONS_TABLE_ID } from '@/lib/constants'
import { toCoupons, formatPrice, formatDiscount, formatDate } from '@/lib/utils'
import type { Coupon } from '@/lib/types'

export const Route = createFileRoute('/coupons/')({
  loader: async () => {
    const result = await cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 })
    const coupons = toCoupons(result.data ?? [])
    return { coupons }
  },
  component: CouponsPage,
})

function getCouponStatus(c: Coupon): { label: string; color: string } {
  if (!c.is_active) return { label: '비활성', color: 'bg-gray-100 text-gray-600' }
  const now = new Date()
  if (now > new Date(c.expires_at)) return { label: '만료됨', color: 'bg-red-50 text-red-600' }
  if (now < new Date(c.starts_at)) return { label: '예정', color: 'bg-blue-50 text-blue-600' }
  if (c.total_quantity !== -1 && c.issued_count >= c.total_quantity)
    return { label: '소진', color: 'bg-orange-50 text-orange-600' }
  return { label: '활성', color: 'bg-green-50 text-green-600' }
}

function getTargetLabel(c: Coupon): string {
  if (c.target_type === 'all') return '전체'
  if (c.target_type === 'category') return c.target_value || '카테고리'
  return '특정 상품'
}

function CouponsPage() {
  const { coupons: initialCoupons } = Route.useLoaderData()
  const router = useRouter()
  const [coupons, setCoupons] = useState(initialCoupons)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const now = new Date()
  const activeCoupons = coupons.filter(
    (c) => c.is_active && now >= new Date(c.starts_at) && now <= new Date(c.expires_at),
  )
  const totalIssued = coupons.reduce((s, c) => s + c.issued_count, 0)
  const totalUsed = coupons.reduce((s, c) => s + c.used_count, 0)

  const filtered = coupons.filter((c) => {
    if (search) {
      const q = search.toLowerCase()
      if (!c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false
    }
    if (filter === 'active') {
      return c.is_active && now >= new Date(c.starts_at) && now <= new Date(c.expires_at)
    }
    if (filter === 'expired') return now > new Date(c.expires_at)
    if (filter === 'inactive') return !c.is_active
    return true
  })

  const handleDelete = async (id: string) => {
    if (!confirm('이 쿠폰을 삭제하시겠습니까?')) return
    setDeleting(id)
    try {
      await cb.database.deleteData(COUPONS_TABLE_ID, id)
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    await cb.database.updateData(COUPONS_TABLE_ID, coupon.id, {
      data: { is_active: !coupon.is_active },
    })
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c)),
    )
  }

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(
      `https://019c852d-4741-7765-a06a-70acf93fb09b.web.connectbase.world/coupon/${code}`,
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">쿠폰 관리</h1>
        <Link
          to="/coupons/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          쿠폰 등록
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '전체 쿠폰', value: coupons.length },
          { label: '활성 쿠폰', value: activeCoupons.length },
          { label: '총 발급', value: totalIssued },
          { label: '총 사용', value: totalUsed },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-md p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* 필터 + 검색 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 코드 검색"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'expired', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? '전체' : f === 'active' ? '활성' : f === 'expired' ? '만료' : '비활성'}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">쿠폰</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">코드</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">할인</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">범위</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">발급/사용</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">기간</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">액션</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  {search || filter !== 'all' ? '검색 결과가 없습니다' : '등록된 쿠폰이 없습니다'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const status = getCouponStatus(c)
                return (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name}</p>
                      {c.is_auto_issue && (
                        <span className="text-xs text-blue-600">자동 발급</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{c.code}</code>
                        <button
                          onClick={() => handleCopyLink(c.code)}
                          className="p-0.5 text-gray-400 hover:text-gray-600"
                          title="쿠폰 링크 복사"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDiscount(c)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getTargetLabel(c)}</td>
                    <td className="px-4 py-3 text-center text-sm">
                      {c.issued_count}/{c.total_quantity === -1 ? '∞' : c.total_quantity}
                      <span className="text-gray-400 mx-1">·</span>
                      {c.used_count}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`text-xs px-2 py-0.5 rounded-full ${status.color} cursor-pointer`}
                      >
                        {status.label}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(c.starts_at)} ~ {formatDate(c.expires_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to="/coupons/$couponId/edit"
                          params={{ couponId: c.id }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
