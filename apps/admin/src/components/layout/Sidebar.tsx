import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Package, ClipboardList, Users, Ticket, Megaphone, FileText, StickyNote, Navigation, Settings, LogOut, User } from 'lucide-react'
import { getAdminSession } from '@/lib/adminAuth'

const navItems = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/products', label: '상품 관리', icon: Package },
  { to: '/orders', label: '주문 관리', icon: ClipboardList },
  { to: '/members', label: '회원 관리', icon: Users },
  { to: '/coupons', label: '쿠폰 관리', icon: Ticket },
  { to: '/influencers', label: '인플루언서', icon: Megaphone },
  { to: '/boards', label: '게시판', icon: FileText },
  { to: '/pages', label: '페이지', icon: StickyNote },
  { to: '/navigations', label: '네비게이션', icon: Navigation },
] as const

export function Sidebar({ onLogout, onNavigate }: { onLogout?: () => void; onNavigate?: () => void }) {
  const { location } = useRouterState()
  const currentPath = location.pathname
  const session = getAdminSession()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-lg font-bold tracking-tight">Shop Admin</h1>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.to)
          const Icon = item.icon

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 flex flex-col gap-1">
        {session && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{session.nickname}</p>
              <p className="text-[11px] text-gray-400">
                {session.role === 'super_admin' ? '최고관리자' : '관리자'}
              </p>
            </div>
          </div>
        )}
        <Link
          to="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm w-full transition-colors ${
            currentPath.startsWith('/settings')
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          설정
        </Link>
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm w-full transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        )}
      </div>
    </aside>
  )
}
