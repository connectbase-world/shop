import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Package, AlertTriangle, ClipboardList, TrendingUp,
  ArrowUpRight, ArrowDownRight, ShoppingCart, Eye, Users,
} from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { PRODUCTS_TABLE_ID, ORDERS_TABLE_ID, CATEGORIES, ANALYTICS_EVENTS_TABLE_ID } from '@/lib/constants'
import { toProducts, toOrders, toAnalyticsEvents, formatPrice, formatDateTime } from '@/lib/utils'
import type { Product, Order, AnalyticsEvent } from '@/lib/types'

export const Route = createFileRoute('/')(
  {
    loader: async () => {
      const [productsResult, ordersResult, eventsResult] = await Promise.all([
        cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 }),
        cb.database.getData(ORDERS_TABLE_ID, { limit: 1000 }),
        cb.database.getData(ANALYTICS_EVENTS_TABLE_ID, { limit: 1000 }).catch(() => ({ data: [] })),
      ])
      const products = toProducts(productsResult.data ?? [])
      const orders = toOrders(ordersResult.data ?? [])
      const analyticsEvents = toAnalyticsEvents(eventsResult.data ?? [])
      return { products, orders, analyticsEvents }
    },
    component: DashboardPage,
  },
)

// --- 유틸 ---

function getDailyRevenue(orders: Order[], days: number) {
  const now = new Date()
  const result: { date: string; label: string; revenue: number; count: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    const dayOrders = orders.filter((o) => o.created_at?.slice(0, 10) === dateStr)
    result.push({
      date: dateStr,
      label,
      revenue: dayOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
      count: dayOrders.length,
    })
  }
  return result
}

function getOrderStatusCounts(orders: Order[]) {
  const map: Record<string, number> = {}
  for (const o of orders) {
    const s = o.status || 'unknown'
    map[s] = (map[s] || 0) + 1
  }
  return map
}

function getTopProducts(orders: Order[], products: Product[], limit: number) {
  const countMap: Record<string, number> = {}
  const revenueMap: Record<string, number> = {}
  for (const o of orders) {
    if (!o.items) continue
    for (const item of o.items) {
      countMap[item.productId] = (countMap[item.productId] || 0) + item.quantity
      revenueMap[item.productId] = (revenueMap[item.productId] || 0) + item.price * item.quantity
    }
  }
  const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, limit)
  return sorted.map(([id, qty]) => {
    const product = products.find((p) => p.id === id)
    return { id, name: product?.name ?? '삭제된 상품', image: product?.image, qty, revenue: revenueMap[id] || 0 }
  })
}

function getLowStockProducts(products: Product[], threshold: number) {
  return products.filter((p) => p.stock <= threshold).sort((a, b) => a.stock - b.stock)
}

// --- 차트 컴포넌트 ---

function BarChart({ data }: { data: { label: string; revenue: number; count: number }[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const barWidth = 100 / data.length

  return (
    <div className="w-full">
      <div className="flex items-end gap-1 h-44">
        {data.map((d, i) => {
          const height = (d.revenue / maxRevenue) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div
                className="w-full max-w-[32px] bg-blue-500 rounded-t transition-all group-hover:bg-blue-600"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                {formatPrice(d.revenue)} / {d.count}건
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-gray-400 truncate">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-gray-400">주문 데이터 없음</p>
      </div>
    )
  }

  const size = 120
  const stroke = 20
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0 -rotate-90">
        {data.map((d, i) => {
          const pct = d.value / total
          const dashArray = `${circumference * pct} ${circumference * (1 - pct)}`
          const dashOffset = -circumference * offset
          offset += pct
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          )
        })}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-900 text-lg font-bold rotate-90"
          style={{ transformOrigin: 'center' }}
        >
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-gray-600">{d.label}</span>
            <span className="font-medium text-gray-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- 상태 표시 ---

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: '결제완료', color: '#3b82f6' },
  preparing: { label: '준비중', color: '#f59e0b' },
  shipping: { label: '배송중', color: '#8b5cf6' },
  delivered: { label: '배송완료', color: '#22c55e' },
  cancelled: { label: '취소', color: '#ef4444' },
  refunded: { label: '환불', color: '#6b7280' },
}

function getStatusInfo(status: string) {
  return STATUS_MAP[status] || { label: status, color: '#9ca3af' }
}

// --- 메인 ---

function DashboardPage() {
  const { products, orders, analyticsEvents } = Route.useLoaderData()

  const totalProducts = products.length
  const outOfStock = products.filter((p) => p.stock === 0).length
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0)

  // 오늘 vs 어제 비교
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // 오늘 방문자 (회원/비회원 구분) - visitor_id 없는 이벤트는 같은 member의 visitor에 합침
  const todayEvents = analyticsEvents.filter((e) => e.created_at?.slice(0, 10) === today)
  const memberToVisitor = new Map<string, string>()
  for (const e of todayEvents) {
    if (e.visitor_id && e.member_id) memberToVisitor.set(e.member_id, e.visitor_id)
  }
  const todayVisitorIds = new Set<string>()
  const todayMemberVisitorIds = new Set<string>()
  for (const e of todayEvents) {
    const vid = e.visitor_id || (e.member_id && memberToVisitor.get(e.member_id)) || ''
    if (!vid) continue
    todayVisitorIds.add(vid)
    if (e.member_id) todayMemberVisitorIds.add(vid)
  }
  const todayMemberCount = todayMemberVisitorIds.size
  const todayGuestCount = todayVisitorIds.size - todayMemberCount
  const todayOrders = orders.filter((o) => o.created_at?.slice(0, 10) === today)
  const yesterdayOrders = orders.filter((o) => o.created_at?.slice(0, 10) === yesterday)
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.amount || 0), 0)
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + (o.amount || 0), 0)
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : todayRevenue > 0 ? 100 : 0
  const orderChange = yesterdayOrders.length > 0 ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100 : todayOrders.length > 0 ? 100 : 0

  // 7일 매출 차트
  const daily = getDailyRevenue(orders, 7)

  // 주문 상태 도넛
  const statusCounts = getOrderStatusCounts(orders)
  const donutData = Object.entries(statusCounts).map(([status, count]) => {
    const info = getStatusInfo(status)
    return { label: info.label, value: count, color: info.color }
  })

  // 인기 상품
  const topProducts = getTopProducts(orders, products, 5)

  // 재고 부족 상품 (5개 이하)
  const lowStock = getLowStockProducts(products, 5).slice(0, 5)

  // 최근 주문
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // 카테고리 분포
  const categoryCounts = CATEGORIES.filter((c) => c.key !== 'all').map((cat) => ({
    label: cat.label,
    count: products.filter((p) => p.category === cat.key).length,
  }))

  const stats = [
    {
      label: '오늘 매출',
      value: formatPrice(todayRevenue),
      sub: `어제 ${formatPrice(yesterdayRevenue)}`,
      change: revenueChange,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: '오늘 주문',
      value: `${todayOrders.length}건`,
      sub: `어제 ${yesterdayOrders.length}건`,
      change: orderChange,
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: '오늘 방문자',
      value: `${todayVisitorIds.size}명`,
      sub: `회원 ${todayMemberCount}명 · 비회원 ${todayGuestCount}명`,
      change: null,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: '전체 상품',
      value: `${totalProducts}개`,
      sub: `품절 ${outOfStock}개`,
      change: null,
      icon: Package,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: '총 매출',
      value: formatPrice(totalRevenue),
      sub: `총 ${totalOrders}건`,
      change: null,
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Link
          to="/products/new"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
        >
          상품 등록
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <div className={`w-9 h-9 rounded-md flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">{stat.sub}</span>
                {stat.change !== null && (
                  <span className={`flex items-center gap-0.5 font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {stat.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(stat.change).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* 7일 매출 추이 */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">최근 7일 매출</h2>
            <span className="text-xs text-gray-400">막대에 마우스를 올려 상세 확인</span>
          </div>
          <BarChart data={daily} />
        </div>

        {/* 주문 상태 분포 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">주문 상태</h2>
          <DonutChart data={donutData} />
        </div>
      </div>

      {/* 하단 3단 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* 인기 상품 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">인기 상품 TOP 5</h2>
            <Eye className="w-4 h-4 text-gray-300" />
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">주문 데이터가 없습니다</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-400 text-center shrink-0">
                    {i + 1}
                  </span>
                  {item.image ? (
                    <img src={item.image} alt="" className="w-8 h-8 rounded bg-gray-100 object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.qty}개 판매</p>
                  </div>
                  <span className="text-xs font-medium text-gray-600 shrink-0">
                    {formatPrice(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 재고 부족 알림 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">재고 부족 알림</h2>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">재고 부족 상품이 없습니다</p>
          ) : (
            <div className="flex flex-col gap-3">
              {lowStock.map((p) => (
                <Link
                  key={p.id}
                  to="/products/$productId/edit"
                  params={{ productId: p.id }}
                  className="flex items-center gap-3 hover:bg-gray-50 rounded p-1 -mx-1 transition-colors"
                >
                  {p.image ? (
                    <img src={p.image} alt="" className="w-8 h-8 rounded bg-gray-100 object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${
                    p.stock === 0
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {p.stock === 0 ? '품절' : `${p.stock}개`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 카테고리 분포 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">카테고리 분포</h2>
          <div className="flex flex-col gap-2.5">
            {categoryCounts.map((cat) => {
              const pct = totalProducts > 0 ? (cat.count / totalProducts) * 100 : 0
              return (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{cat.label}</span>
                    <span className="text-xs font-medium text-gray-900">{cat.count}개</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-800 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 최근 주문 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">최근 주문</h2>
          <Link to="/orders" className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
            전체 보기 →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">주문이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="py-2 pr-4 text-xs font-medium text-gray-400">주문번호</th>
                  <th className="py-2 pr-4 text-xs font-medium text-gray-400">주문자</th>
                  <th className="py-2 pr-4 text-xs font-medium text-gray-400">상품</th>
                  <th className="py-2 pr-4 text-xs font-medium text-gray-400 text-right">금액</th>
                  <th className="py-2 pr-4 text-xs font-medium text-gray-400">상태</th>
                  <th className="py-2 text-xs font-medium text-gray-400">일시</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const statusInfo = getStatusInfo(o.status)
                  return (
                    <tr key={o.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-xs text-gray-500 font-mono">
                        {o.order_id?.slice(-8) || '-'}
                      </td>
                      <td className="py-3 pr-4 text-gray-900">{o.customer_name || '-'}</td>
                      <td className="py-3 pr-4 text-gray-600 truncate max-w-[200px]">
                        {o.order_name || '-'}
                      </td>
                      <td className="py-3 pr-4 text-gray-900 font-medium text-right">
                        {formatPrice(o.amount || 0)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-400">
                        {o.created_at ? formatDateTime(o.created_at) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
