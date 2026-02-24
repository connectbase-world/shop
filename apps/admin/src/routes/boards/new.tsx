import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID } from '@/lib/constants'
import { BoardForm } from '@/components/boards/BoardForm'
import type { BoardFormData } from '@/components/boards/BoardForm'

export const Route = createFileRoute('/boards/new')({
  component: NewBoardPage,
})

function NewBoardPage() {
  const navigate = useNavigate()

  const handleSubmit = async (data: BoardFormData) => {
    await cb.database.createData(BOARDS_TABLE_ID, {
      data: { ...data, created_at: new Date().toISOString() },
    })
    navigate({ to: '/boards' })
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
        <h1 className="text-2xl font-bold">게시판 생성</h1>
      </div>
      <BoardForm onSubmit={handleSubmit} submitLabel="생성" />
    </div>
  )
}
