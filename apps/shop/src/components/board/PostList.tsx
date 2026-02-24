import { Link } from '@tanstack/react-router'
import { Eye, Pin, Lock } from 'lucide-react'
import type { Post } from '@/lib/types'
import { useI18n } from '@/hooks/useI18n'

type Props = {
  posts: Post[]
  boardSlug: string
  currentMemberId?: string
}

export function PostList({ posts, boardSlug, currentMemberId }: Props) {
  const { t } = useI18n()

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        {t.boards.noPosts}
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200">
      {posts.map((post) => {
        const isOwner = currentMemberId && post.member_id === currentMemberId
        const isSecretHidden = post.is_secret && !isOwner

        return (
          <Link
            key={post.id}
            to="/boards/$boardSlug/$postId"
            params={{ boardSlug, postId: post.id }}
            className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {post.is_pinned && (
                  <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded font-medium shrink-0">
                    <Pin className="w-2.5 h-2.5" />
                    {t.boards.pinned}
                  </span>
                )}
                {post.is_secret && (
                  <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-medium shrink-0">
                    <Lock className="w-2.5 h-2.5" />
                    {t.boards.secretPost}
                  </span>
                )}
                <span className={`text-sm font-medium truncate ${isSecretHidden ? 'text-gray-400' : ''}`}>
                  {isSecretHidden ? t.boards.secretPostHidden : post.title}
                </span>
              </div>
              {!isSecretHidden && post.summary && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{post.summary}</p>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
              <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.view_count || 0}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
