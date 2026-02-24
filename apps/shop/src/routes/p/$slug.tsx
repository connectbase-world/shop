import { createFileRoute } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PAGES_TABLE_ID } from '@/lib/constants'
import { toPages } from '@/lib/utils'
import { PostContent } from '@/components/board/PostContent'

export const Route = createFileRoute('/p/$slug')({
  loader: async ({ params }) => {
    const result = await cb.database.getData(PAGES_TABLE_ID, { limit: 1000 })
    const pages = toPages(result.data ?? [])
    const page = pages.find((p) => p.slug === params.slug)
    if (!page || !page.is_published) throw new Error('페이지를 찾을 수 없습니다.')

    // 조회수 증가
    cb.database.updateData(PAGES_TABLE_ID, page.id, {
      data: { view_count: (page.view_count || 0) + 1 },
    })

    return { page }
  },
  component: PageDetail,
})

function PageDetail() {
  const { page } = Route.useLoaderData()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {page.banner_image && (
        <div className="rounded-lg overflow-hidden mb-6">
          <img src={page.banner_image} alt={page.title} className="w-full" />
        </div>
      )}

      <article>
        <h1 className="text-2xl font-bold mb-3">{page.title}</h1>
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-8 pb-4 border-b border-gray-100">
          {page.author && <span>{page.author}</span>}
          <span>{new Date(page.created_at).toLocaleDateString('ko-KR')}</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {(page.view_count || 0) + 1}
          </span>
        </div>

        <PostContent content={page.content} format={page.content_format || 'markdown'} />
      </article>
    </div>
  )
}
