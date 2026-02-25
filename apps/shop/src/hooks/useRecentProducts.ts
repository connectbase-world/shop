import { useCallback } from 'react'

const STORAGE_KEY = 'recent_products'
const MAX_ITEMS = 10

export function addRecentProduct(productId: string) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const ids: string[] = stored ? JSON.parse(stored) : []
    const filtered = ids.filter((id) => id !== productId)
    filtered.unshift(productId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)))
  } catch { /* ignore */ }
}

export function useRecentProducts() {
  const getRecentIds = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [])

  return { getRecentIds }
}
