import { Outlet, createRootRoute } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layout/AdminLayout'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}
