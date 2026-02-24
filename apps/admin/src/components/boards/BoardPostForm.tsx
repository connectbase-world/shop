import { useState, useRef } from 'react'
import { Image, Eye, EyeOff } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { FILE_STORAGE_ID } from '@/lib/constants'
import { markdownToHtml } from '@/lib/markdown'
import type { Post } from '@/lib/types'

export type BoardPostFormData = {
  title: string
  content: string
  content_format: 'html' | 'markdown'
  summary: string
  thumbnail: string
  is_published: boolean
  is_pinned: boolean
  is_secret: boolean
}

type Props = {
  initial?: Post
  onSubmit: (data: BoardPostFormData) => Promise<void>
  submitLabel: string
}

export function BoardPostForm({ initial, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<BoardPostFormData>({
    title: initial?.title ?? '',
    content: initial?.content ?? '',
    content_format: initial?.content_format ?? 'markdown',
    summary: initial?.summary ?? '',
    thumbnail: initial?.thumbnail ?? '',
    is_published: initial?.is_published ?? false,
    is_pinned: initial?.is_pinned ?? false,
    is_secret: initial?.is_secret ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await cb.storage.uploadFile(FILE_STORAGE_ID, file, { path: '/posts' })
      const url = result.url || result.publicUrl
      if (!url) throw new Error('URL 없음')
      if (form.content_format === 'markdown') {
        insertAtCursor(`![${file.name}](${url})`)
      } else {
        insertAtCursor(`<img src="${url}" alt="${file.name}" />`)
      }
    } catch {
      alert('이미지 업로드 실패')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current
    if (!ta) {
      setForm((f) => ({ ...f, content: f.content + text }))
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = form.content.slice(0, start)
    const after = form.content.slice(end)
    setForm((f) => ({ ...f, content: before + text + after }))
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length
      ta.focus()
    })
  }

  const previewHtml =
    form.content_format === 'markdown'
      ? markdownToHtml(form.content)
      : form.content

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSubmit(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">제목 *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">요약</label>
        <input
          type="text"
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          placeholder="목록에 표시되는 짧은 설명"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">썸네일 URL</label>
        <input
          type="text"
          value={form.thumbnail}
          onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          placeholder="https://..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium">본문</label>
          <div className="flex items-center gap-2">
            <select
              value={form.content_format}
              onChange={(e) => setForm({ ...form, content_format: e.target.value as 'html' | 'markdown' })}
              className="text-xs border border-gray-200 rounded px-2 py-1 outline-none"
            >
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50"
            >
              <Image className="w-3.5 h-3.5" />
              {uploading ? '업로드 중...' : '이미지'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
            >
              {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {preview ? '편집' : '미리보기'}
            </button>
          </div>
        </div>
        {preview ? (
          <div
            className="post-content min-h-[300px] p-4 border border-gray-200 rounded-md bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={15}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 resize-y font-mono"
          />
        )}
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            className="rounded"
          />
          공개
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_pinned}
            onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
            className="rounded"
          />
          상단 고정
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_secret}
            onChange={(e) => setForm({ ...form, is_secret: e.target.checked })}
            className="rounded"
          />
          비밀글
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
