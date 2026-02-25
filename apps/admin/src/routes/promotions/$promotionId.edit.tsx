import { createFileRoute } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'
import { PROMOTIONS_TABLE_ID } from '@/lib/constants'
import { toPromotion } from '@/lib/utils'
import { PromotionForm } from '@/components/promotions/PromotionForm'

export const Route = createFileRoute('/promotions/$promotionId/edit')({
  loader: async ({ params }) => {
    const result = await cb.database.getDataById(PROMOTIONS_TABLE_ID, params.promotionId)
    if (!result) throw new Error('프로모션을 찾을 수 없습니다.')
    return { promotion: result.data ? toPromotion(result) : result }
  },
  component: EditPromotionPage,
})

function EditPromotionPage() {
  const { promotion } = Route.useLoaderData()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">프로모션 수정</h1>
      <PromotionForm promotion={promotion} />
    </div>
  )
}
