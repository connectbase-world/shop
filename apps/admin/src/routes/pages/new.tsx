import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PAGES_TABLE_ID } from '@/lib/constants'
import { getAdminSession } from '@/lib/adminAuth'
import { PageForm } from '@/components/pages/PageForm'
import type { PageFormData } from '@/components/pages/PageForm'

export const Route = createFileRoute('/pages/new')({
  component: NewPagePage,
})

function NewPagePage() {
  const navigate = useNavigate()

  const handleSubmit = async (data: PageFormData) => {
    const session = getAdminSession()
    await cb.database.createData(PAGES_TABLE_ID, {
      data: {
        ...data,
        author: session?.nickname ?? '',
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
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
        <h1 className="text-2xl font-bold">페이지 생성</h1>
      </div>
      <PageForm onSubmit={handleSubmit} submitLabel="생성" />
    </div>
  )
}
