import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Package, ChevronDown, ChevronUp, LogIn, Pencil, Check, X, Ticket, Coins, Megaphone, Copy, LinkIcon } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { ORDERS_TABLE_ID, PROFILES_TABLE_ID, COUPONS_TABLE_ID, USER_COUPONS_TABLE_ID, MILEAGE_HISTORY_TABLE_ID, INFLUENCERS_TABLE_ID, COMMISSIONS_TABLE_ID } from '@/lib/constants'
import { toOrders, toCoupons, toUserCoupons, toMileageHistories, getMileageBalance, toInfluencers, toCommissions, formatPrice, formatDateTime, formatDiscount } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import type { Order, Profile, Coupon, UserCoupon, MileageHistory, Influencer, Commission } from '@/lib/types'

export const Route = createFileRoute('/mypage')({
  component: MyPage,
})

function getStatusBadge(status: string, t: { orderStatus: Record<string, string> }) {
  const classMap: Record<string, string> = {
    paid: 'bg-blue-50 text-blue-700',
    preparing: 'bg-amber-50 text-amber-700',
    shipping: 'bg-purple-50 text-purple-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
  }
  return {
    label: (t.orderStatus as Record<string, string>)[status] || status,
    className: classMap[status] || 'bg-gray-100 text-gray-600',
  }
}

// --- 프로필 편집 컴포넌트 ---

type ProfileFormData = {
  name: string
  phone: string
  address: string
  address_detail: string
}

function ProfileSection({ user }: { user: { memberId: string; nickname?: string } }) {
  const { t } = useI18n()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProfileFormData>({
    name: '',
    phone: '',
    address: '',
    address_detail: '',
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await cb.database.getData(PROFILES_TABLE_ID, { limit: 1000 })
        const rows = result.data ?? []
        const myRow = rows.find((r: { id: string; data: Record<string, unknown> }) =>
          r.data.member_id === user.memberId
        )
        if (myRow) {
          const p = { id: myRow.id, ...myRow.data } as Profile
          setProfile(p)
          setForm({
            name: p.name || '',
            phone: p.phone || '',
            address: p.address || '',
            address_detail: p.address_detail || '',
          })
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetchProfile()
  }, [user.memberId])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (profile) {
        await cb.database.updateData(PROFILES_TABLE_ID, profile.id, {
          data: { ...form, member_id: user.memberId },
        })
        setProfile({ ...profile, ...form })
      } else {
        const result = await cb.database.createData(PROFILES_TABLE_ID, {
          data: { ...form, member_id: user.memberId },
        })
        setProfile({ id: result.id, member_id: user.memberId, ...form })
      }
      setEditing(false)
    } catch { /* ignore */ }
    setSaving(false)
  }

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        address_detail: profile.address_detail || '',
      })
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="border border-gray-100 rounded-sm p-5 mb-8">
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  const hasProfile = profile && (profile.name || profile.phone || profile.address)

  if (!editing) {
    return (
      <div className="border border-gray-100 rounded-sm p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{t.mypage.myInfo}</h2>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            {hasProfile ? t.common.edit : t.mypage.register}
          </button>
        </div>
        {hasProfile ? (
          <div className="text-sm flex flex-col gap-1.5">
            <div className="flex gap-3">
              <span className="text-gray-400 w-16 shrink-0">{t.checkout.name}</span>
              <span>{profile.name || '-'}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-16 shrink-0">{t.checkout.phone}</span>
              <span>{profile.phone || '-'}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-gray-400 w-16 shrink-0">{t.checkout.address}</span>
              <span>
                {profile.address || '-'}
                {profile.address_detail ? ` ${profile.address_detail}` : ''}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            {t.mypage.profileNotice}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="border border-gray-100 rounded-sm p-5 mb-8">
      <h2 className="text-lg font-bold mb-4">{t.mypage.myInfo} {hasProfile ? t.common.edit : t.mypage.register}</h2>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.checkout.name}</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder={t.checkout.namePlaceholder}
            className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.checkout.phone}</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder={t.checkout.phonePlaceholder}
            className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.checkout.address}</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder={t.checkout.addressPlaceholder}
            className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{t.checkout.addressDetail}</label>
          <input
            type="text"
            value={form.address_detail}
            onChange={(e) => setForm((p) => ({ ...p, address_detail: e.target.value }))}
            placeholder={t.checkout.addressDetailPlaceholder}
            className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-black transition-colors"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? t.mypage.saving : t.common.save}
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          {t.common.cancel}
        </button>
      </div>
    </div>
  )
}

// --- 내 쿠폰 ---

function MyCouponsSection({ user }: { user: { memberId: string } }) {
  const { t, locale } = useI18n()
  const [coupons, setCoupons] = useState<{ coupon: Coupon; userCoupon: UserCoupon }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [couponsRes, ucRes] = await Promise.all([
          cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 }),
          cb.database.getData(USER_COUPONS_TABLE_ID, { limit: 1000 }),
        ])
        const allCoupons = toCoupons(couponsRes.data ?? [])
        const userCoupons = toUserCoupons(ucRes.data ?? [])

        const mine = userCoupons
          .filter((uc) => uc.member_id === user.memberId)
          .map((uc) => {
            const coupon = allCoupons.find((c) => c.id === uc.coupon_id)
            return coupon ? { coupon, userCoupon: uc } : null
          })
          .filter((x): x is { coupon: Coupon; userCoupon: UserCoupon } => x !== null)
          .sort((a, b) => {
            if (a.userCoupon.status === 'available' && b.userCoupon.status !== 'available') return -1
            if (a.userCoupon.status !== 'available' && b.userCoupon.status === 'available') return 1
            return 0
          })

        setCoupons(mine)
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetch()
  }, [user.memberId])

  const availableCount = coupons.filter((c) => c.userCoupon.status === 'available').length

  if (loading) {
    return (
      <div className="border border-gray-100 rounded-sm p-5 mb-8">
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="border border-gray-100 rounded-sm p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-4 h-4 text-gray-600" />
        <h2 className="text-lg font-bold">{t.mypage.myCoupons}</h2>
        {availableCount > 0 && (
          <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">{availableCount}</span>
        )}
      </div>

      {coupons.length === 0 ? (
        <p className="text-sm text-gray-400">{t.mypage.noCoupons}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {coupons.map(({ coupon, userCoupon }) => {
            const isAvailable = userCoupon.status === 'available'
            const isExpired = new Date() > new Date(coupon.expires_at)
            return (
              <div
                key={userCoupon.id}
                className={`border rounded-sm p-3 ${
                  isAvailable && !isExpired
                    ? 'border-gray-200'
                    : 'border-gray-100 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{coupon.name}</p>
                    <p className="text-xs text-green-700 mt-0.5">{formatDiscount(coupon)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      ~ {new Date(coupon.expires_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      isAvailable && !isExpired
                        ? 'bg-green-50 text-green-700'
                        : userCoupon.status === 'used'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {isExpired ? t.mypage.expired : userCoupon.status === 'used' ? t.mypage.used : t.mypage.available}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- 마일리지 ---

function MileageSection({ user }: { user: { memberId: string } }) {
  const { t } = useI18n()
  const [histories, setHistories] = useState<MileageHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await cb.database.getData(MILEAGE_HISTORY_TABLE_ID, { limit: 1000 })
        const all = toMileageHistories(result.data ?? [])
        const mine = all
          .filter((h) => h.member_id === user.memberId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setHistories(mine)
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetch()
  }, [user.memberId])

  const balance = getMileageBalance(histories)

  if (loading) {
    return (
      <div className="border border-gray-100 rounded-sm p-5 mb-8">
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="border border-gray-100 rounded-sm p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-purple-600" />
          <h2 className="text-lg font-bold">{t.mypage.mileage}</h2>
        </div>
        <span className="text-lg font-bold text-purple-700">{formatPrice(balance)}</span>
      </div>

      {histories.length === 0 ? (
        <p className="text-sm text-gray-400">{t.mypage.noMileageHistory}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {histories.slice(0, 10).map((h) => {
            const isPositive = h.amount > 0
            const typeLabel = h.type === 'earn' ? t.mypage.earn : h.type === 'spend' ? t.mypage.spend : t.mypage.adjust
            const typeColor = h.type === 'earn'
              ? 'bg-green-50 text-green-700'
              : h.type === 'spend'
                ? 'bg-red-50 text-red-600'
                : 'bg-blue-50 text-blue-600'
            return (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${typeColor}`}>
                    {typeLabel}
                  </span>
                  <div>
                    <p className="text-sm">{h.description}</p>
                    <p className="text-[11px] text-gray-400">{formatDateTime(h.created_at)}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{formatPrice(h.amount)}
                </span>
              </div>
            )
          })}
          {histories.length > 10 && (
            <p className="text-xs text-gray-400 text-center pt-1">{t.mypage.recentOnly}</p>
          )}
        </div>
      )}
    </div>
  )
}

// --- 인플루언서 ---

function InfluencerSection({ user }: { user: { memberId: string; nickname?: string } }) {
  const { t } = useI18n()
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await cb.database.getData(INFLUENCERS_TABLE_ID, { limit: 1000 })
        const all = toInfluencers(result.data ?? [])
        const mine = all.find((inf) => inf.member_id === user.memberId)
        if (mine) {
          setInfluencer(mine)
          if (mine.status === 'approved') {
            const cResult = await cb.database.getData(COMMISSIONS_TABLE_ID, { limit: 1000 })
            const allC = toCommissions(cResult.data ?? [])
            setCommissions(
              allC
                .filter((c) => c.member_id === user.memberId)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            )
          }
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    fetch()
  }, [user.memberId])

  const handleApply = async () => {
    setApplying(true)
    try {
      const result = await cb.database.createData(INFLUENCERS_TABLE_ID, {
        data: {
          member_id: user.memberId,
          nickname: user.nickname || '',
          ref_code: '',
          status: 'pending',
          commission_rate: 0.05,
          total_earned: 0,
          total_settled: 0,
          memo: '',
          applied_at: new Date().toISOString(),
          approved_at: '',
        },
      })
      setInfluencer({
        id: result.id,
        member_id: user.memberId,
        nickname: user.nickname || '',
        ref_code: '',
        status: 'pending',
        commission_rate: 0.05,
        total_earned: 0,
        total_settled: 0,
        memo: '',
        applied_at: new Date().toISOString(),
        approved_at: '',
      })
    } catch { /* ignore */ }
    setApplying(false)
  }

  const handleCopyLink = () => {
    if (!influencer?.ref_code) return
    const link = `${window.location.origin}?ref=${influencer.ref_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="border border-gray-100 rounded-sm p-5 mb-8">
        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  // 미신청
  if (!influencer) {
    return (
      <div className="border border-gray-100 rounded-sm p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-4 h-4 text-orange-500" />
          <h2 className="text-lg font-bold">{t.mypage.influencer}</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {t.mypage.influencerDescription}
        </p>
        <button
          onClick={handleApply}
          disabled={applying}
          className="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {applying ? t.mypage.applying : t.mypage.applyInfluencer}
        </button>
      </div>
    )
  }

  // 대기중
  if (influencer.status === 'pending') {
    return (
      <div className="border border-gray-100 rounded-sm p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-4 h-4 text-orange-500" />
          <h2 className="text-lg font-bold">{t.mypage.influencer}</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{t.mypage.pendingReview}</span>
        </div>
        <p className="text-sm text-gray-500">
          {t.mypage.pendingMessage}
        </p>
      </div>
    )
  }

  // 반려
  if (influencer.status === 'rejected') {
    return (
      <div className="border border-gray-100 rounded-sm p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-4 h-4 text-orange-500" />
          <h2 className="text-lg font-bold">{t.mypage.influencer}</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">{t.mypage.rejected}</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {t.mypage.rejectedMessage}
          {influencer.memo && <span className="block mt-1 text-red-500">{t.mypage.rejectedReason.replace('{reason}', influencer.memo)}</span>}
        </p>
        <button
          onClick={handleApply}
          disabled={applying}
          className="px-5 py-2.5 border border-gray-200 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {applying ? t.mypage.applying : t.mypage.reapply}
        </button>
      </div>
    )
  }

  // 승인됨
  const pendingAmount = influencer.total_earned - influencer.total_settled
  return (
    <div className="border border-gray-100 rounded-sm p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-4 h-4 text-orange-500" />
        <h2 className="text-lg font-bold">{t.mypage.influencer}</h2>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700">{t.mypage.active}</span>
      </div>

      {/* 추천 링크 */}
      <div className="bg-gray-50 rounded-sm p-3 mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-500">{t.mypage.myReferralLink}</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-white border border-gray-200 rounded px-2.5 py-1.5 truncate">
            {window.location.origin}?ref={influencer.ref_code}
          </code>
          <button
            onClick={handleCopyLink}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors rounded"
          >
            <Copy className="w-3 h-3" />
            {copied ? t.common.copied : t.common.copy}
          </button>
        </div>
      </div>

      {/* 커미션 현황 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-sm p-3 text-center">
          <p className="text-sm font-bold">{formatPrice(influencer.total_earned)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{t.mypage.totalEarned}</p>
        </div>
        <div className="bg-orange-50 rounded-sm p-3 text-center">
          <p className="text-sm font-bold text-orange-700">{formatPrice(pendingAmount)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{t.mypage.unsettled}</p>
        </div>
        <div className="bg-gray-50 rounded-sm p-3 text-center">
          <p className="text-sm font-bold">{formatPrice(influencer.total_settled)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{t.mypage.settled}</p>
        </div>
      </div>

      {/* 커미션 비율 */}
      <p className="text-xs text-gray-400 mb-3">{t.mypage.commissionRate}: {Math.round(influencer.commission_rate * 100)}%</p>

      {/* 최근 커미션 내역 */}
      {commissions.length === 0 ? (
        <p className="text-sm text-gray-400">{t.mypage.noCommissions}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-medium">{t.mypage.recentCommissions}</p>
          {commissions.slice(0, 10).map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  c.status === 'settled' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {c.status === 'settled' ? t.mypage.settledStatus : t.mypage.pendingStatus}
                </span>
                <div>
                  <p className="text-sm">
                    {c.source === 'ref_link' ? t.mypage.refLinkCommission : t.mypage.couponCommission}
                  </p>
                  <p className="text-[11px] text-gray-400">{formatDateTime(c.created_at)}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-600">+{formatPrice(c.commission_amount)}</span>
            </div>
          ))}
          {commissions.length > 10 && (
            <p className="text-xs text-gray-400 text-center pt-1">{t.mypage.recentOnly}</p>
          )}
        </div>
      )}
    </div>
  )
}

// --- 메인 ---

function MyPage() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancelOrder = async (order: Order) => {
    if (!confirm(t.mypage.cancelConfirm)) return
    setCancellingId(order.id)
    try {
      await cb.database.updateData(ORDERS_TABLE_ID, order.id, {
        data: { status: 'cancelled' },
      })
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o)),
      )
    } catch {
      alert(t.mypage.cancelFailed)
    }
    setCancellingId(null)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) return

    const fetchOrders = async () => {
      try {
        const result = await cb.database.getData(ORDERS_TABLE_ID, { limit: 1000 })
        const allOrders = toOrders(result.data ?? [])
        const myOrders = allOrders
          .filter((o) => o.member_id === user.memberId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setOrders(myOrders)
      } catch { /* ignore */ }
      setLoading(false)
    }

    fetchOrders()
  }, [user, authLoading])

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <LogIn className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">{t.mypage.loginRequired}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {t.mypage.loginDescription}
        </p>
        <Link
          to="/login"
          search={{ redirect: '/mypage' }}
          className="inline-block px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          {t.mypage.loginButton}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t.mypage.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.mypage.greeting.replace('{name}', user.nickname || 'Member')}</p>
        </div>
      </div>

      {/* 내 정보 */}
      <ProfileSection user={user} />

      {/* 내 쿠폰 */}
      <MyCouponsSection user={user} />

      {/* 마일리지 */}
      <MileageSection user={user} />

      {/* 인플루언서 */}
      <InfluencerSection user={user} />

      {/* 주문 요약 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: t.mypage.totalOrders, value: orders.length },
          { label: t.mypage.shipping, value: orders.filter((o) => o.status === 'shipping').length },
          { label: t.mypage.delivered, value: orders.filter((o) => o.status === 'delivered').length },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-50 rounded-sm px-4 py-3 text-center">
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 주문 내역 */}
      <h2 className="text-lg font-bold mb-4">{t.mypage.orders}</h2>

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.mypage.loadingOrders}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t.mypage.noOrders}</p>
          <Link
            to="/products"
            className="inline-block px-6 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
          >
            {t.cart.goShopping}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const expanded = expandedId === order.id
            const statusInfo = getStatusBadge(order.status, t)

            return (
              <div key={order.id} className="border border-gray-100 rounded-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {order.created_at ? formatDateTime(order.created_at) : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{order.order_name}</p>
                    <p className="text-sm font-bold mt-0.5">{formatPrice(order.amount || 0)}</p>
                  </div>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                  )}
                </button>

                {expanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    <div className="flex flex-col gap-3 mb-4">
                      {order.items?.map((item, i) => (
                        <Link
                          key={i}
                          to="/products/$productId"
                          params={{ productId: item.productId }}
                          className="flex items-center gap-3 hover:bg-white rounded p-1 -m-1 transition-colors"
                        >
                          <div className="w-12 h-14 bg-gray-100 rounded-sm overflow-hidden shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatPrice(item.price)} x {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-medium shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-3 text-xs text-gray-500 flex flex-col gap-1.5">
                      <div className="flex gap-3">
                        <span className="text-gray-400 w-14 shrink-0">{t.mypage.orderNumber}</span>
                        <span className="font-mono">{order.order_id}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-gray-400 w-14 shrink-0">{t.mypage.recipient}</span>
                        <span>{order.customer_name}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-gray-400 w-14 shrink-0">{t.mypage.phone}</span>
                        <span>{order.customer_phone}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-gray-400 w-14 shrink-0">{t.checkout.address}</span>
                        <span>{order.address} {order.address_detail}</span>
                      </div>
                      {order.memo && (
                        <div className="flex gap-3">
                          <span className="text-gray-400 w-14 shrink-0">{t.mypage.memo}</span>
                          <span>{order.memo}</span>
                        </div>
                      )}
                    </div>
                    {order.status === 'paid' && (
                      <div className="border-t border-gray-100 mt-3 pt-3">
                        <button
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancellingId === order.id}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                        >
                          {cancellingId === order.id ? t.mypage.cancelling : t.mypage.cancelOrder}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
