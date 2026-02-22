import { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'

export type WishlistContextType = {
  items: string[]
  toggle: (productId: string) => void
  has: (productId: string) => boolean
  count: number
}

export const WishlistContext = createContext<WishlistContextType | null>(null)

const STORAGE_KEY = 'shop-wishlist'

function loadWishlist(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(loadWishlist)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const toggle = useCallback((productId: string) => {
    setItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    )
  }, [])

  const has = useCallback(
    (productId: string) => items.includes(productId),
    [items],
  )

  const value = useMemo(
    () => ({ items, toggle, has, count: items.length }),
    [items, toggle, has],
  )

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  )
}
