import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PAGES_TABLE_ID } from '@/lib/constants'
import { toPage } from '@/lib/utils'
import { PageForm } from '@/components/pages/PageForm'
import type { PageFormData } from '@/components/pages/PageForm'

export const Route = createFileRoute('/pages/$pageId/edit')({
  loader: async ({ params }) => {
    const result = await cb.database.getData(PAGES_TABLE_ID, { limit: 1000 })
    const row = (result.data ?? []).find((r: { id: string }) => r.id === params.pageId)
    if (!row) throw new Error('페이지를 찾을 수 없습니다.')
    return { page: toPage(row) }
  },
  component: EditPagePage,
})

function EditPagePage() {
  const { page } = Route.useLoaderData()
  const navigate = useNavigate()

  const handleSubmit = async (data: PageFormData) => {
    await cb.database.updateData(PAGES_TABLE_ID, page.id, {
      data: { ...data, updated_at: new Date().toISOString() },
    })
    navigate({ to: '/pages' })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/pages"
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">페이지 수정 — {page.title}</h1>
      </div>
      <PageForm initial={page} onSubmit={handleSubmit} submitLabel="저장" />
    </div>
  )
}
