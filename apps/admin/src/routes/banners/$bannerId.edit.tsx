import { createFileRoute } from '@tanstack/react-router'
import { cb } from '@/lib/connectbase'
import { BANNERS_TABLE_ID } from '@/lib/constants'
import { toBanner } from '@/lib/utils'
import { BannerForm } from '@/components/banners/BannerForm'

export const Route = createFileRoute('/banners/$bannerId/edit')({
  loader: async ({ params }) => {
    const result = await cb.database.getDataById(BANNERS_TABLE_ID, params.bannerId)
    if (!result) throw new Error('배너를 찾을 수 없습니다.')
    return { banner: result.data ? toBanner(result) : result }
  },
  component: EditBannerPage,
})

function EditBannerPage() {
  const { banner } = Route.useLoaderData()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">배너 수정</h1>
      <BannerForm banner={banner} />
    </div>
  )
}
