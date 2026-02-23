import type { Product, CartItem } from '@/lib/types'
import type { Locale } from '@/lib/i18n'

export function getProductName(product: Product, locale: Locale): string {
  if (locale === 'ko') return product.name
  return product.translations?.[locale as keyof NonNullable<Product['translations']>]?.name || product.name
}

export function getProductDescription(product: Product, locale: Locale): string {
  if (locale === 'ko') return product.description
  return product.translations?.[locale as keyof NonNullable<Product['translations']>]?.description || product.description
}

export function getCartItemName(item: CartItem, locale: Locale): string {
  if (locale === 'ko') return item.name
  return item.translations?.[locale as keyof NonNullable<CartItem['translations']>]?.name || item.name
}
