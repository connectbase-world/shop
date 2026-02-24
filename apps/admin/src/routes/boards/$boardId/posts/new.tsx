import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID, POSTS_TABLE_ID } from '@/lib/constants'
import { toBoard } from '@/lib/utils'
import { getAdminSession } from '@/lib/adminAuth'
import { BoardPostForm } from '@/components/boards/BoardPostForm'
import type { BoardPostFormData } from '@/components/boards/BoardPostForm'

export const Route = createFileRoute('/boards/$boardId/posts/new')({
  loader: async ({ params }) => {
    const result = await cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 })
    const row = (result.data ?? []).find((r: { id: string }) => r.id === params.boardId)
    if (!row) throw new Error('게시판을 찾을 수 없습니다.')
    return { board: toBoard(row) }
  },
  component: NewPostPage,
})

function NewPostPage() {
  const { board } = Route.useLoaderData()
  const navigate = useNavigate()
  const { boardId } = Route.useParams()

  const handleSubmit = async (data: BoardPostFormData) => {
    const session = getAdminSession()
    await cb.database.createData(POSTS_TABLE_ID, {
      data: {
        ...data,
        board_id: boardId,
        author: session?.nickname ?? '',
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })
    navigate({ to: '/boards/$boardId', params: { boardId } })
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
        <h1 className="text-2xl font-bold">{board.name} — 글 작성</h1>
      </div>
      <BoardPostForm onSubmit={handleSubmit} submitLabel="등록" />
    </div>
  )
}
