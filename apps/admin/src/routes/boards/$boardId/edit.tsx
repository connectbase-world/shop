import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID } from '@/lib/constants'
import { toBoard, toBoards } from '@/lib/utils'
import { BoardForm } from '@/components/boards/BoardForm'
import type { BoardFormData } from '@/components/boards/BoardForm'

export const Route = createFileRoute('/boards/$boardId/edit')({
  loader: async ({ params }) => {
    const result = await cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 })
    const rows = result.data ?? []
    const row = rows.find((r: { id: string }) => r.id === params.boardId)
    if (!row) throw new Error('게시판을 찾을 수 없습니다.')
    const slugs = toBoards(rows).map((b) => b.slug)
    return { board: toBoard(row), existingSlugs: slugs }
  },
  component: EditBoardPage,
})

function EditBoardPage() {
  const { board, existingSlugs } = Route.useLoaderData()
  const navigate = useNavigate()

  const handleSubmit = async (data: BoardFormData) => {
    await cb.database.updateData(BOARDS_TABLE_ID, board.id, { data })
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
        <h1 className="text-2xl font-bold">게시판 설정 — {board.name}</h1>
      </div>
      <BoardForm initial={board} onSubmit={handleSubmit} submitLabel="저장" existingSlugs={existingSlugs} />
    </div>
  )
}
