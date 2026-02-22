import { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingBag, Menu, User, LogOut, ClipboardList, Heart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useWishlist } from '@/hooks/useWishlist'
import { MobileMenu } from './MobileMenu'

export function Header() {
  const { totalItems } = useCart()
  const { user, logout } = useAuth()
  const { count: wishlistCount } = useWishlist()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [userMenuOpen])

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold tracking-tight">
            SHOP
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              activeProps={{ className: 'text-sm text-gray-900 font-medium' }}
              activeOptions={{ exact: true }}
            >
              홈
            </Link>
            <Link
              to="/products"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              activeProps={{ className: 'text-sm text-gray-900 font-medium' }}
            >
              상품
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/wishlist" className="relative p-2 hidden md:block">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative p-2">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div ref={menuRef} className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="max-w-[80px] truncate">
                  {user.nickname || '회원'}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
                  <Link
                    to="/mypage"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ClipboardList className="w-4 h-4" />
                    마이페이지
                  </Link>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false)
                      await logout()
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-block px-4 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              로그인
            </Link>
          )}

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={logout}
      />
    </header>
  )
}
