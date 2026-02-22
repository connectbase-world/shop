import { useState, useEffect } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { COUPONS_TABLE_ID, USER_COUPONS_TABLE_ID } from '@/lib/constants'
import { toCoupons, toUserCoupons, formatDiscount } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { Coupon } from '@/lib/types'

export const Route = createFileRoute('/coupon/$code')({
  component: CouponClaimPage,
})

type ClaimState =
  | { status: 'loading' }
  | { status: 'success'; coupon: Coupon }
  | { status: 'already'; coupon: Coupon }
  | { status: 'error'; message: string }

function CouponClaimPage() {
  const { code } = Route.useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<ClaimState>({ status: 'loading' })

  useEffect(() => {
    if (!user) {
      navigate({ to: '/login', search: { redirect: `/coupon/${code}` } })
      return
    }

    const claim = async () => {
      try {
        const couponsResult = await cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 })
        const coupons = toCoupons(couponsResult.data ?? [])
        const coupon = coupons.find((c) => c.code === code)

        if (!coupon) {
          setState({ status: 'error', message: '존재하지 않는 쿠폰입니다.' })
          return
        }
        if (!coupon.is_active) {
          setState({ status: 'error', message: '비활성화된 쿠폰입니다.' })
          return
        }
        const now = new Date()
        if (now > new Date(coupon.expires_at)) {
          setState({ status: 'error', message: '만료된 쿠폰입니다.' })
          return
        }
        if (now < new Date(coupon.starts_at)) {
          setState({ status: 'error', message: '아직 사용 기간이 아닙니다.' })
          return
        }
        if (coupon.total_quantity !== -1 && coupon.issued_count >= coupon.total_quantity) {
          setState({ status: 'error', message: '쿠폰이 모두 소진되었습니다.' })
          return
        }

        // 이미 보유 중인지 확인
        const ucResult = await cb.database.getData(USER_COUPONS_TABLE_ID, { limit: 1000 })
        const userCoupons = toUserCoupons(ucResult.data ?? [])
        const existing = userCoupons.find(
          (uc) => uc.member_id === user.memberId && uc.coupon_id === coupon.id && uc.status === 'available',
        )
        if (existing) {
          setState({ status: 'already', coupon })
          return
        }

        // 발급
        await cb.database.createData(USER_COUPONS_TABLE_ID, {
          data: {
            coupon_id: coupon.id,
            member_id: user.memberId,
            code: coupon.code,
            status: 'available',
            claimed_at: now.toISOString(),
          },
        })
        await cb.database.updateData(COUPONS_TABLE_ID, coupon.id, {
          data: { issued_count: coupon.issued_count + 1 },
        })
        setState({ status: 'success', coupon })
      } catch {
        setState({ status: 'error', message: '쿠폰 발급 중 오류가 발생했습니다.' })
      }
    }

    claim()
  }, [code, user, navigate])

  if (state.status === 'loading') {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <Loader2 className="w-10 h-10 text-gray-300 animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">쿠폰 발급 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <div className="text-center mb-8">
        {state.status === 'success' && (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">쿠폰이 발급되었습니다!</h1>
          </>
        )}
        {state.status === 'already' && (
          <>
            <AlertCircle className="w-14 h-14 text-blue-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">이미 보유 중인 쿠폰입니다</h1>
          </>
        )}
        {state.status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">쿠폰 발급 실패</h1>
            <p className="text-sm text-gray-500">{state.message}</p>
          </>
        )}
      </div>

      {(state.status === 'success' || state.status === 'already') && (
        <div className="border border-gray-200 rounded-md p-5 mb-8">
          <p className="font-bold mb-1">{state.coupon.name}</p>
          <p className="text-sm text-green-700 mb-3">{formatDiscount(state.coupon)}</p>
          <div className="text-xs text-gray-500 space-y-0.5">
            {state.coupon.min_order_amount > 0 && (
              <p>{state.coupon.min_order_amount.toLocaleString()}원 이상 주문 시 사용 가능</p>
            )}
            <p>
              {new Date(state.coupon.starts_at).toLocaleDateString('ko-KR')} ~{' '}
              {new Date(state.coupon.expires_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      )}

      <Link
        to="/"
        className="block w-full py-3.5 bg-black text-white text-center text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        쇼핑하러 가기
      </Link>
    </div>
  )
}
