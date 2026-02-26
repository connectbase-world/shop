import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { RefreshCw, ExternalLink, CheckCircle, XCircle, Clock, AlertTriangle, Search, Link2, Unlink, X } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import {
  PRODUCTS_TABLE_ID,
  MARKETPLACE_CONFIG_TABLE_ID,
  MARKETPLACE_CATEGORY_MAP_TABLE_ID,
  MARKETPLACE_SYNC_LOG_TABLE_ID,
  NAVER_SYNC_FUNCTION_ID,
  COUPANG_SYNC_FUNCTION_ID,
  MARKETPLACE_PLATFORMS,
  CATEGORIES,
  MAX_QUERY_LIMIT,
} from '@/lib/constants'
import {
  toProducts,
  toMarketplaceConfigs,
  toMarketplaceCategoryMaps,
  toMarketplaceSyncLogs,
  formatPrice,
} from '@/lib/utils'
import type { Product, MarketplaceCategoryMap, MarketplaceSyncLog, MarketplacePlatform } from '@/lib/types'

export const Route = createFileRoute('/marketplace/')({
  loader: async () => {
    const [productsRes, configsRes, categoryMapsRes, syncLogsRes] = await Promise.all([
      cb.database.getData(PRODUCTS_TABLE_ID, { limit: MAX_QUERY_LIMIT }),
      cb.database.getData(MARKETPLACE_CONFIG_TABLE_ID, { limit: 100 }),
      cb.database.getData(MARKETPLACE_CATEGORY_MAP_TABLE_ID, { limit: MAX_QUERY_LIMIT }),
      cb.database.getData(MARKETPLACE_SYNC_LOG_TABLE_ID, { limit: MAX_QUERY_LIMIT }),
    ])
    return {
      products: toProducts(productsRes.data ?? []),
      configs: toMarketplaceConfigs(configsRes.data ?? []),
      categoryMaps: toMarketplaceCategoryMaps(categoryMapsRes.data ?? []),
      syncLogs: toMarketplaceSyncLogs(syncLogsRes.data ?? []),
    }
  },
  component: MarketplacePage,
})

type Tab = 'sync' | 'category'
type SyncFilter = 'all' | 'synced' | 'unsynced' | 'failed' | 'matched'
type MatchTarget = { product: Product; platform: MarketplacePlatform } | null

function MarketplacePage() {
  const { products, configs, categoryMaps, syncLogs } = Route.useLoaderData()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('sync')
  const [filter, setFilter] = useState<SyncFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const [matchTarget, setMatchTarget] = useState<MatchTarget>(null)

  const naverConfig = configs.find((c) => c.platform === 'naver')
  const coupangConfig = configs.find((c) => c.platform === 'coupang')

  const getLatestLog = (productId: string, platform: MarketplacePlatform): MarketplaceSyncLog | undefined => {
    return syncLogs
      .filter((l) => l.product_id === productId && l.platform === platform)
      .sort((a, b) => new Date(b.updated_at || b.synced_at || '').getTime() - new Date(a.updated_at || a.synced_at || '').getTime())[0]
  }

  const getSyncStatus = (productId: string, platform: MarketplacePlatform) => {
    const log = getLatestLog(productId, platform)
    if (!log) return 'unsynced'
    return log.status
  }

  const filteredProducts = products.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!p.name.toLowerCase().includes(q)) return false
    }
    if (filter === 'all') return true
    if (filter === 'synced') {
      return getSyncStatus(p.id, 'naver') === 'synced' || getSyncStatus(p.id, 'coupang') === 'synced'
    }
    if (filter === 'unsynced') {
      return getSyncStatus(p.id, 'naver') === 'unsynced' && getSyncStatus(p.id, 'coupang') === 'unsynced'
    }
    if (filter === 'failed') {
      return getSyncStatus(p.id, 'naver') === 'failed' || getSyncStatus(p.id, 'coupang') === 'failed'
    }
    if (filter === 'matched') {
      const nLog = getLatestLog(p.id, 'naver')
      const cLog = getLatestLog(p.id, 'coupang')
      return (nLog?.external_product_id && nLog.status === 'synced') || (cLog?.external_product_id && cLog.status === 'synced')
    }
    return true
  })

  const handleSync = async (product: Product, platform: MarketplacePlatform) => {
    const config = platform === 'naver' ? naverConfig : coupangConfig
    if (!config || !config.is_enabled) {
      alert(`${platform === 'naver' ? '네이버' : '쿠팡'} 연동이 설정되지 않았습니다. 설정에서 먼저 API 키를 등록해주세요.`)
      return
    }

    const key = `${product.id}_${platform}`
    setSyncing((prev) => ({ ...prev, [key]: true }))

    try {
      const existingLog = getLatestLog(product.id, platform)
      const isUpdate = existingLog?.status === 'synced' && existingLog.external_product_id

      const logData = {
        product_id: product.id,
        platform,
        status: 'syncing',
        external_product_id: existingLog?.external_product_id || '',
        external_product_url: existingLog?.external_product_url || '',
        error_message: '',
        synced_at: existingLog?.synced_at || '',
        updated_at: new Date().toISOString(),
      }

      if (existingLog) {
        await cb.database.updateData(MARKETPLACE_SYNC_LOG_TABLE_ID, existingLog.id, logData)
      } else {
        await cb.database.createData(MARKETPLACE_SYNC_LOG_TABLE_ID, logData)
      }

      const catMap = categoryMaps.find(
        (m) => m.platform === platform && m.internal_category === product.category,
      )

      const functionId = platform === 'naver' ? NAVER_SYNC_FUNCTION_ID : COUPANG_SYNC_FUNCTION_ID
      const result = await cb.functions.call(functionId, {
        action: isUpdate ? 'update' : 'register',
        product,
        config,
        categoryMap: catMap || null,
        externalProductId: existingLog?.external_product_id || null,
      })

      const response = result as Record<string, unknown>

      const updatedLogData = {
        ...logData,
        status: response.success ? 'synced' : 'failed',
        external_product_id: (response.externalProductId as string) || logData.external_product_id,
        external_product_url: (response.externalProductUrl as string) || logData.external_product_url,
        error_message: (response.error as string) || '',
        synced_at: response.success ? new Date().toISOString() : logData.synced_at,
        updated_at: new Date().toISOString(),
      }

      const latestLog = getLatestLog(product.id, platform)
      if (latestLog) {
        await cb.database.updateData(MARKETPLACE_SYNC_LOG_TABLE_ID, latestLog.id, updatedLogData)
      }

      router.invalidate()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '연동 중 오류가 발생했습니다.'
      alert(errorMsg)
    } finally {
      setSyncing((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleMatch = async (product: Product, platform: MarketplacePlatform, externalId: string, externalUrl: string) => {
    try {
      const existingLog = getLatestLog(product.id, platform)
      const logData = {
        product_id: product.id,
        platform,
        status: 'synced',
        external_product_id: externalId,
        external_product_url: externalUrl,
        error_message: '',
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (existingLog) {
        await cb.database.updateData(MARKETPLACE_SYNC_LOG_TABLE_ID, existingLog.id, logData)
      } else {
        await cb.database.createData(MARKETPLACE_SYNC_LOG_TABLE_ID, logData)
      }

      setMatchTarget(null)
      router.invalidate()
    } catch {
      alert('매칭 저장에 실패했습니다.')
    }
  }

  const handleUnlink = async (product: Product, platform: MarketplacePlatform) => {
    const log = getLatestLog(product.id, platform)
    if (!log) return
    if (!confirm(`${product.name}의 ${platform === 'naver' ? '네이버' : '쿠팡'} 연결을 해제하시겠습니까?\n(마켓플레이스의 상품은 삭제되지 않습니다)`)) return

    try {
      await cb.database.deleteData(MARKETPLACE_SYNC_LOG_TABLE_ID, log.id)
      router.invalidate()
    } catch {
      alert('연결 해제에 실패했습니다.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">마켓플레이스</h1>
        <div className="flex items-center gap-2">
          {MARKETPLACE_PLATFORMS.map((mp) => {
            const config = configs.find((c) => c.platform === mp.key)
            const isEnabled = config?.is_enabled
            return (
              <span
                key={mp.key}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  isEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isEnabled ? mp.color : '#d1d5db' }}
                />
                {mp.label}
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('sync')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'sync' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          상품 연동
        </button>
        <button
          onClick={() => setTab('category')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'category' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          카테고리 매핑
        </button>
      </div>

      {tab === 'sync' && (
        <SyncTab
          products={filteredProducts}
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          getSyncStatus={getSyncStatus}
          getLatestLog={getLatestLog}
          syncing={syncing}
          handleSync={handleSync}
          handleUnlink={handleUnlink}
          onMatch={(product, platform) => setMatchTarget({ product, platform })}
          naverEnabled={!!naverConfig?.is_enabled}
          coupangEnabled={!!coupangConfig?.is_enabled}
        />
      )}

      {tab === 'category' && (
        <CategoryTab categoryMaps={categoryMaps} />
      )}

      {matchTarget && (
        <MatchModal
          product={matchTarget.product}
          platform={matchTarget.platform}
          existingLog={getLatestLog(matchTarget.product.id, matchTarget.platform)}
          onSave={handleMatch}
          onClose={() => setMatchTarget(null)}
        />
      )}
    </div>
  )
}

/* ───────── Match Modal ───────── */

function MatchModal({
  product,
  platform,
  existingLog,
  onSave,
  onClose,
}: {
  product: Product
  platform: MarketplacePlatform
  existingLog: MarketplaceSyncLog | undefined
  onSave: (product: Product, platform: MarketplacePlatform, externalId: string, externalUrl: string) => void
  onClose: () => void
}) {
  const [externalId, setExternalId] = useState(existingLog?.external_product_id || '')
  const [externalUrl, setExternalUrl] = useState(existingLog?.external_product_url || '')
  const [saving, setSaving] = useState(false)

  const platformLabel = platform === 'naver' ? '네이버 스마트스토어' : '쿠팡'
  const platformColor = platform === 'naver' ? '#03C75A' : '#E31937'

  const handleSubmit = async () => {
    if (!externalId.trim()) {
      alert('상품 ID를 입력해주세요.')
      return
    }
    setSaving(true)
    await onSave(product, platform, externalId.trim(), externalUrl.trim())
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-gray-600" />
            <h3 className="font-bold text-sm">기존 상품 매칭</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 내부 상품 정보 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-gray-200" />
            )}
            <div>
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-gray-400">{formatPrice(product.price)}</p>
            </div>
          </div>

          {/* 연결 화살표 */}
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: platformColor }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColor }} />
              {platformLabel}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* 외부 상품 ID */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">
              {platformLabel} 상품 ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder={platform === 'naver' ? '예: 12345678901' : '예: 7891011121'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              {platform === 'naver'
                ? '스마트스토어 판매자센터 > 상품관리에서 확인할 수 있습니다.'
                : '쿠팡 Wing > 상품관리에서 확인할 수 있습니다.'}
            </p>
          </div>

          {/* 외부 상품 URL */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">
              상품 페이지 URL <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder={platform === 'naver' ? 'https://smartstore.naver.com/...' : 'https://www.coupang.com/vp/products/...'}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 leading-relaxed">
              이미 {platformLabel}에 등록된 상품과 연결합니다. 매칭 후 동기화 버튼을 누르면 <strong>새 상품 생성이 아닌 기존 상품 업데이트</strong>로 동작합니다. 기존 리뷰·판매 이력이 유지됩니다.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !externalId.trim()}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? '저장 중...' : '매칭 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────── Sync Tab ───────── */

function StatusBadge({ status }: { status: string }) {
  if (status === 'synced') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
        <CheckCircle className="w-3 h-3" />
        연동됨
      </span>
    )
  }
  if (status === 'syncing') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
        <RefreshCw className="w-3 h-3 animate-spin" />
        연동중
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
        <XCircle className="w-3 h-3" />
        실패
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
        <Clock className="w-3 h-3" />
        대기
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
      미연동
    </span>
  )
}

function PlatformCell({
  product,
  platform,
  platformColor,
  status,
  log,
  isSyncing,
  isEnabled,
  onSync,
  onMatch,
  onUnlink,
}: {
  product: Product
  platform: MarketplacePlatform
  platformColor: string
  status: string
  log: MarketplaceSyncLog | undefined
  isSyncing: boolean
  isEnabled: boolean
  onSync: () => void
  onMatch: () => void
  onUnlink: () => void
}) {
  const isLinked = log?.external_product_id && log.status === 'synced'

  return (
    <div className="flex flex-col items-center gap-1.5">
      <StatusBadge status={status} />

      {isLinked && (
        <p className="text-[10px] text-gray-400 font-mono max-w-[120px] truncate" title={`ID: ${log.external_product_id}`}>
          ID: {log.external_product_id}
        </p>
      )}

      <div className="flex items-center gap-0.5">
        {/* 외부 링크 */}
        {log?.external_product_url && (
          <a
            href={log.external_product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-gray-400 transition-colors"
            style={{ ['--tw-text-opacity' as string]: 1 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = platformColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            title="상품 페이지 열기"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {/* 매칭 버튼 */}
        {!isLinked && (
          <button
            onClick={onMatch}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="기존 상품 매칭"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 동기화 버튼 */}
        <button
          onClick={onSync}
          disabled={isSyncing || !isEnabled}
          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={isLinked ? '업데이트 동기화' : '새 상품 등록'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>

        {/* 연결 해제 버튼 */}
        {isLinked && (
          <button
            onClick={onUnlink}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="연결 해제"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {log?.error_message && (
        <p className="text-[10px] text-red-500 max-w-[120px] truncate" title={log.error_message}>
          {log.error_message}
        </p>
      )}
    </div>
  )
}

function SyncTab({
  products,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  getSyncStatus,
  getLatestLog,
  syncing,
  handleSync,
  handleUnlink,
  onMatch,
  naverEnabled,
  coupangEnabled,
}: {
  products: Product[]
  filter: SyncFilter
  setFilter: (f: SyncFilter) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  getSyncStatus: (pid: string, platform: MarketplacePlatform) => string
  getLatestLog: (pid: string, platform: MarketplacePlatform) => MarketplaceSyncLog | undefined
  syncing: Record<string, boolean>
  handleSync: (product: Product, platform: MarketplacePlatform) => void
  handleUnlink: (product: Product, platform: MarketplacePlatform) => void
  onMatch: (product: Product, platform: MarketplacePlatform) => void
  naverEnabled: boolean
  coupangEnabled: boolean
}) {
  const filters: { key: SyncFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'matched', label: '매칭됨' },
    { key: 'synced', label: '연동됨' },
    { key: 'unsynced', label: '미연동' },
    { key: 'failed', label: '실패' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === f.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="상품 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 w-64"
          />
        </div>
      </div>

      {(!naverEnabled && !coupangEnabled) && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          마켓플레이스가 설정되지 않았습니다. 설정 페이지에서 먼저 API 키를 등록해주세요.
        </div>
      )}

      {/* 안내 문구 */}
      <div className="flex items-start gap-2 px-4 py-3 mb-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 leading-relaxed">
        <Link2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
        <div>
          <strong className="text-gray-700">기존 상품 매칭:</strong> 이미 네이버/쿠팡에 등록된 상품이 있으면
          <Link2 className="w-3 h-3 inline mx-0.5 -mt-0.5" />버튼으로 상품 ID를 연결하세요.
          매칭 후 동기화하면 새 상품이 아닌 <strong className="text-gray-700">기존 상품을 업데이트</strong>합니다. (리뷰·판매 이력 유지)
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {filter !== 'all' ? '해당 조건의 상품이 없습니다.' : '등록된 상품이 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium">상품</th>
                <th className="text-center px-4 py-3 font-medium">가격</th>
                <th className="text-center px-4 py-3 font-medium">카테고리</th>
                <th className="text-center px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#03C75A' }} />
                    네이버
                  </span>
                </th>
                <th className="text-center px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E31937' }} />
                    쿠팡
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100" />
                      )}
                      <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-4 py-3">
                    <PlatformCell
                      product={product}
                      platform="naver"
                      platformColor="#03C75A"
                      status={getSyncStatus(product.id, 'naver')}
                      log={getLatestLog(product.id, 'naver')}
                      isSyncing={syncing[`${product.id}_naver`]}
                      isEnabled={naverEnabled}
                      onSync={() => handleSync(product, 'naver')}
                      onMatch={() => onMatch(product, 'naver')}
                      onUnlink={() => handleUnlink(product, 'naver')}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <PlatformCell
                      product={product}
                      platform="coupang"
                      platformColor="#E31937"
                      status={getSyncStatus(product.id, 'coupang')}
                      log={getLatestLog(product.id, 'coupang')}
                      isSyncing={syncing[`${product.id}_coupang`]}
                      isEnabled={coupangEnabled}
                      onSync={() => handleSync(product, 'coupang')}
                      onMatch={() => onMatch(product, 'coupang')}
                      onUnlink={() => handleUnlink(product, 'coupang')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ───────── Category Tab ───────── */

function CategoryTab({ categoryMaps }: { categoryMaps: MarketplaceCategoryMap[] }) {
  const internalCategories = CATEGORIES.filter((c) => c.key !== 'all')
  const [editing, setEditing] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const getMapping = (category: string, platform: MarketplacePlatform) => {
    return categoryMaps.find((m) => m.internal_category === category && m.platform === platform)
  }

  const getEditKey = (category: string, platform: MarketplacePlatform) => `${category}_${platform}`

  const getEditValue = (category: string, platform: MarketplacePlatform, field: string) => {
    const key = getEditKey(category, platform)
    if (editing[key]?.[field] !== undefined) return editing[key][field]
    const mapping = getMapping(category, platform)
    if (!mapping) return ''
    if (field === 'id') return mapping.external_category_id
    if (field === 'name') return mapping.external_category_name
    if (field === 'path') return mapping.external_category_path
    return ''
  }

  const setEditValue = (category: string, platform: MarketplacePlatform, field: string, value: string) => {
    const key = getEditKey(category, platform)
    setEditing((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }))
  }

  const handleSave = async (category: string, platform: MarketplacePlatform) => {
    const key = getEditKey(category, platform)
    setSaving((prev) => ({ ...prev, [key]: true }))

    try {
      const existing = getMapping(category, platform)
      const data = {
        internal_category: category,
        platform,
        external_category_id: getEditValue(category, platform, 'id'),
        external_category_name: getEditValue(category, platform, 'name'),
        external_category_path: getEditValue(category, platform, 'path'),
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        await cb.database.updateData(MARKETPLACE_CATEGORY_MAP_TABLE_ID, existing.id, data)
      } else {
        await cb.database.createData(MARKETPLACE_CATEGORY_MAP_TABLE_ID, data)
      }

      setEditing((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      alert('저장되었습니다.')
      window.location.reload()
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        내부 카테고리를 각 마켓플레이스의 카테고리에 매핑합니다. 카테고리 ID는 각 마켓플레이스의 개발자 문서를 참고하세요.
      </p>

      <div className="space-y-6">
        {internalCategories.map((cat) => (
          <div key={cat.key} className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-bold text-sm mb-4">{cat.label}</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {MARKETPLACE_PLATFORMS.map((mp) => {
                const key = getEditKey(cat.key, mp.key)
                const isSaving = saving[key]
                const hasEdits = !!editing[key]

                return (
                  <div key={mp.key} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: mp.color }}
                      />
                      <span className="text-sm font-medium">{mp.label}</span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">카테고리 ID</label>
                        <input
                          type="text"
                          value={getEditValue(cat.key, mp.key, 'id')}
                          onChange={(e) => setEditValue(cat.key, mp.key, 'id', e.target.value)}
                          placeholder="예: 50000803"
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">카테고리 이름</label>
                        <input
                          type="text"
                          value={getEditValue(cat.key, mp.key, 'name')}
                          onChange={(e) => setEditValue(cat.key, mp.key, 'name', e.target.value)}
                          placeholder="예: 남성의류 > 티셔츠"
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">카테고리 경로</label>
                        <input
                          type="text"
                          value={getEditValue(cat.key, mp.key, 'path')}
                          onChange={(e) => setEditValue(cat.key, mp.key, 'path', e.target.value)}
                          placeholder="예: 패션의류 > 남성의류 > 티셔츠"
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>

                      {hasEdits && (
                        <button
                          onClick={() => handleSave(cat.key, mp.key)}
                          disabled={isSaving}
                          className="mt-2 px-4 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                          {isSaving ? '저장 중...' : '저장'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
