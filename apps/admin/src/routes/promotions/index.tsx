import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PROMOTIONS_TABLE_ID } from '@/lib/constants'
import { toPromotions, formatDateTime, formatPrice } from '@/lib/utils'
import type { Promotion } from '@/lib/types'

export const Route = createFileRoute('/promotions/')({
  loader: async () => {
    const result = await cb.database.getData(PROMOTIONS_TABLE_ID, { limit: 1000 })
    const promotions = toPromotions(result.data ?? [])
    promotions.sort((a, b) => a.sort_order - b.sort_order)
    return { promotions }
  },
  component: PromotionsPage,
})

function getStatus(p: Promotion) {
  const now = new Date()
  if (new Date(p.ends_at) < now) return 'ended'
  if (new Date(p.starts_at) > now) return 'upcoming'
  return 'ongoing'
}

function PromotionsPage() {
  const { promotions } = Route.useLoaderData()
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await cb.database.deleteData(PROMOTIONS_TABLE_ID, deleteTarget.id)
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
        <h1 className="text-2xl font-bold">프로모션 관리</h1>
        <Link
          to="/promotions/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          프로모션 생성
        </Link>
      </div>

      {promotions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          등록된 프로모션이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">제목</th>
                <th className="text-center px-4 py-3 font-medium">할인</th>
                <th className="text-center px-4 py-3 font-medium">대상</th>
                <th className="text-center px-4 py-3 font-medium">기간</th>
                <th className="text-center px-4 py-3 font-medium">상태</th>
                <th className="text-right px-4 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => {
                const status = getStatus(promo)
                return (
                  <tr key={promo.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{promo.title}</p>
                      {promo.description && <p className="text-xs text-gray-400">{promo.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                        {promo.discount_type === 'percent'
                          ? `${promo.discount_value}%`
                          : formatPrice(promo.discount_value)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {promo.target_type === 'all' && '전체'}
                      {promo.target_type === 'category' && promo.target_value}
                      {promo.target_type === 'products' && `${promo.product_ids?.length || 0}개 상품`}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400">
                      {formatDateTime(promo.starts_at)}
                      <br />
                      ~ {formatDateTime(promo.ends_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          status === 'ongoing'
                            ? 'bg-green-50 text-green-600'
                            : status === 'upcoming'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {status === 'ongoing' ? '진행중' : status === 'upcoming' ? '예정' : '종료'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to="/promotions/$promotionId/edit"
                          params={{ promotionId: promo.id }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(promo)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold mb-2">프로모션 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{deleteTarget.title}</strong> 프로모션을 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
