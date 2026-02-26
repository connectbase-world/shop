import { cb } from './connectbase'
import { ANALYTICS_EVENTS_TABLE_ID } from './constants'

const VISITOR_KEY = 'analytics_visitor_id'
const SESSION_KEY = 'analytics_session_id'

let visitorId = ''
let sessionId = ''
let memberId = ''
let eventQueue: Record<string, unknown>[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null
let initialized = false
let flushing = false

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = generateId()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = generateId()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function getMemberId(): string {
  try {
    const userStr = localStorage.getItem('shop_user')
    if (userStr) {
      const user = JSON.parse(userStr)
      return user.memberId || ''
    }
  } catch { /* ignore */ }
  return ''
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function sendWithRetry(data: Record<string, unknown>, retries = 2): Promise<void> {
  for (let i = 0; i <= retries; i++) {
    try {
      await cb.database.createData(ANALYTICS_EVENTS_TABLE_ID, { data })
      return
    } catch (err: unknown) {
      const is429 = err instanceof Error && (err.message.includes('429') || err.message.includes('rate'))
      if (is429 && i < retries) {
        await delay(1000 * (i + 1))
        continue
      }
      // 마지막 시도거나 429가 아니면 무시
      return
    }
  }
}

async function flushQueue() {
  if (eventQueue.length === 0 || flushing) return
  flushing = true
  const batch = eventQueue.splice(0)
  for (let i = 0; i < batch.length; i++) {
    await sendWithRetry(batch[i])
    if (i < batch.length - 1) await delay(200)
  }
  flushing = false
}

function enqueue(event: Record<string, unknown>) {
  eventQueue.push(event)
  if (eventQueue.length >= 10) {
    flushQueue()
  }
}

function buildEvent(eventType: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  // initAnalytics 전에 호출될 수 있으므로 항상 fallback
  if (!visitorId) visitorId = getVisitorId()
  if (!sessionId) sessionId = getSessionId()
  if (!memberId) memberId = getMemberId()

  return {
    event_type: eventType,
    page_path: window.location.pathname,
    visitor_id: visitorId,
    member_id: memberId,
    session_id: sessionId,
    created_at: new Date().toISOString(),
    ...extra,
  }
}

export function initAnalytics() {
  if (initialized) return
  initialized = true
  visitorId = getVisitorId()
  sessionId = getSessionId()
  memberId = getMemberId()

  flushTimer = setInterval(flushQueue, 10000)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushQueue()
    }
  })
}

export function trackPageView(path: string) {
  enqueue(buildEvent('page_view', { page_path: path }))
}

export function trackProductView(product: { id: string; name: string; category: string }) {
  enqueue(buildEvent('product_view', {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
  }))
}

export function trackAddToCart(product: { id: string; name: string; category: string; price: number }, quantity: number) {
  enqueue(buildEvent('add_to_cart', {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    event_data: { quantity, price: product.price },
  }))
}

export function trackPurchase(orderId: string, amount: number, items: { productId: string; name: string; price: number; quantity: number }[]) {
  enqueue(buildEvent('purchase_complete', {
    event_data: { order_id: orderId, amount, item_count: items.length, items: items.map(i => ({ id: i.productId, name: i.name, price: i.price, qty: i.quantity })) },
  }))
  flushQueue()
}

export function trackEvent(eventType: string, data?: Record<string, unknown>) {
  enqueue(buildEvent(eventType, data ? { event_data: data } : {}))
}

export function updateMemberId(newMemberId: string) {
  memberId = newMemberId
}

export function trackLogin(id: string, nickname: string) {
  memberId = id
  enqueue(buildEvent('login', { event_data: { nickname } }))
}

export function trackLogout() {
  enqueue(buildEvent('logout'))
  flushQueue()
  memberId = ''
}

export function trackSearch(keyword: string) {
  enqueue(buildEvent('search', { event_data: { keyword } }))
}
