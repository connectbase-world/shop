import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Eye, Search, X, ChevronDown, Download } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { ORDERS_TABLE_ID, PRODUCTS_TABLE_ID, COUPONS_TABLE_ID, USER_COUPONS_TABLE_ID, MILEAGE_HISTORY_TABLE_ID } from '@/lib/constants'
import { toOrders, toProducts, toCoupons, toUserCoupons, toMileageHistories, getMileageBalance, formatPrice, formatDateTime } from '@/lib/utils'
import type { Order } from '@/lib/types'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: '결제완료', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: '준비중', color: 'bg-yellow-100 text-yellow-700' },
  shipped: { label: '배송중', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: '배송완료', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700' },
  return_requested: { label: '반품신청', color: 'bg-orange-100 text-orange-700' },
  return_completed: { label: '반품완료', color: 'bg-gray-100 text-gray-700' },
  exchange_requested: { label: '교환신청', color: 'bg-teal-100 text-teal-700' },
  exchange_completed: { label: '교환완료', color: 'bg-emerald-100 text-emerald-700' },
}

const STATUS_FLOW: Record<string, string[]> = {
  paid: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_requested', 'exchange_requested'],
  cancelled: [],
  return_requested: ['return_completed', 'delivered'],
  return_completed: [],
  exchange_requested: ['exchange_completed', 'delivered'],
  exchange_completed: [],
}

export const Route = createFileRoute('/orders/')({
  loader: async () => {
    const result = await cb.database.getData(ORDERS_TABLE_ID, { limit: 1000 })
    const orders = toOrders(result.data ?? [])
    return { orders }
  },
  component: OrderListPage,
})

function isSameDay(date: Date, target: Date) {
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  )
}

function OrderListPage() {
  const loaderData = Route.useLoaderData()
  const [orders, setOrders] = useState<Order[]>(loaderData.orders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    if (newStatus === 'cancelled') {
      if (!confirm('주문을 취소하시겠습니까? 재고, 쿠폰, 마일리지가 복원됩니다.')) return
    }
    if (newStatus === 'return_completed') {
      if (!confirm('반품을 완료 처리하시겠습니까? 재고, 쿠폰, 마일리지가 복원됩니다.')) return
    }

    try {
      await cb.database.updateData(ORDERS_TABLE_ID, orderId, {
        data: { status: newStatus },
      })

      // 취소/반품완료 시 재고/쿠폰/마일리지 복원
      if (newStatus === 'cancelled' || newStatus === 'return_completed') {
        // 재고 복원
        try {
          const stockResult = await cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 })
          const allProducts = toProducts(stockResult.data ?? [])
          for (const item of order.items || []) {
            const product = allProducts.find((p) => p.id === item.productId)
            if (product) {
              await cb.database.updateData(PRODUCTS_TABLE_ID, product.id, {
                data: { stock: product.stock + item.quantity },
              })
            }
          }
        } catch { /* ignore */ }

        // 쿠폰 복원
        if (order.coupon_code && order.member_id) {
          try {
            const ucResult = await cb.database.getData(USER_COUPONS_TABLE_ID, { limit: 1000 })
            const userCoupons = toUserCoupons(ucResult.data ?? [])
            const usedCoupon = userCoupons.find(
              (uc) => uc.member_id === order.member_id && uc.order_id === order.order_id && uc.status === 'used',
            )
            if (usedCoupon) {
              await cb.database.updateData(USER_COUPONS_TABLE_ID, usedCoupon.id, {
                data: { status: 'available', used_at: '', order_id: '' },
              })
            }
            // used_count 감소
            const couponsRes = await cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 })
            const coupons = toCoupons(couponsRes.data ?? [])
            const coupon = coupons.find((c) => c.code === order.coupon_code)
            if (coupon && coupon.used_count > 0) {
              await cb.database.updateData(COUPONS_TABLE_ID, coupon.id, {
                data: { used_count: coupon.used_count - 1 },
              })
            }
          } catch { /* ignore */ }
        }

        // 마일리지 복원 (사용분 환불 + 적립분 회수)
        if (order.member_id) {
          try {
            const mileageResult = await cb.database.getData(MILEAGE_HISTORY_TABLE_ID, { limit: 1000 })
            const allHistories = toMileageHistories(mileageResult.data ?? [])
            const myHistories = allHistories.filter((h) => h.member_id === order.member_id)
            let currentBalance = getMileageBalance(myHistories)

            // 해당 주문의 마일리지 기록 확인
            const orderHistories = myHistories.filter((h) => h.order_id === order.order_id)
            const spendRecord = orderHistories.find((h) => h.type === 'spend')
            const earnRecord = orderHistories.find((h) => h.type === 'earn')

            // 사용분 환불
            if (spendRecord) {
              const refundAmount = Math.abs(spendRecord.amount)
              currentBalance += refundAmount
              await cb.database.createData(MILEAGE_HISTORY_TABLE_ID, {
                data: {
                  member_id: order.member_id,
                  type: 'adjust',
                  amount: refundAmount,
                  balance_after: currentBalance,
                  description: '주문 취소 환불',
                  order_id: order.order_id,
                  created_at: new Date().toISOString(),
                },
              })
            }

            // 적립분 회수
            if (earnRecord && earnRecord.amount > 0) {
              currentBalance -= earnRecord.amount
              await cb.database.createData(MILEAGE_HISTORY_TABLE_ID, {
                data: {
                  member_id: order.member_id,
                  type: 'adjust',
                  amount: -earnRecord.amount,
                  balance_after: currentBalance,
                  description: '주문 취소 적립금 회수',
                  order_id: order.order_id,
                  created_at: new Date().toISOString(),
                },
              })
            }
          } catch { /* ignore */ }
        }
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err) {
      alert('상태 변경에 실패했습니다.')
      console.error(err)
    }
  }

  const sorted = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const filtered = sorted.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false

    if (search) {
      const q = search.toLowerCase()
      const nameMatch = (o.customer_name || '').toLowerCase().includes(q)
      const phoneMatch = (o.customer_phone || '').toLowerCase().includes(q)
      const orderIdMatch = (o.order_id || '').toLowerCase().includes(q)
      const itemMatch = (o.items ?? []).some((item) =>
        item.name.toLowerCase().includes(q),
      )
      if (!nameMatch && !phoneMatch && !orderIdMatch && !itemMatch) return false
    }

    if (dateFrom) {
      const from = new Date(dateFrom)
      const orderDate = new Date(o.created_at)
      if (orderDate < from && !isSameDay(orderDate, from)) return false
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      const orderDate = new Date(o.created_at)
      if (orderDate > to) return false
    }

    return true
  })

  const hasActiveFilters = search || dateFrom || dateTo

  const clearFilters = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('')
  }

  const handleExportCSV = () => {
    const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = ['주문번호', '주문일시', '주문명', '주문자', '연락처', '주소', '상세주소', '메모', '결제금액', '상태', '택배사', '운송장번호', '상품목록']
    const rows = filtered.map((o) => [
      esc(o.order_id),
      esc(formatDateTime(o.created_at)),
      esc(o.order_name),
      esc(o.customer_name),
      esc(o.customer_phone),
      esc(o.address),
      esc(o.address_detail),
      esc(o.memo),
      o.amount,
      esc((STATUS_MAP[o.status]?.label) || o.status),
      esc(o.tracking_carrier || ''),
      esc(o.tracking_number || ''),
      esc((o.items ?? []).map((i) => `${i.name} x${i.quantity}`).join(', ')),
    ])
    const bom = '\uFEFF'
    const csv = bom + [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{filtered.length}건</span>
          {filtered.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              CSV 다운로드
            </button>
          )}
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
            !statusFilter
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          전체
        </button>
        {Object.entries(STATUS_MAP).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              statusFilter === key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 검색 + 날짜 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="주문자, 전화번호, 상품명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            초기화
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          {hasActiveFilters || statusFilter ? '검색 결과가 없습니다.' : '주문 내역이 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">주문번호</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">주문명</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">주문자</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">결제금액</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">주문일시</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => {
                const status = STATUS_MAP[order.status] ?? {
                  label: order.status,
                  color: 'bg-gray-100 text-gray-700',
                }
                const nextStatuses = STATUS_FLOW[order.status] ?? []
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {order.order_id}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{order.order_name}</td>
                    <td className="px-4 py-3">{order.customer_name || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(order.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {nextStatuses.length > 0 ? (
                        <StatusSelect
                          current={order.status}
                          currentLabel={status.label}
                          currentColor={status.color}
                          options={nextStatuses}
                          onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                        />
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onTrackingUpdate={async (orderId, carrier, number) => {
            await cb.database.updateData(ORDERS_TABLE_ID, orderId, {
              data: { tracking_carrier: carrier, tracking_number: number },
            })
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, tracking_carrier: carrier, tracking_number: number } : o)),
            )
            setSelectedOrder((prev) =>
              prev ? { ...prev, tracking_carrier: carrier, tracking_number: number } : null,
            )
          }}
        />
      )}
    </div>
  )
}

function StatusSelect({
  current,
  currentLabel,
  currentColor,
  options,
  onChange,
}: {
  current: string
  currentLabel: string
  currentColor: string
  options: string[]
  onChange: (status: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${currentColor} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        {currentLabel}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]">
            {options.map((key) => {
              const st = STATUS_MAP[key]
              if (!st) return null
              return (
                <button
                  key={key}
                  onClick={() => {
                    onChange(key)
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${st.color.split(' ')[0]}`} />
                  {st.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
  onTrackingUpdate,
}: {
  order: Order
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: string) => void
  onTrackingUpdate: (orderId: string, carrier: string, number: string) => void
}) {
  const [carrier, setCarrier] = useState(order.tracking_carrier || '')
  const [trackingNum, setTrackingNum] = useState(order.tracking_number || '')
  const [savingTracking, setSavingTracking] = useState(false)
  const status = STATUS_MAP[order.status] ?? {
    label: order.status,
    color: 'bg-gray-100 text-gray-700',
  }
  const nextStatuses = STATUS_FLOW[order.status] ?? []

  const handleSaveTracking = async () => {
    setSavingTracking(true)
    await onTrackingUpdate(order.id, carrier, trackingNum)
    setSavingTracking(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">주문 상세</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">주문번호</span>
              <span className="font-mono text-xs">{order.order_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">상태</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">결제금액</span>
              <span className="font-bold">{formatPrice(order.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">주문일시</span>
              <span>{formatDateTime(order.created_at)}</span>
            </div>
            {order.return_reason && (
              <div className="flex justify-between">
                <span className="text-gray-500">반품/교환 사유</span>
                <span className="text-right max-w-[60%] text-orange-700">{order.return_reason}</span>
              </div>
            )}
          </div>

          {/* 상태 변경 */}
          {nextStatuses.length > 0 && (
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">상태 변경</h3>
              <div className="flex gap-2 flex-wrap">
                {nextStatuses.map((key) => {
                  const st = STATUS_MAP[key]
                  if (!st) return null
                  return (
                    <button
                      key={key}
                      onClick={() => onStatusChange(order.id, key)}
                      className={`px-4 py-2 rounded-md text-xs font-medium border transition-colors hover:opacity-80 ${st.color} border-transparent`}
                    >
                      {st.label}으로 변경
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">배송 정보</h3>
            <div className="bg-gray-50 rounded-md p-3 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">수령인</span>
                <span>{order.customer_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">연락처</span>
                <span>{order.customer_phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">주소</span>
                <span className="text-right max-w-[60%]">
                  {order.address}
                  {order.address_detail && ` ${order.address_detail}`}
                </span>
              </div>
              {order.memo && (
                <div className="flex justify-between">
                  <span className="text-gray-500">메모</span>
                  <span className="text-right max-w-[60%]">{order.memo}</span>
                </div>
              )}
            </div>

            {/* 운송장 입력 */}
            {(order.status === 'preparing' || order.status === 'shipped' || order.status === 'delivered') && (
              <div className="mt-3 bg-blue-50 rounded-md p-3">
                <p className="text-xs font-medium text-blue-700 mb-2">운송장 정보</p>
                <div className="flex gap-2">
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded text-xs outline-none bg-white"
                  >
                    <option value="">택배사</option>
                    <option value="cj">CJ대한통운</option>
                    <option value="hanjin">한진택배</option>
                    <option value="lotte">롯데택배</option>
                    <option value="logen">로젠택배</option>
                    <option value="post">우체국택배</option>
                    <option value="gs">GS25편의점택배</option>
                    <option value="etc">기타</option>
                  </select>
                  <input
                    type="text"
                    value={trackingNum}
                    onChange={(e) => setTrackingNum(e.target.value)}
                    placeholder="운송장 번호"
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={handleSaveTracking}
                    disabled={savingTracking || !carrier || !trackingNum}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 shrink-0"
                  >
                    {savingTracking ? '저장...' : '저장'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              주문 상품 ({order.items?.length ?? 0}개)
            </h3>
            <div className="border border-gray-100 rounded-md divide-y divide-gray-100">
              {(order.items ?? []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.name}</p>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <p className="text-xs text-gray-400">{Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' / ')}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formatPrice(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
