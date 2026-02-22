import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Package, ClipboardList, Users, Ticket, Megaphone, Settings } from 'lucide-react'

const navItems = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/products', label: '상품 관리', icon: Package },
  { to: '/orders', label: '주문 관리', icon: ClipboardList },
  { to: '/members', label: '회원 관리', icon: Users },
  { to: '/coupons', label: '쿠폰 관리', icon: Ticket },
  { to: '/influencers', label: '인플루언서', icon: Megaphone },
] as const

export function Sidebar() {
  const { location } = useRouterState()
  const currentPath = location.pathname

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col">
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

      <div className="px-3 py-4 border-t border-gray-200">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm w-full transition-colors ${
            currentPath.startsWith('/settings')
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          설정
        </Link>
      </div>
    </aside>
  )
}
