import { Link } from '@tanstack/react-router'
import { X, LogOut, ClipboardList, Heart, Globe } from 'lucide-react'
import { useI18n } from '@/hooks/useI18n'
import type { Locale } from '@/lib/i18n'

type ResolvedNav = {
  slug: string
  name: string
  links: { label: string; to: string }[]
}

type MobileMenuProps = {
  open: boolean
  onClose: () => void
  user: { memberId: string; nickname?: string } | null
  onLogout: () => Promise<void>
  resolvedNavs: ResolvedNav[]
}

export function MobileMenu({ open, onClose, user, onLogout, resolvedNavs }: MobileMenuProps) {
  const { t, locale, setLocale } = useI18n()
  const headerNav = resolvedNavs.find((n) => n.slug === 'header')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-xl p-6 flex flex-col">
        <button
          className="self-end p-2 -mt-2 -mr-2"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <nav className="mt-8 flex flex-col gap-6">
          <Link
            to="/"
            className="text-lg text-gray-900 font-medium"
            onClick={onClose}
          >
            {t.common.home}
          </Link>
          <Link
            to="/products"
            className="text-lg text-gray-900 font-medium"
            onClick={onClose}
          >
            {t.common.products}
          </Link>
          {headerNav?.links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-lg text-gray-900 font-medium"
              onClick={onClose}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/cart"
            className="text-lg text-gray-900 font-medium"
            onClick={onClose}
          >
            {t.common.cart}
          </Link>
          <Link
            to="/wishlist"
            className="text-lg text-gray-900 font-medium flex items-center gap-2"
            onClick={onClose}
          >
            <Heart className="w-5 h-5" />
            {t.header.wishlist}
          </Link>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <button
            onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko' as Locale)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
          >
            <Globe className="w-4 h-4" />
            {locale === 'ko' ? 'English' : '한국어'}
          </button>

          {user ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500">
                {user.nickname || (locale === 'ko' ? '회원' : 'Member')}
              </p>
              <Link
                to="/mypage"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                onClick={onClose}
              >
                <ClipboardList className="w-4 h-4" />
                {t.common.mypage}
              </Link>
              <button
                onClick={async () => {
                  onClose()
                  await onLogout()
                }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                {t.common.logout}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="block text-center py-3 bg-black text-white text-sm rounded-md"
              onClick={onClose}
            >
              {t.common.login}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
