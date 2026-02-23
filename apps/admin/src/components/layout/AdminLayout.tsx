import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Menu, X } from 'lucide-react'

type AdminLayoutProps = {
  children: ReactNode
  onLogout?: () => void
}

export function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* 모바일 헤더 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-40">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="ml-3 text-sm font-bold">Shop Admin</h1>
      </div>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 사이드바 */}
      <div className={`lg:block ${sidebarOpen ? 'block' : 'hidden'}`}>
        <Sidebar onLogout={onLogout} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* 모바일 닫기 버튼 */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed top-3 left-52 z-50 p-1.5 bg-white rounded-full shadow-md text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <main className="lg:ml-60 p-4 lg:p-8 pt-18 lg:pt-8">{children}</main>
    </div>
  )
}
