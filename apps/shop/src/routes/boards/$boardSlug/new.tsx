import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID, POSTS_TABLE_ID } from '@/lib/constants'
import { toBoards } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { UserPostForm } from '@/components/board/UserPostForm'
import type { UserPostFormData } from '@/components/board/UserPostForm'

export const Route = createFileRoute('/boards/$boardSlug/new')({
  loader: async ({ params }) => {
    const result = await cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 })
    const boards = toBoards(result.data ?? [])
    const board = boards.find((b) => b.slug === params.boardSlug)
    if (!board) throw new Error('게시판을 찾을 수 없습니다.')
    if (!board.allow_user_posts) throw new Error('이 게시판은 글쓰기가 허용되지 않습니다.')
    return { board }
  },
  component: NewUserPostPage,
})

function NewUserPostPage() {
  const { board } = Route.useLoaderData()
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/boards/$boardSlug"
          params={{ boardSlug: board.slug }}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {board.name}
        </Link>
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{t.boards.loginToWrite}</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
          >
            {t.common.login}
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data: UserPostFormData) => {
    await cb.database.createData(POSTS_TABLE_ID, {
      data: {
        board_id: board.id,
        title: data.title,
        content: data.content,
        content_format: 'markdown',
        summary: '',
        thumbnail: '',
        is_published: true,
        is_pinned: false,
        is_secret: data.is_secret,
        member_id: user.memberId,
        author: user.nickname || '회원',
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    })
    navigate({ to: '/boards/$boardSlug', params: { boardSlug: board.slug } })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/boards/$boardSlug"
        params={{ boardSlug: board.slug }}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {board.name}
      </Link>
      <h1 className="text-2xl font-bold mb-6">{t.boards.writePost}</h1>
      <UserPostForm onSubmit={handleSubmit} />
    </div>
  )
}
