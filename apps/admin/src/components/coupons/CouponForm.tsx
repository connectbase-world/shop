import { useState, useEffect } from 'react'
import { CATEGORIES, INFLUENCERS_TABLE_ID } from '@/lib/constants'
import { formatPrice, toInfluencers } from '@/lib/utils'
import { cb } from '@/lib/connectbase'
import type { Influencer } from '@/lib/types'

export type CouponFormData = {
  code: string
  name: string
  discount_type: 'fixed' | 'percent'
  discount_value: number
  max_discount: number
  min_order_amount: number
  target_type: 'all' | 'category' | 'product'
  target_value: string
  total_quantity: number
  per_user_limit: number
  is_auto_issue: boolean
  is_active: boolean
  starts_at: string
  expires_at: string
  influencer_id: string
}

type Props = {
  initialData?: CouponFormData
  onSubmit: (data: CouponFormData) => Promise<void>
  submitLabel: string
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function getDefaultDates() {
  const now = new Date()
  const starts = now.toISOString().slice(0, 16)
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  return { starts, expires }
}

const defaults = getDefaultDates()

const defaultData: CouponFormData = {
  code: '',
  name: '',
  discount_type: 'fixed',
  discount_value: 0,
  max_discount: 0,
  min_order_amount: 0,
  target_type: 'all',
  target_value: '',
  total_quantity: -1,
  per_user_limit: 1,
  is_auto_issue: false,
  is_active: true,
  starts_at: defaults.starts,
  expires_at: defaults.expires,
  influencer_id: '',
}

export function CouponForm({ initialData, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<CouponFormData>({ ...defaultData, ...initialData })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [influencers, setInfluencers] = useState<Influencer[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await cb.database.getData(INFLUENCERS_TABLE_ID, { limit: 1000 })
        setInfluencers(toInfluencers(res.data ?? []).filter((i) => i.status === 'approved'))
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const set = <K extends keyof CouponFormData>(key: K, value: CouponFormData[K]) => {
    setForm((p) => ({ ...p, [key]: value }))
    setErrors((p) => ({ ...p, [key]: '' }))
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.code.trim()) errs.code = '쿠폰 코드를 입력하세요'
    if (!form.name.trim()) errs.name = '쿠폰 이름을 입력하세요'
    if (form.discount_value <= 0) errs.discount_value = '할인 값을 입력하세요'
    if (form.discount_type === 'percent' && form.discount_value > 100) {
      errs.discount_value = '할인율은 100% 이하여야 합니다'
    }
    if (!form.starts_at || !form.expires_at) errs.expires_at = '유효 기간을 설정하세요'
    if (form.starts_at >= form.expires_at) errs.expires_at = '종료일은 시작일 이후여야 합니다'
    if (form.target_type === 'category' && !form.target_value) errs.target_value = '카테고리를 선택하세요'
    if (form.target_type === 'product' && !form.target_value) errs.target_value = '상품 ID를 입력하세요'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit(form)
    } finally {
      setLoading(false)
    }
  }

  const discountPreview = form.discount_type === 'fixed'
    ? form.discount_value > 0 ? `${formatPrice(form.discount_value)} 할인` : ''
    : form.discount_value > 0
      ? `${form.discount_value}% 할인${form.max_discount > 0 ? ` (최대 ${formatPrice(form.max_discount)})` : ''}`
      : ''

  const categories = CATEGORIES.filter((c) => c.key !== 'all')

  return (
    <div className="max-w-2xl bg-white rounded-md border border-gray-200 p-6">
      <div className="grid gap-5">
        {/* 쿠폰 코드 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">쿠폰 코드</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="WELCOME2024"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={() => set('code', generateCode())}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 shrink-0"
            >
              자동 생성
            </button>
          </div>
          {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
        </div>

        {/* 쿠폰 이름 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">쿠폰 이름</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="신규회원 3,000원 할인"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* 할인 타입 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">할인 타입</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                checked={form.discount_type === 'fixed'}
                onChange={() => set('discount_type', 'fixed')}
                className="accent-black"
              />
              정액 할인 (원)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                checked={form.discount_type === 'percent'}
                onChange={() => set('discount_type', 'percent')}
                className="accent-black"
              />
              정률 할인 (%)
            </label>
          </div>
        </div>

        {/* 할인 값 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              할인 {form.discount_type === 'fixed' ? '금액 (원)' : '비율 (%)'}
            </label>
            <input
              type="number"
              value={form.discount_value || ''}
              onChange={(e) => set('discount_value', Number(e.target.value))}
              placeholder={form.discount_type === 'fixed' ? '3000' : '10'}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
            {errors.discount_value && <p className="text-xs text-red-500 mt-1">{errors.discount_value}</p>}
          </div>
          {form.discount_type === 'percent' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">최대 할인 금액 (원)</label>
              <input
                type="number"
                value={form.max_discount || ''}
                onChange={(e) => set('max_discount', Number(e.target.value))}
                placeholder="5000 (0=무제한)"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
              />
            </div>
          )}
        </div>

        {discountPreview && (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">{discountPreview}</p>
        )}

        {/* 최소 주문 금액 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">최소 주문 금액 (원)</label>
          <input
            type="number"
            value={form.min_order_amount || ''}
            onChange={(e) => set('min_order_amount', Number(e.target.value))}
            placeholder="0 (제한 없음)"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
          />
        </div>

        {/* 적용 범위 */}
        <div>
          <label className="block text-sm font-medium mb-1.5">적용 범위</label>
          <div className="flex gap-3 mb-2">
            {(['all', 'category', 'product'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={form.target_type === t}
                  onChange={() => { set('target_type', t); set('target_value', '') }}
                  className="accent-black"
                />
                {t === 'all' ? '전체 주문' : t === 'category' ? '특정 카테고리' : '특정 상품'}
              </label>
            ))}
          </div>
          {form.target_type === 'category' && (
            <select
              value={form.target_value}
              onChange={(e) => set('target_value', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            >
              <option value="">카테고리 선택</option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          )}
          {form.target_type === 'product' && (
            <input
              type="text"
              value={form.target_value}
              onChange={(e) => set('target_value', e.target.value)}
              placeholder="상품 ID 입력"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          )}
          {errors.target_value && <p className="text-xs text-red-500 mt-1">{errors.target_value}</p>}
        </div>

        {/* 수량 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">발급 수량</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.total_quantity === -1 ? '' : form.total_quantity}
                onChange={(e) => set('total_quantity', e.target.value ? Number(e.target.value) : -1)}
                placeholder="무제한"
                disabled={form.total_quantity === -1}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 disabled:bg-gray-50"
              />
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={form.total_quantity === -1}
                  onChange={(e) => set('total_quantity', e.target.checked ? -1 : 100)}
                  className="accent-black"
                />
                무제한
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">1인당 사용 횟수</label>
            <input
              type="number"
              value={form.per_user_limit || ''}
              onChange={(e) => set('per_user_limit', Number(e.target.value) || 1)}
              min={1}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* 유효 기간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">시작일</label>
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => set('starts_at', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">만료일</label>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => set('expires_at', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
            {errors.expires_at && <p className="text-xs text-red-500 mt-1">{errors.expires_at}</p>}
          </div>
        </div>

        {/* 옵션 */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_auto_issue}
              onChange={(e) => set('is_auto_issue', e.target.checked)}
              className="accent-black"
            />
            신규 회원 자동 발급
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="accent-black"
            />
            활성화
          </label>
        </div>

        {/* 인플루언서 연동 */}
        {influencers.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">인플루언서 연동</label>
            <select
              value={form.influencer_id}
              onChange={(e) => set('influencer_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            >
              <option value="">연동 없음</option>
              {influencers.map((inf) => (
                <option key={inf.id} value={inf.id}>
                  {inf.nickname} ({inf.ref_code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">이 쿠폰으로 구매 시 선택한 인플루언서에게 커미션이 지급됩니다</p>
          </div>
        )}

        {/* 쿠폰 링크 미리보기 */}
        {form.code && (
          <div className="bg-gray-50 px-3 py-2 rounded-md">
            <p className="text-xs text-gray-500 mb-1">쿠폰 링크</p>
            <p className="text-sm text-gray-800 font-mono break-all">
              https://019c852d-4741-7765-a06a-70acf93fb09b.web.connectbase.world/coupon/{form.code}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? '처리 중...' : submitLabel}
        </button>
      </div>
    </div>
  )
}
