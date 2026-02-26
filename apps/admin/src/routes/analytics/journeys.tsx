import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Eye, Package, ShoppingCart, CreditCard, LogIn, LogOut,
  Search, Star, MessageCircle, ArrowLeft, Users, Activity,
  ChevronRight, Filter,
} from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { ANALYTICS_EVENTS_TABLE_ID } from '@/lib/constants'
import { toAnalyticsEvents, formatPrice } from '@/lib/utils'
import type { AnalyticsEvent } from '@/lib/types'

export const Route = createFileRoute('/analytics/journeys')({
  loader: async () => {
    const res = await cb.database.getData(ANALYTICS_EVENTS_TABLE_ID, { limit: 1000 })
    return { events: toAnalyticsEvents(res.data ?? []) }
  },
  component: JourneysPage,
})

type VisitorSummary = {
  key: string
  memberId: string
  nickname: string
  visitorId: string
  eventCount: number
  lastActive: string
  sessions: number
}

const EVENT_CONFIG: Record<string, { icon: typeof Eye; color: string; label: string }> = {
  page_view: { icon: Eye, color: 'text-gray-500 bg-gray-100', label: '페이지뷰' },
  product_view: { icon: Package, color: 'text-purple-600 bg-purple-50', label: '상품 조회' },
  add_to_cart: { icon: ShoppingCart, color: 'text-orange-600 bg-orange-50', label: '장바구니' },
  purchase_complete: { icon: CreditCard, color: 'text-green-600 bg-green-50', label: '구매 완료' },
  login: { icon: LogIn, color: 'text-blue-600 bg-blue-50', label: '로그인' },
  logout: { icon: LogOut, color: 'text-red-600 bg-red-50', label: '로그아웃' },
  search: { icon: Search, color: 'text-gray-500 bg-gray-100', label: '검색' },
  review_created: { icon: Star, color: 'text-yellow-600 bg-yellow-50', label: '리뷰 작성' },
  qna_created: { icon: MessageCircle, color: 'text-blue-600 bg-blue-50', label: 'Q&A 작성' },
}

function getEventConfig(type: string) {
  return EVENT_CONFIG[type] || { icon: Activity, color: 'text-gray-500 bg-gray-100', label: type }
}

function buildVisitorSummaries(events: AnalyticsEvent[]): VisitorSummary[] {
  // Group by visitor_id so each browser/device is separate
  // Events with empty visitor_id are merged into same member_id's visitor group
  const map = new Map<string, {
    memberId: string
    nickname: string
    visitorId: string
    events: AnalyticsEvent[]
    sessions: Set<string>
  }>()

  // Build member_id → visitor_id lookup for events missing visitor_id
  const memberToVisitor = new Map<string, string>()
  for (const e of events) {
    if (e.visitor_id && e.member_id) {
      memberToVisitor.set(e.member_id, e.visitor_id)
    }
  }

  for (const e of events) {
    // If visitor_id is missing, try to find it via member_id
    let key = e.visitor_id
    if (!key && e.member_id) {
      key = memberToVisitor.get(e.member_id) || e.member_id
    }
    if (!key) continue

    if (!map.has(key)) {
      map.set(key, {
        memberId: '',
        nickname: '',
        visitorId: e.visitor_id || '',
        events: [],
        sessions: new Set(),
      })
    }
    const entry = map.get(key)!
    entry.events.push(e)
    if (e.session_id) entry.sessions.add(e.session_id)

    // Extract nickname from login events
    if (e.event_type === 'login' && e.event_data) {
      const data = e.event_data as Record<string, unknown>
      if (typeof data.nickname === 'string' && data.nickname) {
        entry.nickname = data.nickname
      }
    }

    // Keep memberId updated
    if (e.member_id && !entry.memberId) {
      entry.memberId = e.member_id
    }
  }

  return [...map.entries()].map(([key, data]) => ({
    key,
    memberId: data.memberId,
    nickname: data.nickname,
    visitorId: data.visitorId,
    eventCount: data.events.length,
    lastActive: data.events.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]?.created_at || '',
    sessions: data.sessions.size,
  })).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
}

function JourneysPage() {
  const { events } = Route.useLoaderData()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'members'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const visitors = useMemo(() => buildVisitorSummaries(events), [events])

  const filteredVisitors = useMemo(() => {
    let list = visitors
    if (filterMode === 'members') {
      list = list.filter((v) => v.memberId)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (v) =>
          v.nickname.toLowerCase().includes(q) ||
          v.memberId.toLowerCase().includes(q) ||
          v.visitorId.toLowerCase().includes(q),
      )
    }
    return list
  }, [visitors, filterMode, searchQuery])

  const selectedVisitor = visitors.find((v) => v.key === selectedKey)

  // Events for selected visitor (by visitor_id)
  const visitorEvents = useMemo(() => {
    if (!selectedKey) return []
    return events
      .filter((e) => (e.visitor_id || e.member_id) === selectedKey)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [events, selectedKey])

  // Journey summary
  const summary = useMemo(() => {
    if (visitorEvents.length === 0) return null
    const sessions = new Set(visitorEvents.map((e) => e.session_id)).size
    const pageViews = visitorEvents.filter((e) => e.event_type === 'page_view').length
    const productViews = visitorEvents.filter((e) => e.event_type === 'product_view').length
    const uniqueProducts = new Set(
      visitorEvents.filter((e) => e.event_type === 'product_view' && e.product_id).map((e) => e.product_id),
    ).size
    const addToCarts = visitorEvents.filter((e) => e.event_type === 'add_to_cart').length
    const purchases = visitorEvents.filter((e) => e.event_type === 'purchase_complete').length
    let totalSpent = 0
    visitorEvents
      .filter((e) => e.event_type === 'purchase_complete')
      .forEach((e) => {
        const data = e.event_data as Record<string, unknown> | undefined
        if (data && typeof data.amount === 'number') totalSpent += data.amount
      })
    const firstEvent = visitorEvents[visitorEvents.length - 1]?.created_at || ''
    const lastEvent = visitorEvents[0]?.created_at || ''
    return { sessions, pageViews, productViews, uniqueProducts, addToCarts, purchases, totalSpent, firstEvent, lastEvent }
  }, [visitorEvents])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <a href="/analytics" className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          사용자 여정
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Visitor List */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="닉네임, ID 검색..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:border-gray-400"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                    filterMode === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  전체
                </button>
                <button
                  onClick={() => setFilterMode('members')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                    filterMode === 'members' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  회원만
                </button>
                <span className="ml-auto text-xs text-gray-400">{filteredVisitors.length}명</span>
              </div>
            </div>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredVisitors.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">방문자가 없습니다</p>
              ) : (
                filteredVisitors.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setSelectedKey(v.key)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      selectedKey === v.key ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {v.nickname || (v.memberId ? `회원 ${v.memberId.slice(0, 8)}` : `방문자 ${v.visitorId.slice(0, 8)}`)}
                      </p>
                      {v.memberId ? (
                        <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded mt-0.5">회원</span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded mt-0.5">비회원</span>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{v.eventCount}건</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{v.sessions}세션</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(v.lastActive).toLocaleString('ko-KR', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Timeline + Summary */}
        <div className="lg:col-span-8 xl:col-span-9">
          {!selectedVisitor ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">왼쪽에서 방문자를 선택하면 여정을 확인할 수 있습니다</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  {[
                    { label: '세션', value: summary.sessions },
                    { label: '페이지뷰', value: summary.pageViews },
                    { label: '상품 조회', value: `${summary.uniqueProducts}개 (${summary.productViews}회)` },
                    { label: '장바구니', value: summary.addToCarts },
                    { label: '구매', value: summary.purchases },
                    { label: '총 구매액', value: formatPrice(summary.totalSpent) },
                  ].map((card) => (
                    <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-3">
                      <p className="text-[11px] text-gray-400 mb-1">{card.label}</p>
                      <p className="text-lg font-bold">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Visitor Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedVisitor.nickname || (selectedVisitor.memberId ? `회원 ${selectedVisitor.memberId.slice(0, 8)}` : `익명 방문자`)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    {selectedVisitor.memberId && <span>ID: {selectedVisitor.memberId.slice(0, 12)}...</span>}
                    <span>Visitor: {selectedVisitor.visitorId.slice(0, 12)}...</span>
                    {summary && (
                      <span>
                        {new Date(summary.firstEvent).toLocaleDateString('ko-KR')} ~ {new Date(summary.lastEvent).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  행동 타임라인 ({visitorEvents.length}건)
                </h3>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

                  <div className="flex flex-col gap-0">
                    {visitorEvents.map((event, idx) => {
                      const config = getEventConfig(event.event_type)
                      const Icon = config.icon
                      const prevEvent = visitorEvents[idx - 1]
                      const showSessionBreak = prevEvent && prevEvent.session_id !== event.session_id

                      return (
                        <div key={event.id}>
                          {showSessionBreak && (
                            <div className="flex items-center gap-2 py-2 ml-1">
                              <div className="w-8 flex justify-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300" />
                              </div>
                              <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                새 세션
                              </span>
                            </div>
                          )}
                          <div className="flex items-start gap-3 py-2 hover:bg-gray-50 rounded-md px-1 transition-colors group">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color} relative z-10`}>
                              <Icon className="w-4 h-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                                  {config.label}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {event.page_path}
                                </span>
                              </div>
                              {event.product_name && (
                                <p className="text-sm text-gray-700 mt-1">
                                  {event.product_name}
                                </p>
                              )}
                              {event.event_data && Object.keys(event.event_data).length > 0 && (
                                <EventDataDetail data={event.event_data} eventType={event.event_type} />
                              )}
                            </div>

                            {/* Timestamp */}
                            <span className="text-[11px] text-gray-400 whitespace-nowrap pt-1.5 flex-shrink-0">
                              {new Date(event.created_at).toLocaleString('ko-KR', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {visitorEvents.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">이벤트가 없습니다</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EventDataDetail({ data, eventType }: { data: Record<string, unknown>; eventType: string }) {
  if (eventType === 'purchase_complete') {
    const d = data as { amount?: number; item_count?: number; order_id?: string }
    return (
      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
        {d.amount != null && <span className="font-medium text-green-600">{formatPrice(d.amount as number)}</span>}
        {d.item_count != null && <span>{d.item_count}개 상품</span>}
        {d.order_id && <span className="font-mono text-gray-400">#{(d.order_id as string).slice(0, 8)}</span>}
      </div>
    )
  }
  if (eventType === 'search') {
    const d = data as { keyword?: string }
    return d.keyword ? (
      <p className="text-xs text-gray-500 mt-1">검색어: "{d.keyword}"</p>
    ) : null
  }
  if (eventType === 'add_to_cart') {
    const d = data as { quantity?: number; price?: number }
    return (
      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
        {d.quantity != null && <span>수량: {d.quantity}</span>}
        {d.price != null && <span>{formatPrice(d.price as number)}</span>}
      </div>
    )
  }
  if (eventType === 'login') {
    const d = data as { nickname?: string }
    return d.nickname ? (
      <p className="text-xs text-gray-500 mt-1">닉네임: {d.nickname}</p>
    ) : null
  }
  if (eventType === 'review_created') {
    const d = data as { rating?: number; product_id?: string }
    return d.rating != null ? (
      <p className="text-xs text-gray-500 mt-1">평점: {'★'.repeat(d.rating as number)}{'☆'.repeat(5 - (d.rating as number))}</p>
    ) : null
  }
  return null
}
