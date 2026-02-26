import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, Package, ClipboardList, Users, Ticket, Megaphone, FileText, StickyNote, Navigation, Settings, LogOut, User, MessageCircleQuestion, Image, Zap, BarChart3, Store, ChevronDown } from 'lucide-react'
import { getAdminSession } from '@/lib/adminAuth'
import type { LucideIcon } from 'lucide-react'

type NavItem = { to: string; label: string; icon: LucideIcon }
type NavGroup = { label: string; items: NavItem[] }

const navGroups: (NavItem | NavGroup)[] = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  {
    label: '쇼핑몰',
    items: [
      { to: '/products', label: '상품 관리', icon: Package },
      { to: '/orders', label: '주문 관리', icon: ClipboardList },
      { to: '/marketplace', label: '마켓플레이스', icon: Store },
    ],
  },
  {
    label: '고객',
    items: [
      { to: '/members', label: '회원 관리', icon: Users },
      { to: '/qna', label: 'Q&A', icon: MessageCircleQuestion },
      { to: '/influencers', label: '인플루언서', icon: Megaphone },
    ],
  },
  {
    label: '마케팅',
    items: [
      { to: '/coupons', label: '쿠폰 관리', icon: Ticket },
      { to: '/banners', label: '배너', icon: Image },
      { to: '/promotions', label: '프로모션', icon: Zap },
    ],
  },
  {
    label: '콘텐츠',
    items: [
      { to: '/boards', label: '게시판', icon: FileText },
      { to: '/pages', label: '페이지', icon: StickyNote },
      { to: '/navigations', label: '네비게이션', icon: Navigation },
    ],
  },
  {
    label: '분석',
    items: [
      { to: '/analytics', label: '애널리틱스', icon: BarChart3 },
    ],
  },
]

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'items' in item
}

function getInitialOpenGroups(currentPath: string): Record<string, boolean> {
  const open: Record<string, boolean> = {}
  for (const entry of navGroups) {
    if (isGroup(entry)) {
      const hasActive = entry.items.some((item) => currentPath.startsWith(item.to))
      open[entry.label] = hasActive
    }
  }
  return open
}

export function Sidebar({ onLogout, onNavigate }: { onLogout?: () => void; onNavigate?: () => void }) {
  const { location } = useRouterState()
  const currentPath = location.pathname
  const session = getAdminSession()
  const [openGroups, setOpenGroups] = useState(() => getInitialOpenGroups(currentPath))

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const renderNavLink = (item: NavItem) => {
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
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
          isActive
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon className="w-4 h-4" />
        {item.label}
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col z-50">
      <div className="px-6 py-5 border-b border-gray-200">
        <h1 className="text-lg font-bold tracking-tight">Shop Admin</h1>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto flex flex-col gap-0.5">
        {navGroups.map((entry) => {
          if (!isGroup(entry)) {
            return renderNavLink(entry)
          }

          const isOpen = openGroups[entry.label] ?? false
          const hasActive = entry.items.some((item) => currentPath.startsWith(item.to))

          return (
            <div key={entry.label} className="mt-1">
              <button
                onClick={() => toggleGroup(entry.label)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-[13px] transition-colors ${
                  hasActive && !isOpen
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider">{entry.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="flex flex-col gap-0.5 pl-1 mt-0.5">
                  {entry.items.map(renderNavLink)}
                </div>
              </div>
            </div>
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
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] w-full transition-colors ${
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
            className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] w-full transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        )}
      </div>
    </aside>
  )
}
