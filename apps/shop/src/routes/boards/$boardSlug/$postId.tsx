import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Eye, Lock } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID, POSTS_TABLE_ID } from '@/lib/constants'
import { toBoards, toPost } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { PostContent } from '@/components/board/PostContent'

export const Route = createFileRoute('/boards/$boardSlug/$postId')({
  loader: async ({ params }) => {
    const [boardsRes, postsRes] = await Promise.all([
      cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(POSTS_TABLE_ID, { limit: 1000 }),
    ])
    const boards = toBoards(boardsRes.data ?? [])
    const board = boards.find((b) => b.slug === params.boardSlug)
    if (!board) throw new Error('게시판을 찾을 수 없습니다.')
    const postRow = (postsRes.data ?? []).find((r: { id: string }) => r.id === params.postId)
    if (!postRow) throw new Error('글을 찾을 수 없습니다.')
    const post = toPost(postRow)

    // 조회수 증가
    cb.database.updateData(POSTS_TABLE_ID, post.id, {
      data: { view_count: (post.view_count || 0) + 1 },
    })

    return { board, post }
  },
  component: PostDetailPage,
})

function PostDetailPage() {
  const { board, post } = Route.useLoaderData()
  const { user } = useAuth()
  const { t } = useI18n()

  const isOwner = user && post.member_id === user.memberId
  const isSecretBlocked = post.is_secret && !isOwner

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

      {isSecretBlocked ? (
        <div className="text-center py-20">
          <Lock className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t.boards.secretPostBlocked}</p>
          <p className="text-sm text-gray-400 mt-1">{t.boards.secretPostBlockedDesc}</p>
        </div>
      ) : (
        <article>
          <h1 className="text-2xl font-bold mb-3">
            {post.is_secret && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded font-medium mr-2 align-middle">
                <Lock className="w-3 h-3" />
                {t.boards.secretPost}
              </span>
            )}
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-8 pb-4 border-b border-gray-100">
            {post.author && <span>{post.author}</span>}
            <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {(post.view_count || 0) + 1}
            </span>
          </div>

          <PostContent content={post.content} format={post.content_format || 'markdown'} />
        </article>
      )}
    </div>
  )
}
