import { useState, useRef } from 'react'
import { Plus, X, Upload, Loader2, ImageIcon, Images, FileImage, Globe, ChevronDown } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { CATEGORIES, FILE_STORAGE_ID, SUPPORTED_LANGUAGES } from '@/lib/constants'
import type { SupportedLocale, ProductTranslation } from '@/lib/types'

export type ProductFormData = {
  name: string
  price: number
  description: string
  image: string
  images: string[]
  detail_images: string[]
  category: string
  is_featured: boolean
  stock: number
  translations?: Partial<Record<SupportedLocale, ProductTranslation>>
}

type ProductFormProps = {
  initialData?: ProductFormData
  onSubmit: (data: ProductFormData) => Promise<void>
  submitLabel: string
}

const defaultData: ProductFormData = {
  name: '',
  price: 0,
  description: '',
  image: '',
  images: [],
  detail_images: [],
  category: '상의',
  is_featured: false,
  stock: 0,
  translations: undefined,
}

export function ProductForm({ initialData, onSubmit, submitLabel }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(initialData ?? defaultData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadingExtra, setUploadingExtra] = useState(false)
  const [uploadingDetail, setUploadingDetail] = useState(false)
  const mainFileRef = useRef<HTMLInputElement>(null)
  const extraFileRef = useRef<HTMLInputElement>(null)
  const detailFileRef = useRef<HTMLInputElement>(null)

  const categories = CATEGORIES.filter((c) => c.key !== 'all')

  const updateField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const result = await cb.storage.uploadFile(FILE_STORAGE_ID, file)
      return cb.storage.getFileUrl(result)
    } catch {
      return null
    }
  }

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadImage(file)
    if (url) {
      updateField('image', url)
    } else {
      setError('이미지 업로드에 실패했습니다.')
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleExtraImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingExtra(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const url = await uploadImage(file)
      if (url) urls.push(url)
    }
    if (urls.length > 0) {
      updateField('images', [...form.images, ...urls])
    }
    if (urls.length < files.length) {
      setError('일부 이미지 업로드에 실패했습니다.')
    }
    setUploadingExtra(false)
    e.target.value = ''
  }

  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingDetail(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const url = await uploadImage(file)
      if (url) urls.push(url)
    }
    if (urls.length > 0) {
      updateField('detail_images', [...form.detail_images, ...urls])
    }
    if (urls.length < files.length) {
      setError('일부 이미지 업로드에 실패했습니다.')
    }
    setUploadingDetail(false)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    updateField('images', form.images.filter((_, i) => i !== index))
  }

  const removeDetailImage = (index: number) => {
    updateField('detail_images', form.detail_images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('상품명을 입력해주세요.')
      return
    }
    if (form.price <= 0) {
      setError('가격은 0보다 커야 합니다.')
      return
    }
    if (!form.image.trim()) {
      setError('메인 이미지를 등록해주세요.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            상품명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="상품명을 입력하세요"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              가격 (원) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.price || ''}
              onChange={(e) => updateField('price', Number(e.target.value))}
              placeholder="0"
              min={0}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">재고</label>
            <input
              type="number"
              value={form.stock || ''}
              onChange={(e) => updateField('stock', Number(e.target.value))}
              placeholder="0"
              min={0}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">카테고리</label>
          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors bg-white"
          >
            {categories.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">상품 설명</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="상품 설명을 입력하세요"
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        {/* 다국어 입력 */}
        {SUPPORTED_LANGUAGES.length > 0 && (
          <div className="border-t border-gray-200 pt-5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-3">
              <Globe className="w-4 h-4 text-gray-400" />
              다국어 입력 <span className="text-xs font-normal text-gray-400 ml-1">(선택)</span>
            </label>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TranslationSection
                key={lang.code}
                langCode={lang.code}
                langLabel={lang.label}
                translation={form.translations?.[lang.code]}
                onChange={(updated) => {
                  setForm((prev) => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      [lang.code]: updated,
                    },
                  }))
                }}
              />
            ))}
          </div>
        )}

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <ImageIcon className="w-4 h-4 text-gray-400" />
            메인 이미지 <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            상품 목록, 장바구니, 검색 결과에 표시되는 대표 이미지입니다. 1:1 비율(정사각형) 권장, 최소 800×800px
          </p>
          <input
            ref={mainFileRef}
            type="file"
            accept="image/*"
            onChange={handleMainImageUpload}
            className="hidden"
          />
          {form.image ? (
            <div className="flex items-start gap-3">
              <div className="w-24 h-24 rounded-md bg-gray-100 overflow-hidden shrink-0">
                <img src={form.image} alt="메인 이미지" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => mainFileRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {uploading ? '업로드 중...' : '변경'}
                </button>
                <button
                  type="button"
                  onClick={() => updateField('image', '')}
                  className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => mainFileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-md text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors w-full justify-center disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  이미지 업로드
                </>
              )}
            </button>
          )}
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <Images className="w-4 h-4 text-gray-400" />
            추가 이미지
          </label>
          <p className="text-xs text-gray-400 mb-2">
            상품 상세 페이지 상단에 메인 이미지와 함께 슬라이드로 표시됩니다. 다양한 각도, 착용샷, 색상 등을 보여주세요. (최대 10장)
          </p>
          <input
            ref={extraFileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleExtraImageUpload}
            className="hidden"
          />
          {form.images.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative group w-16 h-16 rounded-md bg-gray-100 overflow-hidden">
                  <img src={url} alt={`추가 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => extraFileRef.current?.click()}
            disabled={uploadingExtra}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {uploadingExtra ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                이미지 추가
              </>
            )}
          </button>
        </div>

        {/* 상세 페이지 이미지 */}
        <div className="border-t border-gray-200 pt-5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <FileImage className="w-4 h-4 text-gray-400" />
            상세 페이지 이미지
          </label>
          <p className="text-xs text-gray-400 mb-1">
            상품 상세 페이지 하단에 세로로 나열되는 상세 설명 이미지입니다.
          </p>
          <p className="text-xs text-gray-400 mb-3">
            소재 정보, 사이즈표, 상세 컷 등 구매 결정에 도움되는 이미지를 등록하세요. 업로드 순서대로 표시됩니다.
          </p>
          <input
            ref={detailFileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleDetailImageUpload}
            className="hidden"
          />
          {form.detail_images.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {form.detail_images.map((url, i) => (
                <div key={i} className="relative group border border-gray-100 rounded-md overflow-hidden">
                  <img src={url} alt={`상세 ${i + 1}`} className="w-full max-h-60 object-contain bg-gray-50" />
                  <button
                    type="button"
                    onClick={() => removeDetailImage(i)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => detailFileRef.current?.click()}
            disabled={uploadingDetail}
            className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-md text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors w-full justify-center disabled:opacity-50"
          >
            {uploadingDetail ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                상세 이미지 추가
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_featured"
            checked={form.is_featured}
            onChange={(e) => updateField('is_featured', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="is_featured" className="text-sm text-gray-700">
            추천 상품으로 설정
          </label>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-3">{error}</p>
      )}

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? '저장 중...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function TranslationSection({
  langCode,
  langLabel,
  translation,
  onChange,
}: {
  langCode: string
  langLabel: string
  translation?: ProductTranslation
  onChange: (updated: ProductTranslation) => void
}) {
  const [open, setOpen] = useState(!!translation?.name || !!translation?.description)
  const hasContent = !!translation?.name || !!translation?.description

  return (
    <div className="mb-3 border border-gray-100 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-700">{langLabel}</span>
        <div className="flex items-center gap-2">
          {hasContent && (
            <span className="text-[11px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">입력됨</span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-3 border-t border-gray-100 pt-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">상품명 ({langLabel})</label>
            <input
              type="text"
              value={translation?.name || ''}
              onChange={(e) => onChange({ ...translation, name: e.target.value })}
              placeholder={`상품명을 ${langLabel}로 입력하세요`}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">상품 설명 ({langLabel})</label>
            <textarea
              value={translation?.description || ''}
              onChange={(e) => onChange({ ...translation, description: e.target.value })}
              placeholder={`상품 설명을 ${langLabel}로 입력하세요`}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
