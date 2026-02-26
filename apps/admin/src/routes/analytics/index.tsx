import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BarChart3, Eye, ShoppingCart, CreditCard, Users, TrendingUp, Activity, Package, ArrowRight } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { ANALYTICS_EVENTS_TABLE_ID, ANALYTICS_DAILY_TABLE_ID } from '@/lib/constants'
import { toAnalyticsEvents, toAnalyticsDailies, formatPrice } from '@/lib/utils'
import type { AnalyticsEvent, AnalyticsDaily } from '@/lib/types'

export const Route = createFileRoute('/analytics/')({
  loader: async () => {
    const [eventsRes, dailyRes] = await Promise.all([
      cb.database.getData(ANALYTICS_EVENTS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(ANALYTICS_DAILY_TABLE_ID, { limit: 1000 }),
    ])
    const events = toAnalyticsEvents(eventsRes.data ?? [])
    const dailies = toAnalyticsDailies(dailyRes.data ?? [])
    return { events, dailies }
  },
  component: AnalyticsPage,
})

function getDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return getDateStr(d)
}

function aggregateFromEvents(events: AnalyticsEvent[], startDate: string, endDate: string) {
  const filtered = events.filter((e) => {
    const d = e.created_at?.slice(0, 10)
    return d && d >= startDate && d <= endDate
  })

  const pageViews = filtered.filter((e) => e.event_type === 'page_view').length
  const uniqueVisitors = new Set(filtered.map((e) => e.visitor_id)).size
  const productViews = filtered.filter((e) => e.event_type === 'product_view').length
  const addToCarts = filtered.filter((e) => e.event_type === 'add_to_cart').length
  const purchases = filtered.filter((e) => e.event_type === 'purchase_complete').length

  let revenue = 0
  filtered
    .filter((e) => e.event_type === 'purchase_complete')
    .forEach((e) => {
      const data = e.event_data as Record<string, unknown> | undefined
      if (data && typeof data.amount === 'number') revenue += data.amount
    })

  // Daily breakdown
  const dailyMap = new Map<string, { pv: number; purchases: number; revenue: number; visitors: Set<string> }>()
  filtered.forEach((e) => {
    const d = e.created_at?.slice(0, 10)
    if (!d) return
    if (!dailyMap.has(d)) dailyMap.set(d, { pv: 0, purchases: 0, revenue: 0, visitors: new Set() })
    const entry = dailyMap.get(d)!
    entry.visitors.add(e.visitor_id)
    if (e.event_type === 'page_view') entry.pv++
    if (e.event_type === 'purchase_complete') {
      entry.purchases++
      const data = e.event_data as Record<string, unknown> | undefined
      if (data && typeof data.amount === 'number') entry.revenue += data.amount
    }
  })

  // Top products by product_view
  const productViewMap = new Map<string, { id: string; name: string; views: number }>()
  filtered
    .filter((e) => e.event_type === 'product_view')
    .forEach((e) => {
      const existing = productViewMap.get(e.product_id) || { id: e.product_id, name: e.product_name || e.product_id, views: 0 }
      existing.views++
      productViewMap.set(e.product_id, existing)
    })
  const topProducts = [...productViewMap.values()].sort((a, b) => b.views - a.views).slice(0, 10)

  return {
    pageViews, uniqueVisitors, productViews, addToCarts, purchases, revenue,
    dailyMap, topProducts,
  }
}

function AnalyticsPage() {
  const { events, dailies } = Route.useLoaderData()
  const [range, setRange] = useState<7 | 30>(7)

  const today = getDateStr(new Date())
  const startDate = getDaysAgo(range - 1)

  // Use daily aggregates if available, otherwise compute from raw events
  const hasDailies = dailies.length > 0
  const computed = aggregateFromEvents(events, startDate, today)

  // Build date array for charts
  const dateLabels: string[] = []
  for (let i = range - 1; i >= 0; i--) {
    dateLabels.push(getDaysAgo(i))
  }

  // Today's data from events
  const todayEvents = events.filter((e) => e.created_at?.slice(0, 10) === today)
  const todayPV = todayEvents.filter((e) => e.event_type === 'page_view').length
  const todayVisitors = new Set(todayEvents.map((e) => e.visitor_id)).size
  const todayProductViews = todayEvents.filter((e) => e.event_type === 'product_view').length
  const todayAddToCarts = todayEvents.filter((e) => e.event_type === 'add_to_cart').length
  const todayPurchases = todayEvents.filter((e) => e.event_type === 'purchase_complete').length
  let todayRevenue = 0
  todayEvents.filter((e) => e.event_type === 'purchase_complete').forEach((e) => {
    const data = e.event_data as Record<string, unknown> | undefined
    if (data && typeof data.amount === 'number') todayRevenue += data.amount
  })

  const kpiCards = [
    { label: '오늘 방문자', value: todayVisitors, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: '페이지뷰', value: todayPV, icon: Eye, color: 'text-indigo-600 bg-indigo-50' },
    { label: '상품 조회', value: todayProductViews, icon: Package, color: 'text-purple-600 bg-purple-50' },
    { label: '장바구니', value: todayAddToCarts, icon: ShoppingCart, color: 'text-orange-600 bg-orange-50' },
    { label: '구매', value: todayPurchases, icon: CreditCard, color: 'text-green-600 bg-green-50' },
    { label: '매출', value: formatPrice(todayRevenue), icon: TrendingUp, color: 'text-red-600 bg-red-50' },
  ]

  // Daily chart data
  const chartData = dateLabels.map((d) => {
    if (hasDailies) {
      const daily = dailies.find((dd) => dd.date === d)
      return { date: d, pv: daily?.page_views || 0, purchases: daily?.purchases || 0, revenue: daily?.revenue || 0 }
    }
    const entry = computed.dailyMap.get(d)
    return { date: d, pv: entry?.pv || 0, purchases: entry?.purchases || 0, revenue: entry?.revenue || 0 }
  })

  const maxPV = Math.max(...chartData.map((d) => d.pv), 1)
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1)

  // Funnel
  const funnelPV = computed.productViews
  const funnelCart = computed.addToCarts
  const funnelPurchase = computed.purchases

  // Recent events
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)

  const eventTypeLabel: Record<string, string> = {
    page_view: '페이지뷰',
    product_view: '상품 조회',
    add_to_cart: '장바구니 추가',
    purchase_complete: '구매 완료',
    review_created: '리뷰 작성',
    qna_created: 'Q&A 작성',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            애널리틱스
          </h1>
          <Link
            to="/analytics/journeys"
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            사용자 여정
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setRange(7)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${range === 7 ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            7일
          </button>
          <button
            onClick={() => setRange(30)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${range === 30 ? 'bg-white shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            30일
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-gray-500">{card.label}</span>
              </div>
              <p className="text-xl font-bold">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Trend Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            일별 페이지뷰 / 구매
          </h3>
          <div className="flex items-end gap-1 h-40">
            {chartData.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full flex flex-col items-center gap-0.5">
                  <div
                    className="w-full bg-blue-200 rounded-t-sm min-h-[2px] transition-all"
                    style={{ height: `${Math.max((d.pv / maxPV) * 120, 2)}px` }}
                  />
                  <div
                    className="w-full bg-green-400 rounded-t-sm min-h-[1px] transition-all"
                    style={{ height: `${Math.max((d.purchases / Math.max(maxPV, 1)) * 120, d.purchases > 0 ? 4 : 1)}px` }}
                  />
                </div>
                <span className="text-[9px] text-gray-400 hidden sm:block">{d.date.slice(5)}</span>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  PV:{d.pv} 구매:{d.purchases}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-blue-200 rounded-sm inline-block" /> 페이지뷰</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-400 rounded-sm inline-block" /> 구매</span>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            일별 매출
          </h3>
          <div className="flex items-end gap-1 h-40">
            {chartData.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center group relative">
                <div
                  className="w-full bg-red-200 rounded-t-sm min-h-[2px] transition-all"
                  style={{ height: `${Math.max((d.revenue / maxRevenue) * 130, 2)}px` }}
                />
                <span className="text-[9px] text-gray-400 mt-1 hidden sm:block">{d.date.slice(5)}</span>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {formatPrice(d.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" />
            인기 상품 Top 10
          </h3>
          {computed.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">데이터가 없습니다</p>
          ) : (
            <div className="flex flex-col gap-2">
              {computed.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 text-sm">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-gray-500 text-xs">{p.views}회</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            구매 퍼널 ({range}일)
          </h3>
          <div className="flex flex-col gap-4 mt-2">
            {[
              { label: '상품 조회', value: computed.productViews, pct: funnelPV > 0 ? 100 : 0 },
              { label: '장바구니 추가', value: funnelCart, pct: funnelPV > 0 ? Math.round((funnelCart / funnelPV) * 100) : 0 },
              { label: '구매 완료', value: funnelPurchase, pct: funnelPV > 0 ? Math.round((funnelPurchase / funnelPV) * 100) : 0 },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{step.label}</span>
                  <span className="text-gray-500">{step.value.toLocaleString()} ({step.pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {funnelPV > 0 && (
            <p className="text-xs text-gray-400 mt-4 text-center">
              전환율: {((funnelPurchase / funnelPV) * 100).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Period Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            기간 요약 ({range}일)
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: '총 방문자', value: computed.uniqueVisitors.toLocaleString() },
              { label: '총 페이지뷰', value: computed.pageViews.toLocaleString() },
              { label: '총 상품 조회', value: computed.productViews.toLocaleString() },
              { label: '총 장바구니 추가', value: computed.addToCarts.toLocaleString() },
              { label: '총 구매', value: computed.purchases.toLocaleString() },
              { label: '총 매출', value: formatPrice(computed.revenue) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Events Feed */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          실시간 이벤트 (최근 20건)
        </h3>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">아직 이벤트가 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left py-2 pr-4 font-medium">시간</th>
                  <th className="text-left py-2 pr-4 font-medium">이벤트</th>
                  <th className="text-left py-2 pr-4 font-medium">경로</th>
                  <th className="text-left py-2 pr-4 font-medium">상품</th>
                  <th className="text-left py-2 font-medium">방문자</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.event_type === 'purchase_complete' ? 'bg-green-50 text-green-600' :
                        e.event_type === 'add_to_cart' ? 'bg-orange-50 text-orange-600' :
                        e.event_type === 'product_view' ? 'bg-purple-50 text-purple-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {eventTypeLabel[e.event_type] || e.event_type}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-xs text-gray-500 max-w-[200px] truncate">{e.page_path}</td>
                    <td className="py-2 pr-4 text-xs text-gray-500 max-w-[150px] truncate">{e.product_name || '-'}</td>
                    <td className="py-2 text-xs text-gray-400 font-mono">{e.visitor_id?.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
