export type SupportedLocale = 'en'

export type ProductTranslation = {
  name?: string
  description?: string
}

export type ProductOption = {
  name: string
  values: string[]
}

export type ProductVariant = {
  options: Record<string, string>
  stock: number
  additional_price: number
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
  options?: ProductOption[]
  variants?: ProductVariant[]
}

export type CartItem = {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  category?: string
  translations?: Partial<Record<SupportedLocale, { name?: string }>>
  selectedOptions?: Record<string, string>
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
  selectedOptions?: Record<string, string>
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
  tracking_carrier?: string
  tracking_number?: string
  return_reason?: string
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
  images: string[]
  created_at: string
}

export type Board = {
  id: string
  name: string
  slug: string
  description: string
  sort_order: number
  is_active: boolean
  show_in_nav: boolean
  allow_user_posts: boolean
  created_at: string
}

export type Post = {
  id: string
  board_id: string
  title: string
  content: string
  content_format: 'html' | 'markdown'
  summary: string
  thumbnail: string
  is_published: boolean
  is_pinned: boolean
  is_secret: boolean
  member_id: string
  view_count: number
  author: string
  created_at: string
  updated_at: string
}

export type Page = {
  id: string
  title: string
  slug: string
  content: string
  content_format: 'html' | 'markdown'
  summary: string
  thumbnail: string
  banner_image: string
  is_published: boolean
  show_in_nav: boolean
  nav_label: string
  nav_order: number
  author: string
  view_count: number
  created_at: string
  updated_at: string
}

export type Navigation = {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
}

export type NavItem = {
  id: string
  navigation_id: string
  type: 'board' | 'page' | 'product' | 'link'
  target_id: string
  label: string
  url: string
  sort_order: number
}

export type QnA = {
  id: string
  product_id: string
  member_id: string
  nickname: string
  question: string
  answer: string
  is_answered: boolean
  is_secret: boolean
  created_at: string
  answered_at: string
}

export type Banner = {
  id: string
  title: string
  subtitle: string
  image: string
  mobile_image: string
  link_url: string
  link_type: 'internal' | 'external'
  position: 'hero' | 'promotion' | 'popup'
  sort_order: number
  is_active: boolean
  starts_at: string
  ends_at: string
  created_at: string
}

export type Promotion = {
  id: string
  title: string
  description: string
  image: string
  discount_type: 'fixed' | 'percent'
  discount_value: number
  max_discount: number
  target_type: 'all' | 'category' | 'products'
  target_value: string
  product_ids: string[]
  starts_at: string
  ends_at: string
  is_active: boolean
  sort_order: number
  created_at: string
}
