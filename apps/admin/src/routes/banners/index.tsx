import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BANNERS_TABLE_ID } from '@/lib/constants'
import { toBanners, formatDateTime } from '@/lib/utils'
import type { Banner } from '@/lib/types'

export const Route = createFileRoute('/banners/')({
  loader: async () => {
    const result = await cb.database.getData(BANNERS_TABLE_ID, { limit: 1000 })
    const banners = toBanners(result.data ?? [])
    banners.sort((a, b) => a.sort_order - b.sort_order)
    return { banners }
  },
  component: BannersPage,
})

function BannersPage() {
  const { banners } = Route.useLoaderData()
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await cb.database.deleteData(BANNERS_TABLE_ID, deleteTarget.id)
      setDeleteTarget(null)
      router.invalidate()
    } catch {
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const positionLabel = (p: string) => {
    if (p === 'hero') return '히어로'
    if (p === 'promotion') return '프로모션'
    return '팝업'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">배너 관리</h1>
        <Link
          to="/banners/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          배너 생성
        </Link>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          등록된 배너가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">이미지</th>
                <th className="text-left px-4 py-3 font-medium">제목</th>
                <th className="text-center px-4 py-3 font-medium">위치</th>
                <th className="text-center px-4 py-3 font-medium">순서</th>
                <th className="text-center px-4 py-3 font-medium">상태</th>
                <th className="text-center px-4 py-3 font-medium">기간</th>
                <th className="text-right px-4 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img src={banner.image} alt="" className="w-20 h-12 object-cover rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{banner.title}</p>
                    {banner.subtitle && <p className="text-xs text-gray-400">{banner.subtitle}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {positionLabel(banner.position)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{banner.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${banner.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {banner.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">
                    {banner.starts_at && formatDateTime(banner.starts_at)}
                    {banner.starts_at && banner.ends_at && ' ~ '}
                    {banner.ends_at && formatDateTime(banner.ends_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/banners/$bannerId/edit"
                        params={{ bannerId: banner.id }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(banner)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold mb-2">배너 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{deleteTarget.title}</strong> 배너를 삭제하시겠습니까?
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
