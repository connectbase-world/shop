import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID, POSTS_TABLE_ID } from '@/lib/constants'
import { toBoard, toPosts, formatDate } from '@/lib/utils'
import type { Post } from '@/lib/types'

export const Route = createFileRoute('/boards/$boardId/')({
  loader: async ({ params }) => {
    const [boardRes, postsRes] = await Promise.all([
      cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(POSTS_TABLE_ID, { limit: 1000 }),
    ])
    const boardRow = (boardRes.data ?? []).find((r: { id: string }) => r.id === params.boardId)
    if (!boardRow) throw new Error('게시판을 찾을 수 없습니다.')
    const board = toBoard(boardRow)
    const posts = toPosts(postsRes.data ?? [])
      .filter((p) => p.board_id === params.boardId)
    posts.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return { board, posts }
  },
  component: BoardDetailPage,
})

function BoardDetailPage() {
  const { board, posts } = Route.useLoaderData()
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await cb.database.deleteData(POSTS_TABLE_ID, deleteTarget.id)
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
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/boards"
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{board.name}</h1>
          {board.description && <p className="text-sm text-gray-400 mt-0.5">{board.description}</p>}
        </div>
        <Link
          to="/boards/$boardId/edit"
          params={{ boardId: board.id }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          설정
        </Link>
        <Link
          to="/boards/$boardId/posts/new"
          params={{ boardId: board.id }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          글 작성
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          작성된 글이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">제목</th>
                <th className="text-center px-4 py-3 font-medium w-20">상태</th>
                <th className="text-center px-4 py-3 font-medium w-20">조회</th>
                <th className="text-center px-4 py-3 font-medium w-28">작성일</th>
                <th className="text-right px-4 py-3 font-medium w-24">관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.is_pinned && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded font-medium">고정</span>
                      )}
                      {post.is_secret && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-medium">비밀</span>
                      )}
                      <span className="font-medium">{post.title}</span>
                    </div>
                    {post.summary && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{post.summary}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${post.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {post.is_published ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{post.view_count || 0}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{formatDate(post.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/boards/$boardId/posts/$postId/edit"
                        params={{ boardId: board.id, postId: post.id }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(post)}
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

      <p className="text-xs text-gray-400 mt-3">{posts.length}개 글</p>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold mb-2">글 삭제</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{deleteTarget.title}</strong>을(를) 삭제하시겠습니까?
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
