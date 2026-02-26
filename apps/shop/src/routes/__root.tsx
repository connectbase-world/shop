import { useEffect, useRef } from 'react'
import { Outlet, createRootRoute, ErrorComponent, Link, useRouterState } from '@tanstack/react-router'
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
import { initAnalytics, trackPageView } from '@/lib/analytics'
import { cb } from '@/lib/connectbase'
import { BOARDS_TABLE_ID, PAGES_TABLE_ID, PRODUCTS_TABLE_ID, NAVIGATIONS_TABLE_ID, NAV_ITEMS_TABLE_ID, TRACKING_CONFIG_TABLE_ID } from '@/lib/constants'
import { toBoards, toPages, toProducts, toNavigations, toNavItems } from '@/lib/utils'
import { injectTrackingScripts, type TrackingConfig } from '@/lib/tracking'

function getT() {
  const locale = (typeof localStorage !== 'undefined' && localStorage.getItem('shop_locale')) || 'ko'
  return locale === 'en' ? en : ko
}

import '../styles.css'

export const Route = createRootRoute({
  loader: async () => {
    const [boardsRes, pagesRes, productsRes, navsRes, navItemsRes, trackingRes] = await Promise.all([
      cb.database.getData(BOARDS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(PAGES_TABLE_ID, { limit: 1000 }),
      cb.database.getData(PRODUCTS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(NAVIGATIONS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(NAV_ITEMS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(TRACKING_CONFIG_TABLE_ID, { limit: 1 }).catch(() => ({ data: [] })),
    ])
    const boards = toBoards(boardsRes.data ?? [])
    const pages = toPages(pagesRes.data ?? [])
    const products = toProducts(productsRes.data ?? [])
    const navigations = toNavigations(navsRes.data ?? []).filter((n) => n.is_active)
    const allNavItems = toNavItems(navItemsRes.data ?? [])

    // 네비게이션별 resolved links 생성
    const resolvedNavs = navigations.map((nav) => {
      const items = allNavItems
        .filter((i) => i.navigation_id === nav.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      const links = items.map((item) => {
        if (item.type === 'board') {
          const board = boards.find((b) => b.id === item.target_id)
          return board ? { label: item.label, to: `/boards/${board.slug}` } : null
        }
        if (item.type === 'page') {
          const page = pages.find((p) => p.id === item.target_id)
          return page ? { label: item.label, to: `/p/${page.slug}` } : null
        }
        if (item.type === 'product') {
          if (item.target_id === '__all__') return { label: item.label, to: '/products' }
          const product = products.find((p) => p.id === item.target_id)
          return product ? { label: item.label, to: `/products/${product.id}` } : null
        }
        return { label: item.label, to: item.url }
      }).filter(Boolean) as { label: string; to: string }[]
      return { slug: nav.slug, name: nav.name, links }
    })

    const trackingRows = trackingRes.data ?? []
    const trackingConfig = trackingRows.length > 0
      ? (trackingRows[0].data as TrackingConfig)
      : null

    return { resolvedNavs, trackingConfig }
  },
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
  const { location } = useRouterState()
  const { trackingConfig } = Route.useLoaderData()
  const prevPath = useRef('')

  useEffect(() => {
    initAnalytics()
    if (trackingConfig) injectTrackingScripts(trackingConfig)
  }, [])

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname
      trackPageView(location.pathname)
    }
  }, [location.pathname])

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
