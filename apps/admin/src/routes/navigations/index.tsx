import { useState } from 'react'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { Plus, Pencil, Trash2, Navigation } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { NAVIGATIONS_TABLE_ID } from '@/lib/constants'
import { toNavigations, formatDate } from '@/lib/utils'
import type { Navigation as Nav } from '@/lib/types'

export const Route = createFileRoute('/navigations/')({
  loader: async () => {
    const result = await cb.database.getData(NAVIGATIONS_TABLE_ID, { limit: 1000 })
    const navigations = toNavigations(result.data ?? [])
    navigations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return { navigations }
  },
  component: NavigationsPage,
})

function NavigationsPage() {
  const { navigations } = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Nav | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 30) || 'nav'
      const result = await cb.database.createData(NAVIGATIONS_TABLE_ID, {
        data: {
          name,
          slug,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      })
      const newId = result?.data?.id
      if (newId) {
        navigate({ to: '/navigations/$navId', params: { navId: newId } })
      } else {
        setName('')
        setShowForm(false)
        router.invalidate()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await cb.database.deleteData(NAVIGATIONS_TABLE_ID, deleteTarget.id)
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
        <h1 className="text-2xl font-bold">네비게이션</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          네비게이션 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">네비게이션 이름 *</label>
            <p className="text-xs text-gray-400 mb-1.5">
              예: 상단 메뉴, 하단 메뉴, 사이드바 등
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              placeholder="상단 메뉴"
              required
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-400">
            생성 후 게시판, 페이지, 링크 등 메뉴 아이템을 추가할 수 있습니다.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? '생성 중...' : '생성 후 아이템 추가'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {navigations.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          <Navigation className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>네비게이션이 없습니다</p>
          <p className="text-xs mt-1">메뉴를 만들고, 게시판/페이지/링크를 추가해보세요</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">이름</th>
                <th className="text-center px-4 py-3 font-medium w-20">상태</th>
                <th className="text-center px-4 py-3 font-medium w-28">생성일</th>
                <th className="text-right px-4 py-3 font-medium w-24">관리</th>
              </tr>
            </thead>
            <tbody>
              {navigations.map((nav) => (
                <tr key={nav.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to="/navigations/$navId"
                      params={{ navId: nav.id }}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {nav.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${nav.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {nav.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{formatDate(nav.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/navigations/$navId"
                        params={{ navId: nav.id }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(nav)}
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
            <h3 className="font-bold mb-2">네비게이션 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{deleteTarget.name}</strong>을(를) 삭제하시겠습니까?
              <br />
              <span className="text-xs text-gray-400">포함된 아이템도 모두 삭제됩니다.</span>
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
