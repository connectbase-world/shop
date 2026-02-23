import { useEffect } from 'react'
import { Outlet, createRootRoute, ErrorComponent, Link } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { I18nProvider } from '@/lib/i18n'
import ko from '@/lib/i18n/ko'
import en from '@/lib/i18n/en'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

function getT() {
  const locale = (typeof localStorage !== 'undefined' && localStorage.getItem('shop_locale')) || 'ko'
  return locale === 'en' ? en : ko
}

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorBoundary,
})

function NotFoundPage() {
  const t = getT()
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-xl font-bold mb-2">{t.notFound.title}</h1>
      <p className="text-sm text-gray-500 mb-8">{t.notFound.description}</p>
      <Link
        to="/"
        className="inline-block px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
      >
        {t.notFound.goHome}
      </Link>
    </div>
  )
}

function ErrorBoundary({ error }: { error: Error }) {
  const t = getT()
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold mb-2">{t.error.title}</h1>
      <p className="text-sm text-gray-500 mb-8">{error.message || t.error.unknown}</p>
      <Link
        to="/"
        className="inline-block px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
      >
        {t.error.goHome}
      </Link>
    </div>
  )
}

function RootComponent() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      localStorage.setItem('ref_code', ref)
    }
  }, [])

  return (
    <I18nProvider>
    <AuthProvider>
    <WishlistProvider>
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </CartProvider>
    </WishlistProvider>
    </AuthProvider>
    </I18nProvider>
  )
}
