import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

type AdminLayoutProps = {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-60 p-8">{children}</main>
    </div>
  )
}
