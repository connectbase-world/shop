import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Eye, Search, X, ChevronDown } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { ORDERS_TABLE_ID } from '@/lib/constants'
import { toOrders, formatPrice, formatDateTime } from '@/lib/utils'
import type { Order } from '@/lib/types'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: '결제완료', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: '준비중', color: 'bg-yellow-100 text-yellow-700' },
  shipped: { label: '배송중', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: '배송완료', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700' },
}

const STATUS_FLOW: Record<string, string[]> = {
  paid: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
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
    try {
      await cb.database.updateData(ORDERS_TABLE_ID, orderId, {
        data: { status: newStatus },
      })
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <span className="text-sm text-gray-500">{filtered.length}건</span>
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
}: {
  order: Order
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: string) => void
}) {
  const status = STATUS_MAP[order.status] ?? {
    label: order.status,
    color: 'bg-gray-100 text-gray-700',
  }
  const nextStatuses = STATUS_FLOW[order.status] ?? []

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
