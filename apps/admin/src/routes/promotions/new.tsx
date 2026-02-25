import { createFileRoute } from '@tanstack/react-router'
import { PromotionForm } from '@/components/promotions/PromotionForm'

export const Route = createFileRoute('/promotions/new')({
  component: NewPromotionPage,
})

function NewPromotionPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">프로모션 생성</h1>
      <PromotionForm />
    </div>
  )
}
