import { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { CartItem, Product } from '@/lib/types'

export type CartContextType = {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, selectedOptions?: Record<string, string>) => void
  removeItem: (productId: string, selectedOptions?: Record<string, string>) => void
  updateQuantity: (productId: string, quantity: number, selectedOptions?: Record<string, string>) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

export const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'shop-cart'

function cartItemKey(productId: string, selectedOptions?: Record<string, string>): string {
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) return productId
  const sorted = Object.keys(selectedOptions).sort().map((k) => `${k}:${selectedOptions[k]}`).join('|')
  return `${productId}::${sorted}`
}

function matchItem(item: CartItem, productId: string, selectedOptions?: Record<string, string>): boolean {
  return cartItemKey(item.productId, item.selectedOptions) === cartItemKey(productId, selectedOptions)
}

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((product: Product, quantity = 1, selectedOptions?: Record<string, string>) => {
    setItems((prev) => {
      const existing = prev.find((item) => matchItem(item, product.id, selectedOptions))
      if (existing) {
        return prev.map((item) =>
          matchItem(item, product.id, selectedOptions)
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      const translations = product.translations
        ? Object.fromEntries(
            Object.entries(product.translations).map(([loc, t]) => [loc, { name: t?.name }]),
          )
        : undefined
      // Calculate price with variant additional_price
      let price = product.price
      if (selectedOptions && product.variants) {
        const variant = product.variants.find((v) =>
          Object.entries(selectedOptions).every(([k, val]) => v.options[k] === val),
        )
        if (variant) price += variant.additional_price
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price,
          image: product.image,
          quantity,
          category: product.category,
          translations,
          selectedOptions,
        },
      ]
    })
  }, [])

  const removeItem = useCallback((productId: string, selectedOptions?: Record<string, string>) => {
    setItems((prev) => prev.filter((item) => !matchItem(item, productId, selectedOptions)))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number, selectedOptions?: Record<string, string>) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => !matchItem(item, productId, selectedOptions)))
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        matchItem(item, productId, selectedOptions) ? { ...item, quantity } : item,
      ),
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
