import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PAGES_TABLE_ID } from '@/lib/constants'
import { toPages, formatDate } from '@/lib/utils'
import type { Page } from '@/lib/types'

export const Route = createFileRoute('/pages/')(
  {
    loader: async () => {
      const result = await cb.database.getData(PAGES_TABLE_ID, { limit: 1000 })
      const pages = toPages(result.data ?? [])
      pages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      return { pages }
    },
    component: PagesPage,
  },
)

function PagesPage() {
  const { pages } = Route.useLoaderData()
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await cb.database.deleteData(PAGES_TABLE_ID, deleteTarget.id)
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
        <h1 className="text-2xl font-bold">페이지 관리</h1>
        <Link
          to="/pages/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          페이지 생성
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          생성된 페이지가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">제목</th>
                <th className="text-left px-4 py-3 font-medium">슬러그</th>
                <th className="text-center px-4 py-3 font-medium">상태</th>
                <th className="text-center px-4 py-3 font-medium">네비</th>
                <th className="text-center px-4 py-3 font-medium w-28">작성일</th>
                <th className="text-right px-4 py-3 font-medium w-24">관리</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium">{page.title}</span>
                    {page.summary && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{page.summary}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">/p/{page.slug}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${page.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {page.is_published ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {page.show_in_nav && (
                      <span className="text-xs text-blue-500">{page.nav_label || page.title}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{formatDate(page.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/pages/$pageId/edit"
                        params={{ pageId: page.id }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(page)}
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

      <p className="text-xs text-gray-400 mt-3">{pages.length}개 페이지</p>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold mb-2">페이지 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{deleteTarget.title}</strong> 페이지를 삭제하시겠습니까?
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
