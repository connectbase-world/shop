import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Trash2, Save, Loader2, Globe, FileText } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { SHOP_STORAGE_ID } from '@/lib/constants'

type PageMeta = {
  path: string
  title: string
  description: string
  image: string
  og_type: string
  canonical_url: string
  robots_noindex: boolean
  include_in_sitemap: boolean
  sitemap_priority: number
  json_ld: string
}

const emptyMeta: PageMeta = {
  path: '/',
  title: '',
  description: '',
  image: '',
  og_type: 'website',
  canonical_url: '',
  robots_noindex: false,
  include_in_sitemap: true,
  sitemap_priority: 0.5,
  json_ld: '',
}

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
})

function SettingsPage() {
  const [pages, setPages] = useState<PageMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPage, setEditingPage] = useState<PageMeta | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadPages = async () => {
    setLoading(true)
    try {
      const result = await cb.storage.listPageMetas(SHOP_STORAGE_ID)
      const metas = (result.pages ?? []).map((p: Record<string, unknown>) => ({
        path: (p.path as string) || '/',
        title: (p.title as string) || '',
        description: (p.description as string) || '',
        image: (p.image as string) || '',
        og_type: (p.og_type as string) || 'website',
        canonical_url: (p.canonical_url as string) || '',
        robots_noindex: (p.robots_noindex as boolean) || false,
        include_in_sitemap: p.include_in_sitemap !== false,
        sitemap_priority: (p.sitemap_priority as number) || 0.5,
        json_ld: (p.json_ld as string) || '',
      }))
      setPages(metas)
    } catch {
      setPages([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPages()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSave = async () => {
    if (!editingPage) return
    if (!editingPage.path.startsWith('/')) {
      showMessage('error', '경로는 /로 시작해야 합니다.')
      return
    }

    setSaving(true)
    try {
      await cb.storage.setPageMeta(SHOP_STORAGE_ID, {
        path: editingPage.path,
        title: editingPage.title,
        description: editingPage.description,
        image: editingPage.image || undefined,
        og_type: editingPage.og_type || undefined,
        canonical_url: editingPage.canonical_url || undefined,
        robots_noindex: editingPage.robots_noindex,
        include_in_sitemap: editingPage.include_in_sitemap,
        sitemap_priority: editingPage.sitemap_priority,
        json_ld: editingPage.json_ld || undefined,
      })
      showMessage('success', '저장되었습니다.')
      setEditingPage(null)
      await loadPages()
    } catch {
      showMessage('error', '저장에 실패했습니다.')
    }
    setSaving(false)
  }

  const handleDelete = async (path: string) => {
    setDeleting(path)
    try {
      await cb.storage.deletePageMeta(SHOP_STORAGE_ID, path)
      showMessage('success', '삭제되었습니다.')
      await loadPages()
    } catch {
      showMessage('error', '삭제에 실패했습니다.')
    }
    setDeleting(null)
  }

  const updateField = <K extends keyof PageMeta>(key: K, value: PageMeta[K]) => {
    if (!editingPage) return
    setEditingPage({ ...editingPage, [key]: value })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">설정</h1>
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 페이지별 SEO */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold">페이지별 SEO 설정</h2>
          </div>
          <button
            onClick={() => setEditingPage({ ...emptyMeta })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Shop의 각 페이지에 SEO 메타 태그, OG 태그, 사이트맵 설정을 관리합니다.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            불러오는 중...
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            등록된 페이지 SEO가 없습니다.
          </div>
        ) : (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">경로</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">제목</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">설명</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-600">사이트맵</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-600 w-20">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map((page) => (
                  <tr key={page.path} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{page.path}</td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate">{page.title || '-'}</td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate text-gray-500">
                      {page.description || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          page.include_in_sitemap ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingPage({ ...page })}
                          className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(page.path)}
                          disabled={deleting === page.path}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          {deleting === page.path ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingPage(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">페이지 SEO 설정</h2>
              <button
                onClick={() => setEditingPage(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-4 flex flex-col gap-4">
              {/* 경로 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  경로 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingPage.path}
                  onChange={(e) => updateField('path', e.target.value)}
                  placeholder="/ 또는 /products"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">예: /, /products, /products/123</p>
              </div>

              {/* 기본 SEO */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">기본 SEO</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">페이지 제목</label>
                    <input
                      type="text"
                      value={editingPage.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="페이지 제목"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">설명</label>
                    <textarea
                      value={editingPage.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="페이지 설명 (검색 결과에 표시됨)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* OG 태그 */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Open Graph (소셜 공유)</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">OG 이미지 URL</label>
                    <input
                      type="url"
                      value={editingPage.image}
                      onChange={(e) => updateField('image', e.target.value)}
                      placeholder="https://example.com/og-image.jpg"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">OG 타입</label>
                    <select
                      value={editingPage.og_type}
                      onChange={(e) => updateField('og_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors bg-white"
                    >
                      <option value="website">website</option>
                      <option value="article">article</option>
                      <option value="product">product</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Canonical URL</label>
                    <input
                      type="url"
                      value={editingPage.canonical_url}
                      onChange={(e) => updateField('canonical_url', e.target.value)}
                      placeholder="https://myshop.com/products"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 사이트맵 & 인덱싱 */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">사이트맵 & 인덱싱</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editingPage.include_in_sitemap}
                        onChange={(e) => updateField('include_in_sitemap', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      사이트맵 포함
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editingPage.robots_noindex}
                        onChange={(e) => updateField('robots_noindex', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      검색 제외 (noindex)
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      사이트맵 우선순위 ({editingPage.sitemap_priority})
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={editingPage.sitemap_priority}
                      onChange={(e) => updateField('sitemap_priority', Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>0.0 (낮음)</span>
                      <span>1.0 (높음)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* JSON-LD */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">구조화 데이터 (JSON-LD)</h3>
                <textarea
                  value={editingPage.json_ld}
                  onChange={(e) => updateField('json_ld', e.target.value)}
                  placeholder='{"@context":"https://schema.org","@type":"WebSite",...}'
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors resize-none font-mono text-xs"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setEditingPage(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
