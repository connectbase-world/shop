import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'
import { ORDERS_TABLE_ID, COUPONS_TABLE_ID, USER_COUPONS_TABLE_ID, MILEAGE_HISTORY_TABLE_ID, MILEAGE_EARN_RATE, INFLUENCERS_TABLE_ID, COMMISSIONS_TABLE_ID } from '@/lib/constants'
import { toCoupons, toMileageHistories, getMileageBalance, toInfluencers } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import { CheckCircle, AlertCircle } from 'lucide-react'

type PaymentSearch = {
  paymentKey?: string
  orderId?: string
  amount?: number
}

export const Route = createFileRoute('/payment/success')({
  validateSearch: (search: Record<string, unknown>): PaymentSearch => ({
    paymentKey: search.paymentKey as string | undefined,
    orderId: search.orderId as string | undefined,
    amount: Number(search.amount) || undefined,
  }),
  component: PaymentSuccessPage,
})

function PaymentSuccessPage() {
  const { paymentKey, orderId, amount } = Route.useSearch()
  const { clearCart } = useCart()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        setStatus('error')
        setErrorMessage('결제 정보가 올바르지 않습니다.')
        return
      }

      try {
        await cb.payment.confirmPayment({
          paymentKey,
          orderId,
          amount,
        })

        // 주문 데이터를 DB에 저장
        try {
          const pendingOrder = localStorage.getItem('pending_order')
          if (pendingOrder) {
            const order = JSON.parse(pendingOrder)

            // 로그인한 사용자의 member_id 가져오기
            let memberId = ''
            try {
              const userStr = localStorage.getItem('shop_user')
              if (userStr) {
                const user = JSON.parse(userStr)
                memberId = user.memberId || ''
              }
            } catch { /* ignore */ }

            await cb.database.createData(ORDERS_TABLE_ID, {
              data: {
                order_id: orderId,
                order_name: order.orderName,
                amount,
                payment_key: paymentKey,
                status: 'paid',
                items: order.items,
                customer_name: order.customerName,
                customer_phone: order.customerPhone,
                address: order.address,
                address_detail: order.addressDetail,
                memo: order.memo,
                member_id: memberId,
                coupon_code: order.couponCode || '',
                coupon_discount: order.couponDiscount || 0,
              },
            })

            // 쿠폰 사용 기록
            if (order.couponCode) {
              try {
                if (order.userCouponId) {
                  await cb.database.updateData(USER_COUPONS_TABLE_ID, order.userCouponId, {
                    data: { status: 'used', used_at: new Date().toISOString(), order_id: orderId },
                  })
                } else if (memberId) {
                  await cb.database.createData(USER_COUPONS_TABLE_ID, {
                    data: {
                      coupon_id: order.couponId || '',
                      member_id: memberId,
                      code: order.couponCode,
                      status: 'used',
                      used_at: new Date().toISOString(),
                      order_id: orderId,
                      claimed_at: new Date().toISOString(),
                    },
                  })
                }
                // used_count 증가
                if (order.couponId) {
                  const couponsRes = await cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 })
                  const coupons = toCoupons(couponsRes.data ?? [])
                  const coupon = coupons.find((c) => c.id === order.couponId)
                  if (coupon) {
                    await cb.database.updateData(COUPONS_TABLE_ID, coupon.id, {
                      data: { used_count: coupon.used_count + 1 },
                    })
                  }
                }
              } catch { /* 쿠폰 기록 실패해도 결제는 성공 */ }
            }

            // 마일리지 사용/적립 기록
            if (memberId) {
              try {
                const mileageResult = await cb.database.getData(MILEAGE_HISTORY_TABLE_ID, { limit: 1000 })
                const allHistories = toMileageHistories(mileageResult.data ?? [])
                const myHistories = allHistories.filter((h: { member_id: string }) => h.member_id === memberId)
                let currentBalance = getMileageBalance(myHistories)

                // 마일리지 사용 기록
                if (order.mileageUse && order.mileageUse > 0) {
                  currentBalance = currentBalance - order.mileageUse
                  await cb.database.createData(MILEAGE_HISTORY_TABLE_ID, {
                    data: {
                      member_id: memberId,
                      type: 'spend',
                      amount: -order.mileageUse,
                      balance_after: currentBalance,
                      description: `주문 사용`,
                      order_id: orderId,
                      created_at: new Date().toISOString(),
                    },
                  })
                }

                // 마일리지 적립 (상품금액 - 쿠폰할인 기준)
                const itemsTotal = (order.items || []).reduce(
                  (s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0,
                )
                const earnBase = Math.max(itemsTotal - (order.couponDiscount || 0), 0)
                const earnAmount = Math.floor(earnBase * MILEAGE_EARN_RATE)
                if (earnAmount > 0) {
                  currentBalance = currentBalance + earnAmount
                  await cb.database.createData(MILEAGE_HISTORY_TABLE_ID, {
                    data: {
                      member_id: memberId,
                      type: 'earn',
                      amount: earnAmount,
                      balance_after: currentBalance,
                      description: `구매 적립 (${Math.round(MILEAGE_EARN_RATE * 100)}%)`,
                      order_id: orderId,
                      created_at: new Date().toISOString(),
                    },
                  })
                }
              } catch { /* 마일리지 기록 실패해도 결제는 성공 */ }
            }

            // 인플루언서 커미션 기록
            try {
              const itemsTotal = (order.items || []).reduce(
                (s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0,
              )
              if (itemsTotal > 0) {
                const infResult = await cb.database.getData(INFLUENCERS_TABLE_ID, { limit: 1000 })
                const allInfluencers = toInfluencers(infResult.data ?? [])
                const approvedInfluencers = allInfluencers.filter((inf) => inf.status === 'approved')

                let matchedInfluencer = null as typeof approvedInfluencers[0] | null
                let commissionSource = '' as 'ref_link' | 'coupon' | ''

                // 1순위: 추천 링크
                if (order.ref_code) {
                  matchedInfluencer = approvedInfluencers.find((inf) => inf.ref_code === order.ref_code) || null
                  if (matchedInfluencer) commissionSource = 'ref_link'
                }

                // 2순위: 쿠폰 연동 인플루언서
                if (!matchedInfluencer && order.couponId) {
                  const couponsRes2 = await cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 })
                  const allCoupons = toCoupons(couponsRes2.data ?? [])
                  const usedCoupon = allCoupons.find((c) => c.id === order.couponId)
                  if (usedCoupon && (usedCoupon as Record<string, unknown>).influencer_id) {
                    const infId = (usedCoupon as Record<string, unknown>).influencer_id as string
                    matchedInfluencer = approvedInfluencers.find((inf) => inf.id === infId) || null
                    if (matchedInfluencer) commissionSource = 'coupon'
                  }
                }

                // 자기 추천 방지 + 커미션 기록
                if (matchedInfluencer && commissionSource && matchedInfluencer.member_id !== memberId) {
                  const commissionAmount = Math.floor(itemsTotal * matchedInfluencer.commission_rate)
                  if (commissionAmount > 0) {
                    await cb.database.createData(COMMISSIONS_TABLE_ID, {
                      data: {
                        influencer_id: matchedInfluencer.id,
                        member_id: matchedInfluencer.member_id,
                        order_id: orderId,
                        order_amount: itemsTotal,
                        commission_rate: matchedInfluencer.commission_rate,
                        commission_amount: commissionAmount,
                        source: commissionSource,
                        status: 'pending',
                        created_at: new Date().toISOString(),
                      },
                    })
                    await cb.database.updateData(INFLUENCERS_TABLE_ID, matchedInfluencer.id, {
                      data: { total_earned: matchedInfluencer.total_earned + commissionAmount },
                    })
                  }
                }
              }
              // ref_code 사용 후 삭제
              localStorage.removeItem('ref_code')
            } catch { /* 커미션 기록 실패해도 결제는 성공 */ }

            localStorage.removeItem('pending_order')

            // 바로구매인 경우 buyNow_item만 삭제, 아닌 경우 장바구니 비우기
            if (order.isBuyNow) {
              localStorage.removeItem('buyNow_item')
            } else {
              clearCart()
            }
          }
        } catch {
          // 주문 저장 실패해도 결제는 성공 처리
        }

        setStatus('success')
      } catch (err) {
        setStatus('error')
        setErrorMessage(
          err instanceof Error ? err.message : '결제 확인 중 오류가 발생했습니다.',
        )
      }
    }

    confirmPayment()
  }, [paymentKey, orderId, amount, clearCart])

  if (status === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-600">결제를 확인하고 있습니다...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2">결제 확인 실패</h1>
        <p className="text-sm text-gray-600 mb-8">{errorMessage}</p>
        <Link
          to="/cart"
          className="inline-block px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          장바구니로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
      <h1 className="text-2xl font-bold mb-2">주문이 완료되었습니다</h1>
      <p className="text-sm text-gray-600 mb-2">
        주문번호: {orderId}
      </p>
      <p className="text-sm text-gray-500 mb-8">
        주문하신 상품은 빠르게 배송해드리겠습니다.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          to="/mypage"
          className="inline-block px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          주문 내역 확인
        </Link>
        <Link
          to="/products"
          className="inline-block px-8 py-3 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
        >
          쇼핑 계속하기
        </Link>
      </div>
    </div>
  )
}
