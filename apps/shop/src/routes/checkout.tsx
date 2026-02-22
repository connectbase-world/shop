import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, toCoupons, toUserCoupons, toMileageHistories, getMileageBalance, formatDiscount, calculateDiscount } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, PROFILES_TABLE_ID, COUPONS_TABLE_ID, USER_COUPONS_TABLE_ID, MILEAGE_HISTORY_TABLE_ID, MILEAGE_EARN_RATE } from '@/lib/constants'
import { User, X, Ticket, Coins } from 'lucide-react'
import type { OrderInfo, CartItem, Coupon, UserCoupon } from '@/lib/types'

type CheckoutSearch = {
  buyNow?: string
}

export const Route = createFileRoute('/checkout')({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    buyNow: search.buyNow as string | undefined,
  }),
  component: CheckoutPage,
})

function CheckoutPage() {
  const { items: cartItems, totalItems: cartTotalItems, totalPrice: cartTotalPrice, clearCart } = useCart()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { buyNow } = Route.useSearch()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<OrderInfo>({
    name: '',
    phone: '',
    address: '',
    addressDetail: '',
    memo: '',
  })

  const isBuyNow = buyNow === 'true'
  const [profileLoaded, setProfileLoaded] = useState(false)

  // 쿠폰 관련 state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [appliedUserCouponId, setAppliedUserCouponId] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [showCouponPicker, setShowCouponPicker] = useState(false)
  const [myCoupons, setMyCoupons] = useState<{ coupon: Coupon; userCoupon: UserCoupon }[]>([])

  // 마일리지 관련 state
  const [mileageBalance, setMileageBalance] = useState(0)
  const [mileageUse, setMileageUse] = useState(0)

  // 로그인한 경우 저장된 프로필에서 배송 정보 자동 입력
  useEffect(() => {
    if (profileLoaded || authLoading || !user) return
    setProfileLoaded(true)

    const loadProfile = async () => {
      try {
        const result = await cb.database.getData(PROFILES_TABLE_ID, { limit: 1000 })
        const rows = result.data ?? []
        const myRow = rows.find((r: { id: string; data: Record<string, unknown> }) =>
          r.data.member_id === user.memberId
        )
        if (myRow) {
          const p = myRow.data as Record<string, string>
          setForm((prev) => ({
            name: p.name || prev.name,
            phone: p.phone || prev.phone,
            address: p.address || prev.address,
            addressDetail: p.address_detail || prev.addressDetail,
            memo: prev.memo,
          }))
        }
      } catch { /* ignore */ }
    }
    loadProfile()
  }, [user, authLoading, profileLoaded])

  // 마일리지 잔액 로드
  useEffect(() => {
    if (authLoading || !user) return
    const loadMileage = async () => {
      try {
        const result = await cb.database.getData(MILEAGE_HISTORY_TABLE_ID, { limit: 1000 })
        const histories = toMileageHistories(result.data ?? [])
        const mine = histories.filter((h) => h.member_id === user.memberId)
        setMileageBalance(getMileageBalance(mine))
      } catch { /* ignore */ }
    }
    loadMileage()
  }, [user, authLoading])

  // 바로구매 아이템 가져오기
  const buyNowItem = useMemo<CartItem | null>(() => {
    if (!isBuyNow) return null
    try {
      const stored = localStorage.getItem('buyNow_item')
      if (stored) return JSON.parse(stored)
    } catch { /* ignore */ }
    return null
  }, [isBuyNow])

  const items = isBuyNow && buyNowItem ? [buyNowItem] : cartItems
  const totalItems = isBuyNow && buyNowItem ? buyNowItem.quantity : cartTotalItems
  const totalPrice = isBuyNow && buyNowItem ? buyNowItem.price * buyNowItem.quantity : cartTotalPrice

  const shippingFee = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const finalTotal = Math.max(totalPrice + shippingFee - couponDiscount - mileageUse, 0)

  // 상품 없으면 리다이렉트
  if (items.length === 0) {
    navigate({ to: '/cart' })
    return null
  }

  const updateField = (field: keyof OrderInfo, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyCoupon = async (code?: string, userCouponId?: string) => {
    setCouponLoading(true)
    setCouponError('')
    try {
      const couponsResult = await cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 })
      const coupons = toCoupons(couponsResult.data ?? [])
      const targetCode = code || couponCode
      const coupon = coupons.find((c) => c.code === targetCode)

      if (!coupon) { setCouponError('존재하지 않는 쿠폰 코드입니다.'); return }
      if (!coupon.is_active) { setCouponError('비활성화된 쿠폰입니다.'); return }

      const now = new Date()
      if (now < new Date(coupon.starts_at)) { setCouponError('아직 사용 기간이 아닙니다.'); return }
      if (now > new Date(coupon.expires_at)) { setCouponError('만료된 쿠폰입니다.'); return }
      if (totalPrice < coupon.min_order_amount) {
        setCouponError(`최소 주문 금액 ${formatPrice(coupon.min_order_amount)} 이상일 때 사용 가능합니다.`)
        return
      }

      if (user) {
        const ucResult = await cb.database.getData(USER_COUPONS_TABLE_ID, { limit: 1000 })
        const userCoupons = toUserCoupons(ucResult.data ?? [])
        const usedCount = userCoupons.filter(
          (uc) => uc.member_id === user.memberId && uc.coupon_id === coupon.id && uc.status === 'used',
        ).length
        if (usedCount >= coupon.per_user_limit) {
          setCouponError('이미 사용한 쿠폰입니다.')
          return
        }
      }

      const discount = calculateDiscount(coupon, items)
      if (discount === 0) {
        setCouponError('이 주문에 적용할 수 없는 쿠폰입니다.')
        return
      }

      setAppliedCoupon(coupon)
      setCouponDiscount(discount)
      setAppliedUserCouponId(userCouponId || null)
      setCouponCode('')
      setShowCouponPicker(false)
    } catch {
      setCouponError('쿠폰 적용 중 오류가 발생했습니다.')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponDiscount(0)
    setAppliedUserCouponId(null)
    setCouponError('')
  }

  const loadMyCoupons = async () => {
    if (!user) return
    setShowCouponPicker(true)
    try {
      const [couponsRes, ucRes] = await Promise.all([
        cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 }),
        cb.database.getData(USER_COUPONS_TABLE_ID, { limit: 1000 }),
      ])
      const coupons = toCoupons(couponsRes.data ?? [])
      const userCoupons = toUserCoupons(ucRes.data ?? [])
      const now = new Date()

      const available = userCoupons
        .filter((uc) => uc.member_id === user.memberId && uc.status === 'available')
        .map((uc) => {
          const coupon = coupons.find((c) => c.id === uc.coupon_id)
          return coupon ? { coupon, userCoupon: uc } : null
        })
        .filter((x): x is { coupon: Coupon; userCoupon: UserCoupon } =>
          x !== null && x.coupon.is_active && now <= new Date(x.coupon.expires_at),
        )

      setMyCoupons(available)
    } catch { /* ignore */ }
  }

  const handlePayment = async () => {
    if (!form.name || !form.phone || !form.address) {
      setError('이름, 연락처, 주소를 모두 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const orderId = `order-${Date.now()}`
      const orderName =
        items.length === 1
          ? items[0].name
          : `${items[0].name} 외 ${items.length - 1}건`

      // 결제 성공 후 주문 저장을 위해 임시 저장
      localStorage.setItem('pending_order', JSON.stringify({
        orderId,
        orderName,
        amount: finalTotal,
        isBuyNow,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        customerName: form.name,
        customerPhone: form.phone,
        address: form.address,
        addressDetail: form.addressDetail,
        memo: form.memo,
        couponId: appliedCoupon?.id || null,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount || 0,
        userCouponId: appliedUserCouponId || null,
        mileageUse: mileageUse || 0,
        ref_code: localStorage.getItem('ref_code') || '',
      }))

      await cb.payment.requestPayment({
        amount: finalTotal,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '결제 요청 중 오류가 발생했습니다.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-10">주문하기</h1>

      {/* 주문 상품 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4">주문 상품</h2>
        <div className="border border-gray-100 rounded-sm divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 p-4">
              <div className="w-16 h-20 bg-gray-100 rounded-sm overflow-hidden shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-500 mt-1">수량: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 비회원 안내 */}
      {!authLoading && !user && (
        <div className="mb-6 flex items-center justify-between bg-gray-50 border border-gray-100 rounded-sm px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>로그인하면 주문 내역을 확인할 수 있습니다.</span>
          </div>
          <Link
            to="/login"
            search={{ redirect: isBuyNow ? '/checkout?buyNow=true' : '/checkout' }}
            className="text-xs font-medium text-black hover:underline shrink-0"
          >
            로그인
          </Link>
        </div>
      )}

      {/* 배송 정보 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4">배송 정보</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="홍길동"
              className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="010-1234-5678"
              className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              주소 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="서울시 강남구 테헤란로 123"
              className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              상세주소
            </label>
            <input
              type="text"
              value={form.addressDetail}
              onChange={(e) => updateField('addressDetail', e.target.value)}
              placeholder="101동 1001호"
              className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              배송 메모
            </label>
            <input
              type="text"
              value={form.memo}
              onChange={(e) => updateField('memo', e.target.value)}
              placeholder="부재 시 문 앞에 놓아주세요"
              className="w-full px-4 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
            />
          </div>
        </div>
      </section>

      {/* 쿠폰 */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4">쿠폰</h2>
        {appliedCoupon ? (
          <div className="flex items-center justify-between border border-green-200 bg-green-50 rounded-sm p-4">
            <div>
              <p className="text-sm font-medium">{appliedCoupon.name}</p>
              <p className="text-xs text-green-700">{formatDiscount(appliedCoupon)} (-{formatPrice(couponDiscount)})</p>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                placeholder="쿠폰 코드를 입력하세요"
                className="flex-1 px-4 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
              />
              <button
                onClick={() => handleApplyCoupon()}
                disabled={couponLoading || !couponCode}
                className="px-6 py-3 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 shrink-0 transition-colors"
              >
                적용
              </button>
            </div>
            {user && (
              <button
                onClick={loadMyCoupons}
                className="w-full py-3 border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                내 쿠폰에서 선택
              </button>
            )}
            {couponError && <p className="text-xs text-red-500">{couponError}</p>}
          </div>
        )}

        {/* 내 쿠폰 피커 모달 */}
        {showCouponPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-md w-full max-w-md mx-4 max-h-[70vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 className="font-bold">내 쿠폰 선택</h3>
                <button onClick={() => setShowCouponPicker(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {myCoupons.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">사용 가능한 쿠폰이 없습니다</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {myCoupons.map(({ coupon, userCoupon }) => {
                      const discount = calculateDiscount(coupon, items)
                      const canUse = discount > 0 && totalPrice >= coupon.min_order_amount
                      return (
                        <button
                          key={userCoupon.id}
                          disabled={!canUse}
                          onClick={() => handleApplyCoupon(coupon.code, userCoupon.id)}
                          className={`text-left border rounded-sm p-4 transition-colors ${
                            canUse
                              ? 'border-gray-200 hover:border-black'
                              : 'border-gray-100 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <p className="text-sm font-medium">{coupon.name}</p>
                          <p className="text-xs text-green-700 mt-0.5">{formatDiscount(coupon)}</p>
                          {canUse && <p className="text-xs text-gray-500 mt-1">-{formatPrice(discount)} 할인</p>}
                          {!canUse && coupon.min_order_amount > totalPrice && (
                            <p className="text-xs text-red-500 mt-1">
                              {formatPrice(coupon.min_order_amount)} 이상 주문 시 사용 가능
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 마일리지 */}
      {!authLoading && user && mileageBalance > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">마일리지</h2>
          <div className="border border-gray-200 rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-purple-600" />
                <span>보유 마일리지</span>
              </div>
              <span className="font-bold text-purple-700">{formatPrice(mileageBalance)}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={mileageUse || ''}
                onChange={(e) => {
                  const max = Math.min(mileageBalance, totalPrice + shippingFee - couponDiscount)
                  const val = Math.min(Number(e.target.value) || 0, max)
                  setMileageUse(Math.max(0, val))
                }}
                placeholder="사용할 마일리지"
                className="flex-1 px-4 py-3 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
              />
              <button
                onClick={() => {
                  const max = Math.min(mileageBalance, totalPrice + shippingFee - couponDiscount)
                  setMileageUse(Math.max(0, max))
                }}
                className="px-4 py-3 border border-gray-200 text-sm hover:bg-gray-50 shrink-0 transition-colors"
              >
                전액 사용
              </button>
            </div>
            {mileageUse > 0 && (
              <p className="text-xs text-purple-600 mt-2">
                {formatPrice(mileageUse)} 사용 예정
              </p>
            )}
          </div>
        </section>
      )}

      {/* 결제 금액 */}
      <section className="mb-10 bg-gray-50 p-6 rounded-sm">
        <h2 className="text-lg font-bold mb-4">결제 금액</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">상품 금액 ({totalItems}개)</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">배송비</span>
            <span>
              {shippingFee === 0 ? (
                <span className="text-green-600">무료</span>
              ) : (
                formatPrice(shippingFee)
              )}
            </span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">쿠폰 할인</span>
              <span className="text-red-500">-{formatPrice(couponDiscount)}</span>
            </div>
          )}
          {mileageUse > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">마일리지 사용</span>
              <span className="text-red-500">-{formatPrice(mileageUse)}</span>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
          <span className="font-bold">총 결제 금액</span>
          <span className="text-xl font-bold">{formatPrice(finalTotal)}</span>
        </div>
        {user && (
          <p className="text-xs text-purple-600 mt-2 text-right">
            구매 적립 예정: {formatPrice(Math.floor(Math.max(totalPrice - couponDiscount, 0) * MILEAGE_EARN_RATE))}
          </p>
        )}
      </section>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {/* 결제 버튼 */}
      <button
        className="w-full py-4 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? '결제 처리 중...' : `${formatPrice(finalTotal)} 결제하기`}
      </button>
    </div>
  )
}
