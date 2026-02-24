import { useState, useRef } from 'react'
import { Image, Eye, EyeOff } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { FILE_STORAGE_ID } from '@/lib/constants'
import { markdownToHtml } from '@/lib/markdown'
import type { Page } from '@/lib/types'

export type PageFormData = {
  title: string
  slug: string
  content: string
  content_format: 'html' | 'markdown'
  summary: string
  thumbnail: string
  banner_image: string
  is_published: boolean
  show_in_nav: boolean
  nav_label: string
  nav_order: number
}

type Props = {
  initial?: Page
  onSubmit: (data: PageFormData) => Promise<void>
  submitLabel: string
}

export function PageForm({ initial, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<PageFormData>({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    content: initial?.content ?? '',
    content_format: initial?.content_format ?? 'markdown',
    summary: initial?.summary ?? '',
    thumbnail: initial?.thumbnail ?? '',
    banner_image: initial?.banner_image ?? '',
    is_published: initial?.is_published ?? false,
    show_in_nav: initial?.show_in_nav ?? false,
    nav_label: initial?.nav_label ?? '',
    nav_order: initial?.nav_order ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const thumbnailRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSlugFromTitle = (title: string) => {
    if (!initial) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50)
      setForm((f) => ({ ...f, title, slug }))
    } else {
      setForm((f) => ({ ...f, title }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await cb.storage.uploadFile(FILE_STORAGE_ID, file, { path: '/pages' })
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

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await cb.storage.uploadFile(FILE_STORAGE_ID, file, { path: '/pages' })
      const url = result.url || result.publicUrl
      if (!url) throw new Error('URL 없음')
      setForm((f) => ({ ...f, thumbnail: url }))
    } catch {
      alert('썸네일 업로드 실패')
    } finally {
      setUploading(false)
      if (thumbnailRef.current) thumbnailRef.current.value = ''
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await cb.storage.uploadFile(FILE_STORAGE_ID, file, { path: '/pages' })
      const url = result.url || result.publicUrl
      if (!url) throw new Error('URL 없음')
      setForm((f) => ({ ...f, banner_image: url }))
    } catch {
      alert('배너 업로드 실패')
    } finally {
      setUploading(false)
      if (bannerRef.current) bannerRef.current.value = ''
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
    if (!form.title.trim() || !form.slug.trim()) return
    setSaving(true)
    try {
      await onSubmit(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">제목 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleSlugFromTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
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
            required
          />
          <p className="text-xs text-gray-400 mt-1">Shop URL: /p/{form.slug || '...'}</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">썸네일</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              placeholder="https://..."
            />
            <button
              type="button"
              onClick={() => thumbnailRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2 text-xs border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              업로드
            </button>
            <input ref={thumbnailRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
          </div>
          {form.thumbnail && (
            <div className="mt-2 rounded-md overflow-hidden border border-gray-200">
              <img src={form.thumbnail} alt="썸네일 미리보기" className="w-full max-h-32 object-cover" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">배너 이미지</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.banner_image}
              onChange={(e) => setForm({ ...form, banner_image: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              placeholder="https://..."
            />
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2 text-xs border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              업로드
            </button>
            <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
          </div>
          {form.banner_image && (
            <div className="mt-2 rounded-md overflow-hidden border border-gray-200">
              <img src={form.banner_image} alt="배너 미리보기" className="w-full max-h-32 object-cover" />
            </div>
          )}
        </div>
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

      <div className="p-4 bg-gray-50 rounded-md space-y-3">
        <p className="text-sm font-medium">네비게이션 설정</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.show_in_nav}
            onChange={(e) => setForm({ ...form, show_in_nav: e.target.checked })}
            className="rounded"
          />
          Shop 네비게이션에 표시
        </label>
        {form.show_in_nav && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">네비 표시 이름</label>
              <input
                type="text"
                value={form.nav_label}
                onChange={(e) => setForm({ ...form, nav_label: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
                placeholder={form.title || '제목과 동일'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">정렬 순서</label>
              <input
                type="number"
                value={form.nav_order}
                onChange={(e) => setForm({ ...form, nav_order: Number(e.target.value) })}
                className="w-24 px-3 py-1.5 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              />
            </div>
          </div>
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
