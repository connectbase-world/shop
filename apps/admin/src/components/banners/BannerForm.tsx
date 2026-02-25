import { useState, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ImagePlus, X } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { BANNERS_TABLE_ID, FILE_STORAGE_ID } from '@/lib/constants'
import type { Banner } from '@/lib/types'

type Props = {
  banner?: Banner
}

export function BannerForm({ banner }: Props) {
  const router = useRouter()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const mobileImageInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(banner?.title ?? '')
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? '')
  const [image, setImage] = useState(banner?.image ?? '')
  const [mobileImage, setMobileImage] = useState(banner?.mobile_image ?? '')
  const [linkUrl, setLinkUrl] = useState(banner?.link_url ?? '')
  const [linkType, setLinkType] = useState<'internal' | 'external'>(banner?.link_type ?? 'internal')
  const [position, setPosition] = useState<'hero' | 'promotion' | 'popup'>(banner?.position ?? 'hero')
  const [sortOrder, setSortOrder] = useState(banner?.sort_order ?? 0)
  const [isActive, setIsActive] = useState(banner?.is_active ?? true)
  const [startsAt, setStartsAt] = useState(banner?.starts_at ?? '')
  const [endsAt, setEndsAt] = useState(banner?.ends_at ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await cb.storage.uploadFile(FILE_STORAGE_ID, file, { path: '/banners' })
      const url = cb.storage.getFileUrl(result)
      if (url) setter(url)
    } catch {
      alert('이미지 업로드에 실패했습니다.')
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !image) {
      alert('제목과 이미지는 필수입니다.')
      return
    }

    setSaving(true)
    const data = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      image,
      mobile_image: mobileImage,
      link_url: linkUrl.trim(),
      link_type: linkType,
      position,
      sort_order: sortOrder,
      is_active: isActive,
      starts_at: startsAt,
      ends_at: endsAt,
      created_at: banner?.created_at ?? new Date().toISOString(),
    }

    try {
      if (banner) {
        await cb.database.updateData(BANNERS_TABLE_ID, banner.id, { data })
      } else {
        await cb.database.createData(BANNERS_TABLE_ID, { data })
      }
      router.navigate({ to: '/banners' })
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">부제목</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">배너 이미지 *</label>
          {image ? (
            <div className="relative inline-block">
              <img src={image} alt="" className="h-40 rounded-md object-cover" />
              <button
                type="button"
                onClick={() => setImage('')}
                className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-md text-sm text-gray-500 hover:border-gray-400 transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              {uploading ? '업로드 중...' : '이미지 업로드'}
            </button>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setImage)}
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">모바일 이미지</label>
          {mobileImage ? (
            <div className="relative inline-block">
              <img src={mobileImage} alt="" className="h-32 rounded-md object-cover" />
              <button
                type="button"
                onClick={() => setMobileImage('')}
                className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => mobileImageInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-md text-sm text-gray-500 hover:border-gray-400 transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              {uploading ? '업로드 중...' : '모바일 이미지 (선택)'}
            </button>
          )}
          <input
            ref={mobileImageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, setMobileImage)}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">위치 *</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as 'hero' | 'promotion' | 'popup')}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            >
              <option value="hero">히어로</option>
              <option value="promotion">프로모션</option>
              <option value="popup">팝업</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">정렬 순서</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">링크 URL</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/products"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">링크 타입</label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as 'internal' | 'external')}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            >
              <option value="internal">내부 링크</option>
              <option value="external">외부 링크</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">시작일</label>
            <input
              type="datetime-local"
              value={startsAt ? startsAt.slice(0, 16) : ''}
              onChange={(e) => setStartsAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">종료일</label>
            <input
              type="datetime-local"
              value={endsAt ? endsAt.slice(0, 16) : ''}
              onChange={(e) => setEndsAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm">활성화</span>
        </label>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? '저장 중...' : banner ? '수정' : '생성'}
        </button>
        <button
          type="button"
          onClick={() => router.navigate({ to: '/banners' })}
          className="px-6 py-2.5 border border-gray-200 text-sm rounded-md hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </form>
  )
}
