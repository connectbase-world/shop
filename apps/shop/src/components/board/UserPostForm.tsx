import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'

export type UserPostFormData = {
  title: string
  content: string
  is_secret: boolean
}

type Props = {
  onSubmit: (data: UserPostFormData) => Promise<void>
}

export function UserPostForm({ onSubmit }: Props) {
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSecret, setIsSecret] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      await onSubmit({ title, content, is_secret: isSecret })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">{t.boards.postTitle} *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          placeholder={t.boards.postTitlePlaceholder}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">{t.boards.postContent} *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 resize-y"
          placeholder={t.boards.postContentPlaceholder}
          required
        />
        <p className="text-xs text-gray-400 mt-1">Markdown {t.boards.supported}</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isSecret}
          onChange={(e) => setIsSecret(e.target.checked)}
          className="rounded"
        />
        {t.boards.secretPost}
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? t.boards.submitting : t.boards.writePost}
        </button>
      </div>
    </form>
  )
}
