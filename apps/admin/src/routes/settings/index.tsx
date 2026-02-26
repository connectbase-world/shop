import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Trash2, Save, Loader2, Globe, FileText, Code2, Store, CheckCircle, XCircle } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { SHOP_STORAGE_ID, TRACKING_CONFIG_TABLE_ID, MARKETPLACE_CONFIG_TABLE_ID, NAVER_SYNC_FUNCTION_ID, COUPANG_SYNC_FUNCTION_ID } from '@/lib/constants'
import { toTrackingConfig, toMarketplaceConfigs } from '@/lib/utils'
import type { TrackingConfig, MarketplaceConfig, MarketplacePlatform } from '@/lib/types'

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
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">설정</h1>
      </div>

      <div className="flex flex-col gap-6">
        <SeoSection />
        <TrackingSection />
        <MarketplaceSection />
      </div>
    </div>
  )
}

/* ─── SEO 설정 ─── */

function SeoSection() {
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

      {message && (
        <div className={`mb-4 px-4 py-2.5 rounded-md text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

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

/* ─── 외부 추적 코드 설정 ─── */

type TrackingConfigForm = Omit<TrackingConfig, 'id' | 'updated_at'>

const emptyTracking: TrackingConfigForm = {
  gtm_id: '',
  ga4_id: '',
  meta_pixel_id: '',
  naver_analytics_id: '',
  kakao_pixel_id: '',
  gtm_enabled: false,
  ga4_enabled: false,
  meta_pixel_enabled: false,
  naver_analytics_enabled: false,
  kakao_pixel_enabled: false,
  custom_head_scripts: '',
  custom_body_scripts: '',
}

const trackers = [
  { key: 'gtm', label: 'Google Tag Manager', idField: 'gtm_id', enableField: 'gtm_enabled', placeholder: 'GTM-XXXXXXX', help: 'GTM 컨테이너 ID' },
  { key: 'ga4', label: 'Google Analytics 4', idField: 'ga4_id', enableField: 'ga4_enabled', placeholder: 'G-XXXXXXXXXX', help: 'GA4 측정 ID. GTM에 GA4를 설정한 경우 별도 활성화 불필요' },
  { key: 'meta_pixel', label: 'Meta (Facebook) Pixel', idField: 'meta_pixel_id', enableField: 'meta_pixel_enabled', placeholder: '1234567890', help: 'Meta Pixel ID' },
  { key: 'naver_analytics', label: '네이버 애널리틱스', idField: 'naver_analytics_id', enableField: 'naver_analytics_enabled', placeholder: 's_XXXXXXXXXX', help: '네이버 애널리틱스 사이트 ID' },
  { key: 'kakao_pixel', label: '카카오 Pixel', idField: 'kakao_pixel_id', enableField: 'kakao_pixel_enabled', placeholder: '1234567890', help: '카카오 Pixel 트래킹 ID' },
] as const

function TrackingSection() {
  const [config, setConfig] = useState<TrackingConfigForm>({ ...emptyTracking })
  const [rowId, setRowId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await cb.database.getData(TRACKING_CONFIG_TABLE_ID, { limit: 1 })
      const rows = res.rows ?? res.data ?? []
      if (rows.length > 0) {
        const row = toTrackingConfig(rows[0])
        setRowId(row.id)
        setConfig({
          gtm_id: row.gtm_id || '',
          ga4_id: row.ga4_id || '',
          meta_pixel_id: row.meta_pixel_id || '',
          naver_analytics_id: row.naver_analytics_id || '',
          kakao_pixel_id: row.kakao_pixel_id || '',
          gtm_enabled: row.gtm_enabled || false,
          ga4_enabled: row.ga4_enabled || false,
          meta_pixel_enabled: row.meta_pixel_enabled || false,
          naver_analytics_enabled: row.naver_analytics_enabled || false,
          kakao_pixel_enabled: row.kakao_pixel_enabled || false,
          custom_head_scripts: row.custom_head_scripts || '',
          custom_body_scripts: row.custom_body_scripts || '',
        })
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = { ...config, updated_at: new Date().toISOString() }
      if (rowId) {
        await cb.database.updateData(TRACKING_CONFIG_TABLE_ID, rowId, { data })
      } else {
        const res = await cb.database.createData(TRACKING_CONFIG_TABLE_ID, { data })
        if (res.id) setRowId(res.id)
      }
      showMessage('success', '저장되었습니다. Shop 새로고침 시 적용됩니다.')
    } catch {
      showMessage('error', '저장에 실패했습니다.')
    }
    setSaving(false)
  }

  const updateField = <K extends keyof TrackingConfigForm>(key: K, value: TrackingConfigForm[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold">외부 추적 코드</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          저장
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Google Analytics, Meta Pixel 등 외부 마케팅/분석 도구의 추적 코드를 설정합니다. 저장 후 Shop을 새로고침하면 적용됩니다.
      </p>

      {message && (
        <div className={`mb-4 px-4 py-2.5 rounded-md text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-0">
        {trackers.map((tracker) => {
          const enabled = config[tracker.enableField] as boolean
          return (
            <div key={tracker.key} className="border-t border-gray-100 py-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">{tracker.label}</h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => updateField(tracker.enableField as keyof TrackingConfigForm, e.target.checked as never)}
                    className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                  />
                  사용
                </label>
              </div>
              <input
                type="text"
                value={config[tracker.idField] as string}
                onChange={(e) => updateField(tracker.idField as keyof TrackingConfigForm, e.target.value as never)}
                placeholder={tracker.placeholder}
                disabled={!enabled}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400 font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">{tracker.help}</p>
            </div>
          )
        })}

        {/* 커스텀 스크립트 */}
        <div className="border-t border-gray-100 py-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">커스텀 스크립트</h3>
          <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
            주의: 여기에 입력한 코드는 모든 고객에게 실행됩니다. 신뢰할 수 있는 코드만 입력하세요.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{'<head>'} 삽입 스크립트</label>
              <textarea
                value={config.custom_head_scripts}
                onChange={(e) => updateField('custom_head_scripts', e.target.value)}
                placeholder={'<script>...</script> 또는 <link ...>'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors resize-none font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{'<body>'} 삽입 스크립트</label>
              <textarea
                value={config.custom_body_scripts}
                onChange={(e) => updateField('custom_body_scripts', e.target.value)}
                placeholder={'</body> 직전에 삽입됩니다'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors resize-none font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── 마켓플레이스 연동 설정 ─── */

type PlatformForm = {
  is_enabled: boolean
  client_id: string
  client_secret: string
  secret_key: string
  shop_name: string
}

const emptyPlatform: PlatformForm = {
  is_enabled: false,
  client_id: '',
  client_secret: '',
  secret_key: '',
  shop_name: '',
}

const platformDefs = [
  {
    key: 'naver' as MarketplacePlatform,
    label: '네이버 스마트스토어',
    color: '#03C75A',
    functionId: NAVER_SYNC_FUNCTION_ID,
    fields: [
      { key: 'client_id', label: 'Client ID', placeholder: '네이버 커머스 API Client ID' },
      { key: 'client_secret', label: 'Client Secret', placeholder: '네이버 커머스 API Client Secret' },
    ],
  },
  {
    key: 'coupang' as MarketplacePlatform,
    label: '쿠팡',
    color: '#E31937',
    functionId: COUPANG_SYNC_FUNCTION_ID,
    fields: [
      { key: 'client_id', label: 'Vendor ID', placeholder: '쿠팡 Vendor ID' },
      { key: 'client_secret', label: 'Access Key', placeholder: '쿠팡 Access Key' },
      { key: 'secret_key', label: 'Secret Key', placeholder: '쿠팡 Secret Key' },
    ],
  },
] as const

function MarketplaceSection() {
  const [configs, setConfigs] = useState<Record<MarketplacePlatform, { rowId: string | null; form: PlatformForm }>>({
    naver: { rowId: null, form: { ...emptyPlatform } },
    coupang: { rowId: null, form: { ...emptyPlatform } },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<MarketplacePlatform | null>(null)
  const [verifying, setVerifying] = useState<MarketplacePlatform | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const res = await cb.database.getData(MARKETPLACE_CONFIG_TABLE_ID, { limit: 10 })
      const rows = toMarketplaceConfigs(res.rows ?? res.data ?? [])
      const next = { ...configs }
      for (const row of rows) {
        const platform = row.platform as MarketplacePlatform
        if (platform === 'naver' || platform === 'coupang') {
          next[platform] = {
            rowId: row.id,
            form: {
              is_enabled: row.is_enabled || false,
              client_id: row.client_id || '',
              client_secret: row.client_secret || '',
              secret_key: row.secret_key || '',
              shop_name: row.shop_name || '',
            },
          }
        }
      }
      setConfigs(next)
    } catch { /* ignore */ }
    setLoading(false)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSave = async (platform: MarketplacePlatform) => {
    setSaving(platform)
    try {
      const { rowId, form } = configs[platform]
      const data = { platform, ...form, updated_at: new Date().toISOString() }
      if (rowId) {
        await cb.database.updateData(MARKETPLACE_CONFIG_TABLE_ID, rowId, { data })
      } else {
        const res = await cb.database.createData(MARKETPLACE_CONFIG_TABLE_ID, { data })
        setConfigs((prev) => ({ ...prev, [platform]: { ...prev[platform], rowId: res.id } }))
      }
      showMessage('success', `${platform === 'naver' ? '네이버' : '쿠팡'} 설정이 저장되었습니다.`)
    } catch {
      showMessage('error', '저장에 실패했습니다.')
    }
    setSaving(null)
  }

  const handleVerify = async (platform: MarketplacePlatform) => {
    const def = platformDefs.find((d) => d.key === platform)!
    const { form } = configs[platform]
    if (!form.client_id || !form.client_secret) {
      showMessage('error', 'API 키를 먼저 입력하세요.')
      return
    }
    setVerifying(platform)
    try {
      const credentials = { client_id: form.client_id, client_secret: form.client_secret, secret_key: form.secret_key }
      const res = await cb.functions.call(def.functionId, { action: 'verify_credentials', credentials })
      const result = typeof res === 'string' ? JSON.parse(res) : res
      const body = result.body ? (typeof result.body === 'string' ? JSON.parse(result.body) : result.body) : result
      if (body.success) {
        showMessage('success', body.message || '연결 성공!')
      } else {
        showMessage('error', body.error || '연결 실패')
      }
    } catch (err) {
      showMessage('error', `연결 확인 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
    setVerifying(null)
  }

  const updateField = (platform: MarketplacePlatform, key: keyof PlatformForm, value: string | boolean) => {
    setConfigs((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], form: { ...prev[platform].form, [key]: value } },
    }))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-2">
        <Store className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-bold">마켓플레이스 연동</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        네이버 스마트스토어, 쿠팡 등 외부 마켓플레이스 API 자격증명을 설정합니다. 설정 후 마켓플레이스 페이지에서 상품을 연동할 수 있습니다.
      </p>

      {message && (
        <div className={`mb-4 px-4 py-2.5 rounded-md text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>{message.text}</div>
      )}

      <div className="flex flex-col gap-0">
        {platformDefs.map((def) => {
          const { form } = configs[def.key]
          return (
            <div key={def.key} className="border-t border-gray-100 py-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: def.color }} />
                  <h3 className="text-sm font-medium text-gray-700">{def.label}</h3>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_enabled} onChange={(e) => updateField(def.key, 'is_enabled', e.target.checked)} className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
                  사용
                </label>
              </div>
              <div className="flex flex-col gap-3">
                {def.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                    <input
                      type="password"
                      value={(form as Record<string, unknown>)[field.key] as string}
                      onChange={(e) => updateField(def.key, field.key as keyof PlatformForm, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={!form.is_enabled}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400 font-mono"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => handleSave(def.key)} disabled={saving === def.key} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {saving === def.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  저장
                </button>
                <button onClick={() => handleVerify(def.key)} disabled={verifying === def.key || !form.is_enabled || !form.client_id} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50">
                  {verifying === def.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  연결 확인
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
