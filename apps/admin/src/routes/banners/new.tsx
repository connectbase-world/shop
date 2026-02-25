import { createFileRoute } from '@tanstack/react-router'
import { BannerForm } from '@/components/banners/BannerForm'

export const Route = createFileRoute('/banners/new')({
  component: NewBannerPage,
})

function NewBannerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">배너 생성</h1>
      <BannerForm />
    </div>
  )
}
