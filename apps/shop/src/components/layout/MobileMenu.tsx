import { Link } from '@tanstack/react-router'
import { X, LogOut, ClipboardList, Heart } from 'lucide-react'

type MobileMenuProps = {
  open: boolean
  onClose: () => void
  user: { memberId: string; nickname?: string } | null
  onLogout: () => Promise<void>
}

export function MobileMenu({ open, onClose, user, onLogout }: MobileMenuProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-xl p-6 flex flex-col">
        <button
          className="self-end p-2 -mt-2 -mr-2"
          onClick={onClose}
          aria-label="메뉴 닫기"
        >
          <X className="w-5 h-5" />
        </button>
        <nav className="mt-8 flex flex-col gap-6">
          <Link
            to="/"
            className="text-lg text-gray-900 font-medium"
            onClick={onClose}
          >
            홈
          </Link>
          <Link
            to="/products"
            className="text-lg text-gray-900 font-medium"
            onClick={onClose}
          >
            상품
          </Link>
          <Link
            to="/cart"
            className="text-lg text-gray-900 font-medium"
            onClick={onClose}
          >
            장바구니
          </Link>
          <Link
            to="/wishlist"
            className="text-lg text-gray-900 font-medium flex items-center gap-2"
            onClick={onClose}
          >
            <Heart className="w-5 h-5" />
            위시리스트
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          {user ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500">
                {user.nickname || '회원'}님
              </p>
              <Link
                to="/mypage"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                onClick={onClose}
              >
                <ClipboardList className="w-4 h-4" />
                마이페이지
              </Link>
              <button
                onClick={async () => {
                  onClose()
                  await onLogout()
                }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="block text-center py-3 bg-black text-white text-sm rounded-md"
              onClick={onClose}
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
