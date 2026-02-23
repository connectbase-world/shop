export type SupportedLocale = 'en'

export type ProductTranslation = {
  name?: string
  description?: string
}

export type Product = {
  id: string
  name: string
  price: number
  description: string
  image: string
  images: string[]
  detail_images: string[]
  category: string
  is_featured: boolean
  stock: number
  created_at: string
  translations?: Partial<Record<SupportedLocale, ProductTranslation>>
}

export type CartItem = {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  category?: string
  translations?: Partial<Record<SupportedLocale, { name?: string }>>
}

export type OrderInfo = {
  name: string
  phone: string
  address: string
  addressDetail: string
  memo: string
}

export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

export type Order = {
  id: string
  order_id: string
  order_name: string
  amount: number
  payment_key: string
  status: string
  items: OrderItem[]
  customer_name: string
  customer_phone: string
  address: string
  address_detail: string
  memo: string
  member_id: string
  coupon_code?: string
  coupon_discount?: number
  created_at: string
}

export type Profile = {
  id: string
  member_id: string
  name: string
  phone: string
  address: string
  address_detail: string
}

export type Coupon = {
  id: string
  code: string
  name: string
  discount_type: 'fixed' | 'percent'
  discount_value: number
  max_discount: number
  min_order_amount: number
  target_type: 'all' | 'category' | 'product'
  target_value: string
  total_quantity: number
  issued_count: number
  used_count: number
  per_user_limit: number
  is_auto_issue: boolean
  is_active: boolean
  starts_at: string
  expires_at: string
  created_at: string
  influencer_id?: string
}

export type UserCoupon = {
  id: string
  coupon_id: string
  member_id: string
  code: string
  status: 'available' | 'used' | 'expired'
  used_at?: string
  order_id?: string
  claimed_at: string
}

export type MileageHistory = {
  id: string
  member_id: string
  type: 'earn' | 'spend' | 'adjust'
  amount: number
  balance_after: number
  description: string
  order_id: string
  created_at: string
}

export type Influencer = {
  id: string
  member_id: string
  nickname: string
  ref_code: string
  status: 'pending' | 'approved' | 'rejected'
  commission_rate: number
  total_earned: number
  total_settled: number
  memo: string
  applied_at: string
  approved_at: string
}

export type Commission = {
  id: string
  influencer_id: string
  member_id: string
  order_id: string
  order_amount: number
  commission_rate: number
  commission_amount: number
  source: 'ref_link' | 'coupon'
  status: 'pending' | 'settled'
  created_at: string
}

export type Review = {
  id: string
  product_id: string
  member_id: string
  nickname: string
  rating: number
  content: string
  created_at: string
}
