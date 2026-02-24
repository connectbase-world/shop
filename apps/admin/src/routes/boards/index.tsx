import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID } from '@/lib/constants'
import { toBoards } from '@/lib/utils'
import type { Board } from '@/lib/types'

export const Route = createFileRoute('/boards/')(
  {
    loader: async () => {
      const result = await cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 })
      const boards = toBoards(result.data ?? [])
      boards.sort((a, b) => a.sort_order - b.sort_order)
      return { boards }
    },
    component: BoardsPage,
  },
)

function BoardsPage() {
  const { boards } = Route.useLoaderData()
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await cb.database.deleteData(BOARDS_TABLE_ID, deleteTarget.id)
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
        <h1 className="text-2xl font-bold">게시판 관리</h1>
        <Link
          to="/boards/new"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          게시판 생성
        </Link>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          생성된 게시판이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">이름</th>
                <th className="text-left px-4 py-3 font-medium">슬러그</th>
                <th className="text-center px-4 py-3 font-medium">정렬</th>
                <th className="text-center px-4 py-3 font-medium">상태</th>
                <th className="text-center px-4 py-3 font-medium">네비</th>
                <th className="text-right px-4 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => (
                <tr key={board.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to="/boards/$boardId" params={{ boardId: board.id }} className="font-medium hover:underline">
                      {board.name}
                    </Link>
                    {board.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{board.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">/boards/{board.slug}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{board.sort_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${board.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {board.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {board.show_in_nav && <span className="text-xs text-blue-500">표시</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/boards/$boardId"
                        params={{ boardId: board.id }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="글 관리"
                      >
                        <FileText className="w-4 h-4" />
                      </Link>
                      <Link
                        to="/boards/$boardId/edit"
                        params={{ boardId: board.id }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="수정"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(board)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
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
            <h3 className="font-bold mb-2">게시판 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{deleteTarget.name}</strong> 게시판을 삭제하시겠습니까?
              <br />
              <span className="text-red-500 text-xs">게시판에 포함된 글은 삭제되지 않습니다.</span>
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
