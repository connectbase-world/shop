import { createFileRoute, Link } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID, POSTS_TABLE_ID } from '@/lib/constants'
import { toBoards, toPosts } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { PostList } from '@/components/board/PostList'

export const Route = createFileRoute('/boards/$boardSlug/')({
  loader: async ({ params }) => {
    const [boardsRes, postsRes] = await Promise.all([
      cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(POSTS_TABLE_ID, { limit: 1000 }),
    ])
    const boards = toBoards(boardsRes.data ?? [])
    const board = boards.find((b) => b.slug === params.boardSlug)
    if (!board) throw new Error('게시판을 찾을 수 없습니다.')
    const posts = toPosts(postsRes.data ?? [])
      .filter((p) => p.board_id === board.id && p.is_published)
    posts.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return { board, posts }
  },
  component: BoardPage,
})

function BoardPage() {
  const { board, posts } = Route.useLoaderData()
  const { user } = useAuth()
  const { t } = useI18n()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{board.name}</h1>
        {board.allow_user_posts && (
          <Link
            to="/boards/$boardSlug/new"
            params={{ boardSlug: board.slug }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t.boards.writePost}
          </Link>
        )}
      </div>
      {board.description && (
        <p className="text-sm text-gray-400 mb-6">{board.description}</p>
      )}
      <PostList posts={posts} boardSlug={board.slug} currentMemberId={user?.memberId} />
    </div>
  )
}
