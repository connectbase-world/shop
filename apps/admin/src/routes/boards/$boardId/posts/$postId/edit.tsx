import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID, POSTS_TABLE_ID } from '@/lib/constants'
import { toBoard, toPost } from '@/lib/utils'
import { BoardPostForm } from '@/components/boards/BoardPostForm'
import type { BoardPostFormData } from '@/components/boards/BoardPostForm'

export const Route = createFileRoute('/boards/$boardId/posts/$postId/edit')({
  loader: async ({ params }) => {
    const [boardRes, postsRes] = await Promise.all([
      cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(POSTS_TABLE_ID, { limit: 1000 }),
    ])
    const boardRow = (boardRes.data ?? []).find((r: { id: string }) => r.id === params.boardId)
    if (!boardRow) throw new Error('게시판을 찾을 수 없습니다.')
    const postRow = (postsRes.data ?? []).find((r: { id: string }) => r.id === params.postId)
    if (!postRow) throw new Error('글을 찾을 수 없습니다.')
    return { board: toBoard(boardRow), post: toPost(postRow) }
  },
  component: EditPostPage,
})

function EditPostPage() {
  const { board, post } = Route.useLoaderData()
  const navigate = useNavigate()

  const handleSubmit = async (data: BoardPostFormData) => {
    await cb.database.updateData(POSTS_TABLE_ID, post.id, {
      data: { ...data, updated_at: new Date().toISOString() },
    })
    navigate({ to: '/boards/$boardId', params: { boardId: board.id } })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/boards/$boardId"
          params={{ boardId: board.id }}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{board.name} — 글 수정</h1>
      </div>
      <BoardPostForm initial={post} onSubmit={handleSubmit} submitLabel="저장" />
    </div>
  )
}
