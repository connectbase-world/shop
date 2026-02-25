import type { Product, Order, Review, Coupon, UserCoupon, CartItem, MileageHistory, Influencer, Commission, Post, Board, Page, Navigation, NavItem, QnA, Banner, Promotion } from './types'

export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원'
}

/**
 * ConnectBase의 row 형태 { id, data: { ... } }를 플랫한 Product로 변환
 */
export function toProduct(row: { id: string; data: Record<string, unknown> }): Product {
  return { id: row.id, ...row.data } as Product
}

export function toProducts(rows: { id: string; data: Record<string, unknown> }[]): Product[] {
  return rows.map(toProduct)
}

export function toOrder(row: { id: string; data: Record<string, unknown> }): Order {
  return { id: row.id, ...row.data } as Order
}

export function toOrders(rows: { id: string; data: Record<string, unknown> }[]): Order[] {
  return rows.map(toOrder)
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function toCoupon(row: { id: string; data: Record<string, unknown> }): Coupon {
  return { id: row.id, ...row.data } as Coupon
}

export function toCoupons(rows: { id: string; data: Record<string, unknown> }[]): Coupon[] {
  return rows.map(toCoupon)
}

export function toUserCoupon(row: { id: string; data: Record<string, unknown> }): UserCoupon {
  return { id: row.id, ...row.data } as UserCoupon
}

export function toUserCoupons(rows: { id: string; data: Record<string, unknown> }[]): UserCoupon[] {
  return rows.map(toUserCoupon)
}

export function formatDiscount(coupon: Coupon): string {
  if (coupon.discount_type === 'fixed') {
    return formatPrice(coupon.discount_value) + ' 할인'
  }
  return `${coupon.discount_value}% 할인` +
    (coupon.max_discount > 0 ? ` (최대 ${formatPrice(coupon.max_discount)})` : '')
}

export function isCouponValid(coupon: Coupon): boolean {
  const now = new Date()
  if (!coupon.is_active) return false
  if (now < new Date(coupon.starts_at) || now > new Date(coupon.expires_at)) return false
  if (coupon.total_quantity !== -1 && coupon.issued_count >= coupon.total_quantity) return false
  return true
}

export function calculateDiscount(coupon: Coupon, items: CartItem[]): number {
  let applicableTotal = 0
  if (coupon.target_type === 'all') {
    applicableTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  } else if (coupon.target_type === 'category') {
    const targetItems = items.filter(i => i.category === coupon.target_value)
    applicableTotal = targetItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  } else if (coupon.target_type === 'product') {
    const targetItems = items.filter(i => i.productId === coupon.target_value)
    applicableTotal = targetItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  }
  if (applicableTotal === 0) return 0

  let discount = 0
  if (coupon.discount_type === 'fixed') {
    discount = coupon.discount_value
  } else {
    discount = Math.floor(applicableTotal * (coupon.discount_value / 100))
    if (coupon.max_discount > 0) {
      discount = Math.min(discount, coupon.max_discount)
    }
  }
  return Math.min(discount, applicableTotal)
}

export function toMileageHistory(row: { id: string; data: Record<string, unknown> }): MileageHistory {
  return { id: row.id, ...row.data } as MileageHistory
}

export function toMileageHistories(rows: { id: string; data: Record<string, unknown> }[]): MileageHistory[] {
  return rows.map(toMileageHistory)
}

export function getMileageBalance(histories: MileageHistory[]): number {
  if (histories.length === 0) return 0
  const sorted = [...histories].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  return sorted[0].balance_after
}

export function toInfluencer(row: { id: string; data: Record<string, unknown> }): Influencer {
  return { id: row.id, ...row.data } as Influencer
}

export function toInfluencers(rows: { id: string; data: Record<string, unknown> }[]): Influencer[] {
  return rows.map(toInfluencer)
}

export function toCommission(row: { id: string; data: Record<string, unknown> }): Commission {
  return { id: row.id, ...row.data } as Commission
}

export function toCommissions(rows: { id: string; data: Record<string, unknown> }[]): Commission[] {
  return rows.map(toCommission)
}

export function toReview(row: { id: string; data: Record<string, unknown> }): Review {
  return { id: row.id, ...row.data } as Review
}

export function toReviews(rows: { id: string; data: Record<string, unknown> }[]): Review[] {
  return rows.map(toReview)
}

export function toPost(row: { id: string; data: Record<string, unknown> }): Post {
  return { id: row.id, ...row.data } as Post
}

export function toPosts(rows: { id: string; data: Record<string, unknown> }[]): Post[] {
  return rows.map(toPost)
}

export function toBoard(row: { id: string; data: Record<string, unknown> }): Board {
  return { id: row.id, ...row.data } as Board
}

export function toBoards(rows: { id: string; data: Record<string, unknown> }[]): Board[] {
  return rows.map(toBoard)
}

export function toPage(row: { id: string; data: Record<string, unknown> }): Page {
  return { id: row.id, ...row.data } as Page
}

export function toPages(rows: { id: string; data: Record<string, unknown> }[]): Page[] {
  return rows.map(toPage)
}

export function toNavigation(row: { id: string; data: Record<string, unknown> }): Navigation {
  return { id: row.id, ...row.data } as Navigation
}

export function toNavigations(rows: { id: string; data: Record<string, unknown> }[]): Navigation[] {
  return rows.map(toNavigation)
}

export function toNavItem(row: { id: string; data: Record<string, unknown> }): NavItem {
  return { id: row.id, ...row.data } as NavItem
}

export function toNavItems(rows: { id: string; data: Record<string, unknown> }[]): NavItem[] {
  return rows.map(toNavItem)
}

export function toQnA(row: { id: string; data: Record<string, unknown> }): QnA {
  return { id: row.id, ...row.data } as QnA
}

export function toQnAs(rows: { id: string; data: Record<string, unknown> }[]): QnA[] {
  return rows.map(toQnA)
}

export function toBanner(row: { id: string; data: Record<string, unknown> }): Banner {
  return { id: row.id, ...row.data } as Banner
}

export function toBanners(rows: { id: string; data: Record<string, unknown> }[]): Banner[] {
  return rows.map(toBanner)
}

export function toPromotion(row: { id: string; data: Record<string, unknown> }): Promotion {
  return { id: row.id, ...row.data } as Promotion
}

export function toPromotions(rows: { id: string; data: Record<string, unknown> }[]): Promotion[] {
  return rows.map(toPromotion)
}

export function getDiscountedPrice(price: number, promotion: Promotion): number {
  if (promotion.discount_type === 'fixed') {
    return Math.max(0, price - promotion.discount_value)
  }
  let discount = Math.floor(price * (promotion.discount_value / 100))
  if (promotion.max_discount && promotion.max_discount > 0) {
    discount = Math.min(discount, promotion.max_discount)
  }
  return Math.max(0, price - discount)
}
