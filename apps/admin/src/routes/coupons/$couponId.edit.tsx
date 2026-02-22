import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { COUPONS_TABLE_ID } from '@/lib/constants'
import { toCoupon } from '@/lib/utils'
import { CouponForm } from '@/components/coupons/CouponForm'
import type { CouponFormData } from '@/components/coupons/CouponForm'

export const Route = createFileRoute('/coupons/$couponId/edit')({
  loader: async ({ params }) => {
    const result = await cb.database.getDataById(COUPONS_TABLE_ID, params.couponId)
    const coupon = toCoupon(result)
    return { coupon }
  },
  component: EditCouponPage,
})

function EditCouponPage() {
  const { coupon } = Route.useLoaderData()
  const { couponId } = Route.useParams()
  const navigate = useNavigate()

  const initialData: CouponFormData = {
    code: coupon.code,
    name: coupon.name,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    max_discount: coupon.max_discount ?? 0,
    min_order_amount: coupon.min_order_amount ?? 0,
    target_type: coupon.target_type,
    target_value: coupon.target_value ?? '',
    total_quantity: coupon.total_quantity,
    per_user_limit: coupon.per_user_limit ?? 1,
    is_auto_issue: coupon.is_auto_issue ?? false,
    is_active: coupon.is_active,
    starts_at: coupon.starts_at?.slice(0, 16) ?? '',
    expires_at: coupon.expires_at?.slice(0, 16) ?? '',
  }

  const handleSubmit = async (data: CouponFormData) => {
    await cb.database.updateData(COUPONS_TABLE_ID, couponId, { data })
    navigate({ to: '/coupons' })
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/coupons"
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">쿠폰 수정</h1>
      </div>
      <CouponForm initialData={initialData} onSubmit={handleSubmit} submitLabel="저장" />
    </div>
  )
}
