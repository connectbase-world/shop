import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { COUPONS_TABLE_ID } from '@/lib/constants'
import { CouponForm } from '@/components/coupons/CouponForm'
import type { CouponFormData } from '@/components/coupons/CouponForm'

export const Route = createFileRoute('/coupons/new')({
  component: NewCouponPage,
})

function NewCouponPage() {
  const navigate = useNavigate()

  const handleSubmit = async (data: CouponFormData) => {
    await cb.database.createData(COUPONS_TABLE_ID, {
      data: {
        ...data,
        issued_count: 0,
        used_count: 0,
        created_at: new Date().toISOString(),
      },
    })
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
        <h1 className="text-2xl font-bold">쿠폰 등록</h1>
      </div>
      <CouponForm onSubmit={handleSubmit} submitLabel="등록" />
    </div>
  )
}
