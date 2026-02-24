import { useState } from 'react'
import type { Board } from '@/lib/types'

export type BoardFormData = {
  name: string
  slug: string
  description: string
  sort_order: number
  is_active: boolean
  show_in_nav: boolean
  allow_user_posts: boolean
}

type Props = {
  initial?: Board
  onSubmit: (data: BoardFormData) => Promise<void>
  submitLabel: string
}

export function BoardForm({ initial, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<BoardFormData>({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
    show_in_nav: initial?.show_in_nav ?? true,
    allow_user_posts: initial?.allow_user_posts ?? false,
  })
  const [saving, setSaving] = useState(false)

  const handleSlugFromName = (name: string) => {
    if (!initial) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50)
      setForm((f) => ({ ...f, name, slug }))
    } else {
      setForm((f) => ({ ...f, name }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) return
    setSaving(true)
    try {
      await onSubmit(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">게시판 이름 *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleSlugFromName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          placeholder="공지사항"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">슬러그 (URL) *</label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          placeholder="notice"
          required
        />
        <p className="text-xs text-gray-400 mt-1">Shop URL: /boards/{form.slug || '...'}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">설명</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 resize-none"
          placeholder="게시판 설명 (선택사항)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">정렬 순서</label>
        <input
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          className="w-24 px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
        />
        <p className="text-xs text-gray-400 mt-1">숫자가 작을수록 앞에 표시됩니다</p>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="rounded"
          />
          활성화
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.show_in_nav}
            onChange={(e) => setForm({ ...form, show_in_nav: e.target.checked })}
            className="rounded"
          />
          Shop 네비게이션에 표시
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.allow_user_posts}
            onChange={(e) => setForm({ ...form, allow_user_posts: e.target.checked })}
            className="rounded"
          />
          유저 글쓰기 허용
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {saving ? '저장 중...' : submitLabel}
      </button>
    </form>
  )
}
