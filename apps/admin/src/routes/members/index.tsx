import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Search, X, Users, ShoppingBag, Star, Eye, ChevronDown, ChevronUp,
  Ticket, Coins, Gift, Plus, Minus, Megaphone, Shield,
} from 'lucide-react'
import { cb } from '@/lib/connectbase'
import {
  ORDERS_TABLE_ID, PROFILES_TABLE_ID, REVIEWS_TABLE_ID, MEMBERS_TABLE_ID,
  COUPONS_TABLE_ID, USER_COUPONS_TABLE_ID, MILEAGE_HISTORY_TABLE_ID,
  INFLUENCERS_TABLE_ID, DEFAULT_COMMISSION_RATE,
} from '@/lib/constants'
import {
  toOrders, toProfiles, toReviews, toMemberRows, toCoupons, toUserCoupons,
  toMileageHistories, toInfluencers, getMileageBalance, formatPrice, formatDateTime, formatDiscount,
} from '@/lib/utils'
import type { Member, MemberRow, Order, Profile, Review, Coupon, UserCoupon, MileageHistory, Influencer } from '@/lib/types'

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  naver: '네이버',
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: '결제완료', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: '준비중', color: 'bg-yellow-100 text-yellow-700' },
  shipped: { label: '배송중', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: '배송완료', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소됨', color: 'bg-red-100 text-red-700' },
}

export const Route = createFileRoute('/members/')({
  loader: async () => {
    const [membersResult, ordersResult, profilesResult, reviewsResult, couponsResult, userCouponsResult, mileageResult, influencersResult] =
      await Promise.all([
        cb.database.getData(MEMBERS_TABLE_ID, { limit: 1000 }),
        cb.database.getData(ORDERS_TABLE_ID, { limit: 1000 }),
        cb.database.getData(PROFILES_TABLE_ID, { limit: 1000 }),
        cb.database.getData(REVIEWS_TABLE_ID, { limit: 1000 }),
        cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 }),
        cb.database.getData(USER_COUPONS_TABLE_ID, { limit: 1000 }),
        cb.database.getData(MILEAGE_HISTORY_TABLE_ID, { limit: 1000 }),
        cb.database.getData(INFLUENCERS_TABLE_ID, { limit: 1000 }),
      ])
    const memberRows = toMemberRows(membersResult.data ?? [])
    const orders = toOrders(ordersResult.data ?? [])
    const profiles = toProfiles(profilesResult.data ?? [])
    const reviews = toReviews(reviewsResult.data ?? [])
    const coupons = toCoupons(couponsResult.data ?? [])
    const userCoupons = toUserCoupons(userCouponsResult.data ?? [])
    const mileageHistories = toMileageHistories(mileageResult.data ?? [])
    const influencers = toInfluencers(influencersResult.data ?? [])
    return { memberRows, orders, profiles, reviews, coupons, userCoupons, mileageHistories, influencers }
  },
  component: MembersPage,
})

function buildMembers(
  memberRows: MemberRow[],
  profiles: Profile[],
  orders: Order[],
  reviews: Review[],
): Member[] {
  const memberMap = new Map<string, Member>()

  for (const m of memberRows) {
    if (!m.member_id) continue
    memberMap.set(m.member_id, {
      memberId: m.member_id,
      nickname: m.nickname || '',
      provider: m.provider || '',
      role: m.role || 'user',
      name: '',
      phone: '',
      address: '',
      orderCount: 0,
      totalSpent: 0,
      reviewCount: 0,
      lastOrderDate: null,
      lastLogin: m.last_login || null,
      createdAt: m.created_at || null,
    })
  }

  for (const p of profiles) {
    if (!p.member_id) continue
    const m = memberMap.get(p.member_id)
    if (m) {
      if (p.name) m.name = p.name
      if (p.phone) m.phone = p.phone
      if (p.address) m.address = p.address
    }
  }

  for (const o of orders) {
    if (!o.member_id) continue
    const m = memberMap.get(o.member_id)
    if (!m) continue
    if (!m.name && o.customer_name) m.name = o.customer_name
    if (!m.phone && o.customer_phone) m.phone = o.customer_phone
    m.orderCount++
    if (o.status !== 'cancelled') {
      m.totalSpent += o.amount
    }
    if (!m.lastOrderDate || new Date(o.created_at) > new Date(m.lastOrderDate)) {
      m.lastOrderDate = o.created_at
    }
  }

  for (const r of reviews) {
    if (!r.member_id) continue
    const m = memberMap.get(r.member_id)
    if (m) m.reviewCount++
  }

  return Array.from(memberMap.values())
}

type SortKey = 'nickname' | 'orderCount' | 'totalSpent' | 'createdAt'

function MembersPage() {
  const { memberRows, orders, profiles, reviews, coupons, userCoupons, mileageHistories, influencers } =
    Route.useLoaderData()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [localUserCoupons, setLocalUserCoupons] = useState(userCoupons)
  const [localMileageHistories, setLocalMileageHistories] = useState(mileageHistories)
  const [localCoupons, setLocalCoupons] = useState(coupons)
  const [localInfluencers, setLocalInfluencers] = useState(influencers)

  const members = useMemo(
    () => buildMembers(memberRows, profiles, orders, reviews),
    [memberRows, profiles, orders, reviews],
  )

  const filtered = useMemo(() => {
    let list = members
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) =>
          m.nickname.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.memberId.toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'nickname':
          cmp = (a.nickname || a.name).localeCompare(b.nickname || b.name, 'ko')
          break
        case 'orderCount':
          cmp = a.orderCount - b.orderCount
          break
        case 'totalSpent':
          cmp = a.totalSpent - b.totalSpent
          break
        case 'createdAt': {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
          cmp = aDate - bDate
          break
        }
      }
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [members, search, sortKey, sortAsc])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) return null
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    )
  }

  const totalMembers = members.length
  const totalRevenue = members.reduce((s, m) => s + m.totalSpent, 0)
  const totalOrders = members.reduce((s, m) => s + m.orderCount, 0)
  const totalReviews = members.reduce((s, m) => s + m.reviewCount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">회원 관리</h1>
        <span className="text-sm text-gray-500">{filtered.length}명</span>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Users className="w-3.5 h-3.5" />
            전체 회원
          </div>
          <p className="text-xl font-bold">{totalMembers}명</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            총 주문
          </div>
          <p className="text-xl font-bold">{totalOrders}건</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            총 매출
          </div>
          <p className="text-xl font-bold">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
            <Star className="w-3.5 h-3.5" />
            총 리뷰
          </div>
          <p className="text-xl font-bold">{totalReviews}개</p>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="닉네임, 이름, 연락처 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          {search ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  <button onClick={() => handleSort('nickname')} className="hover:text-gray-900">
                    회원 <SortIcon field="nickname" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">역할</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">가입 경로</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  <button onClick={() => handleSort('orderCount')} className="hover:text-gray-900">
                    주문수 <SortIcon field="orderCount" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  <button onClick={() => handleSort('totalSpent')} className="hover:text-gray-900">
                    누적 구매액 <SortIcon field="totalSpent" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">리뷰</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  <button onClick={() => handleSort('createdAt')} className="hover:text-gray-900">
                    가입일 <SortIcon field="createdAt" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((member) => (
                <tr key={member.memberId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{member.nickname || member.name || '-'}</p>
                    {member.name && member.nickname && member.name !== member.nickname && (
                      <p className="text-[11px] text-gray-400">{member.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {member.role !== 'user' && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'super_admin'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {member.role === 'super_admin' ? '최고관리자' : '관리자'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {PROVIDER_LABEL[member.provider] || member.provider || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {member.orderCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatPrice(member.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    {member.reviewCount}개
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {member.createdAt ? formatDateTime(member.createdAt) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedMemberId(member.memberId)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedMemberId && (
        <MemberDetailModal
          memberId={selectedMemberId}
          members={members}
          memberRows={memberRows}
          orders={orders}
          reviews={reviews}
          profiles={profiles}
          coupons={localCoupons}
          userCoupons={localUserCoupons}
          mileageHistories={localMileageHistories}
          influencers={localInfluencers}
          onCouponIssued={(newUc, updatedCoupon) => {
            setLocalUserCoupons((prev) => [...prev, newUc])
            setLocalCoupons((prev) =>
              prev.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c)),
            )
          }}
          onMileageAdjusted={(newHistory) => {
            setLocalMileageHistories((prev) => [...prev, newHistory])
          }}
          onInfluencerAdded={(inf) => {
            setLocalInfluencers((prev) => [...prev, inf])
          }}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  )
}

type TabKey = 'orders' | 'reviews' | 'coupons' | 'mileage'

function generateRefCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'INF_'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function MemberDetailModal({
  memberId,
  members,
  memberRows,
  orders,
  reviews,
  profiles,
  coupons,
  userCoupons,
  mileageHistories,
  influencers,
  onCouponIssued,
  onMileageAdjusted,
  onInfluencerAdded,
  onClose,
}: {
  memberId: string
  members: Member[]
  memberRows: MemberRow[]
  orders: Order[]
  reviews: Review[]
  profiles: Profile[]
  coupons: Coupon[]
  userCoupons: UserCoupon[]
  mileageHistories: MileageHistory[]
  influencers: Influencer[]
  onCouponIssued: (uc: UserCoupon, coupon: Coupon) => void
  onMileageAdjusted: (history: MileageHistory) => void
  onInfluencerAdded: (inf: Influencer) => void
  onClose: () => void
}) {
  const member = members.find((m) => m.memberId === memberId)
  const profile = profiles.find((p) => p.member_id === memberId)
  const memberOrders = orders
    .filter((o) => o.member_id === memberId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const memberReviews = reviews
    .filter((r) => r.member_id === memberId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const memberUserCoupons = userCoupons.filter((uc) => uc.member_id === memberId)
  const memberMileage = mileageHistories
    .filter((h) => h.member_id === memberId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const mileageBalance = getMileageBalance(memberMileage)

  const [tab, setTab] = useState<TabKey>('orders')
  const [showCouponIssue, setShowCouponIssue] = useState(false)
  const [showMileageAdjust, setShowMileageAdjust] = useState(false)
  const [addingInfluencer, setAddingInfluencer] = useState(false)
  const [changingRole, setChangingRole] = useState(false)

  const existingInfluencer = influencers.find((inf) => inf.member_id === memberId)

  const handleAddInfluencer = async () => {
    if (!member) return
    setAddingInfluencer(true)
    try {
      const refCode = generateRefCode()
      const now = new Date().toISOString()
      const result = await cb.database.createData(INFLUENCERS_TABLE_ID, {
        data: {
          member_id: memberId,
          nickname: member.nickname || member.name || '',
          ref_code: refCode,
          status: 'approved',
          commission_rate: DEFAULT_COMMISSION_RATE,
          total_earned: 0,
          total_settled: 0,
          memo: '',
          applied_at: now,
          approved_at: now,
        },
      })
      const newInf: Influencer = {
        id: result.id,
        member_id: memberId,
        nickname: member.nickname || member.name || '',
        ref_code: refCode,
        status: 'approved',
        commission_rate: DEFAULT_COMMISSION_RATE,
        total_earned: 0,
        total_settled: 0,
        memo: '',
        applied_at: now,
        approved_at: now,
      }
      onInfluencerAdded(newInf)
    } catch {
      alert('인플루언서 등록에 실패했습니다.')
    }
    setAddingInfluencer(false)
  }

  if (!member) return null

  const COUPON_STATUS: Record<string, { label: string; color: string }> = {
    available: { label: '사용가능', color: 'bg-green-100 text-green-700' },
    used: { label: '사용완료', color: 'bg-gray-100 text-gray-500' },
    expired: { label: '만료', color: 'bg-red-100 text-red-500' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold">회원 상세</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-5">
          {/* 기본 정보 */}
          <div className="bg-gray-50 rounded-md p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">닉네임</span>
                <p className="font-medium">{member.nickname || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">가입 경로</span>
                <p className="font-medium">{PROVIDER_LABEL[member.provider] || member.provider || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">이름</span>
                <p className="font-medium">{member.name || profile?.name || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">연락처</span>
                <p className="font-medium">{member.phone || profile?.phone || '-'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 text-xs">주소</span>
                <p className="font-medium">
                  {profile?.address || member.address || '-'}
                  {profile?.address_detail && ` ${profile.address_detail}`}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">가입일</span>
                <p className="text-xs text-gray-600">
                  {member.createdAt ? formatDateTime(member.createdAt) : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">마지막 로그인</span>
                <p className="text-xs text-gray-600">
                  {member.lastLogin ? formatDateTime(member.lastLogin) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* 역할 관리 */}
          <div className="border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">관리자 역할</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  member.role === 'super_admin'
                    ? 'bg-purple-100 text-purple-700'
                    : member.role === 'admin'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {member.role === 'super_admin' ? '최고관리자' : member.role === 'admin' ? '관리자' : '일반 회원'}
                </span>
                <select
                  value={member.role}
                  disabled={changingRole}
                  onChange={async (e) => {
                    const newRole = e.target.value as 'user' | 'admin' | 'super_admin'
                    const row = memberRows.find((r) => r.member_id === memberId)
                    if (!row) return
                    setChangingRole(true)
                    try {
                      await cb.database.updateData(MEMBERS_TABLE_ID, row.id, {
                        data: { role: newRole },
                      })
                      member.role = newRole
                      row.role = newRole
                    } catch {
                      alert('역할 변경에 실패했습니다.')
                    }
                    setChangingRole(false)
                  }}
                  className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-gray-400 bg-white disabled:opacity-50"
                >
                  <option value="user">일반 회원</option>
                  <option value="admin">관리자</option>
                  <option value="super_admin">최고관리자</option>
                </select>
              </div>
            </div>
          </div>

          {/* 인플루언서 */}
          <div className="border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">인플루언서</span>
              </div>
              {existingInfluencer ? (
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    existingInfluencer.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : existingInfluencer.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-600'
                  }`}>
                    {existingInfluencer.status === 'approved' ? '활동중' : existingInfluencer.status === 'pending' ? '심사중' : '반려'}
                  </span>
                  {existingInfluencer.ref_code && (
                    <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {existingInfluencer.ref_code}
                    </code>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleAddInfluencer}
                  disabled={addingInfluencer}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  {addingInfluencer ? '등록 중...' : '인플루언서로 등록'}
                </button>
              )}
            </div>
            {existingInfluencer?.status === 'approved' && (
              <p className="text-xs text-gray-400 mt-2">
                커미션 비율: {Math.round(existingInfluencer.commission_rate * 100)}% · 누적 수익: {formatPrice(existingInfluencer.total_earned)}
              </p>
            )}
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center bg-blue-50 rounded-md py-3">
              <p className="text-lg font-bold text-blue-700">{member.orderCount}</p>
              <p className="text-xs text-blue-600">주문</p>
            </div>
            <div className="text-center bg-green-50 rounded-md py-3">
              <p className="text-lg font-bold text-green-700">{formatPrice(member.totalSpent)}</p>
              <p className="text-xs text-green-600">누적 구매</p>
            </div>
            <div className="text-center bg-yellow-50 rounded-md py-3">
              <p className="text-lg font-bold text-yellow-700">{member.reviewCount}</p>
              <p className="text-xs text-yellow-600">리뷰</p>
            </div>
            <div className="text-center bg-purple-50 rounded-md py-3">
              <p className="text-lg font-bold text-purple-700">{formatPrice(mileageBalance)}</p>
              <p className="text-xs text-purple-600">마일리지</p>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex border-b border-gray-200">
            {([
              { key: 'orders' as TabKey, label: `주문 내역 (${memberOrders.length})` },
              { key: 'reviews' as TabKey, label: `리뷰 (${memberReviews.length})` },
              { key: 'coupons' as TabKey, label: `쿠폰 (${memberUserCoupons.length})` },
              { key: 'mileage' as TabKey, label: '마일리지' },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 주문 내역 탭 */}
          {tab === 'orders' && (
            <div>
              {memberOrders.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">주문 내역이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {memberOrders.slice(0, 20).map((order) => {
                    const status = STATUS_MAP[order.status] ?? {
                      label: order.status,
                      color: 'bg-gray-100 text-gray-700',
                    }
                    return (
                      <div key={order.id} className="border border-gray-100 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[11px] text-gray-400">
                            {order.order_id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{order.order_name}</p>
                        <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500">
                          <span>{formatDateTime(order.created_at)}</span>
                          <span className="font-medium text-gray-900">{formatPrice(order.amount)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 리뷰 탭 */}
          {tab === 'reviews' && (
            <div>
              {memberReviews.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">작성한 리뷰가 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {memberReviews.map((review) => (
                    <div key={review.id} className="border border-gray-100 rounded-md p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 쿠폰 탭 */}
          {tab === 'coupons' && (
            <div>
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setShowCouponIssue(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition-colors"
                >
                  <Gift className="w-3.5 h-3.5" />
                  쿠폰 지급
                </button>
              </div>
              {memberUserCoupons.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">보유한 쿠폰이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {memberUserCoupons.map((uc) => {
                    const coupon = coupons.find((c) => c.id === uc.coupon_id)
                    const statusInfo = COUPON_STATUS[uc.status] ?? { label: uc.status, color: 'bg-gray-100 text-gray-600' }
                    return (
                      <div key={uc.id} className="border border-gray-100 rounded-md p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{coupon?.name || uc.code}</p>
                          {coupon && (
                            <p className="text-xs text-green-600 mt-0.5">{formatDiscount(coupon)}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            수령: {new Date(uc.claimed_at).toLocaleDateString('ko-KR')}
                            {uc.used_at && ` · 사용: ${new Date(uc.used_at).toLocaleDateString('ko-KR')}`}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 마일리지 탭 */}
          {tab === 'mileage' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600">현재 잔액</span>
                  <span className="text-lg font-bold text-purple-700">{formatPrice(mileageBalance)}</span>
                </div>
                <button
                  onClick={() => setShowMileageAdjust(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition-colors"
                >
                  <Coins className="w-3.5 h-3.5" />
                  마일리지 조정
                </button>
              </div>
              {memberMileage.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">마일리지 내역이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {memberMileage.map((h) => {
                    const isEarn = h.type === 'earn' || (h.type === 'adjust' && h.amount > 0)
                    const typeLabel = h.type === 'earn' ? '적립' : h.type === 'spend' ? '사용' : '조정'
                    const typeColor = h.type === 'earn'
                      ? 'text-green-600 bg-green-50'
                      : h.type === 'spend'
                        ? 'text-red-600 bg-red-50'
                        : 'text-blue-600 bg-blue-50'
                    return (
                      <div key={h.id} className="border border-gray-100 rounded-md p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
                            {typeLabel}
                          </span>
                          <div>
                            <p className="text-sm">{h.description}</p>
                            <p className="text-[11px] text-gray-400">
                              {formatDateTime(h.created_at)}
                              {h.order_id && ` · ${h.order_id}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isEarn ? 'text-green-600' : 'text-red-500'}`}>
                            {isEarn ? '+' : ''}{formatPrice(h.amount)}
                          </p>
                          <p className="text-[11px] text-gray-400">잔액 {formatPrice(h.balance_after)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 쿠폰 지급 다이얼로그 */}
      {showCouponIssue && (
        <CouponIssueDialog
          memberId={memberId}
          coupons={coupons}
          userCoupons={userCoupons}
          onIssued={onCouponIssued}
          onClose={() => setShowCouponIssue(false)}
        />
      )}

      {/* 마일리지 조정 다이얼로그 */}
      {showMileageAdjust && (
        <MileageAdjustDialog
          memberId={memberId}
          currentBalance={mileageBalance}
          onAdjusted={onMileageAdjusted}
          onClose={() => setShowMileageAdjust(false)}
        />
      )}
    </div>
  )
}

function CouponIssueDialog({
  memberId,
  coupons,
  userCoupons,
  onIssued,
  onClose,
}: {
  memberId: string
  coupons: Coupon[]
  userCoupons: UserCoupon[]
  onIssued: (uc: UserCoupon, coupon: Coupon) => void
  onClose: () => void
}) {
  const [searchQ, setSearchQ] = useState('')
  const [issuing, setIssuing] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const now = new Date()
  const availableCoupons = coupons.filter((c) => {
    if (!c.is_active) return false
    if (now > new Date(c.expires_at)) return false
    if (now < new Date(c.starts_at)) return false
    if (c.total_quantity !== -1 && c.issued_count >= c.total_quantity) return false
    return true
  })

  const filtered = availableCoupons.filter((c) => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
  })

  const memberExistingCoupons = userCoupons
    .filter((uc) => uc.member_id === memberId && uc.status === 'available')
    .map((uc) => uc.coupon_id)

  const handleIssue = async (coupon: Coupon) => {
    setIssuing(coupon.id)
    try {
      const nowStr = new Date().toISOString()
      const result = await cb.database.createData(USER_COUPONS_TABLE_ID, {
        data: {
          coupon_id: coupon.id,
          member_id: memberId,
          code: coupon.code,
          status: 'available',
          claimed_at: nowStr,
        },
      })
      await cb.database.updateData(COUPONS_TABLE_ID, coupon.id, {
        data: { issued_count: coupon.issued_count + 1 },
      })

      const newUc: UserCoupon = {
        id: result.id,
        coupon_id: coupon.id,
        member_id: memberId,
        code: coupon.code,
        status: 'available',
        claimed_at: nowStr,
      }
      const updatedCoupon = { ...coupon, issued_count: coupon.issued_count + 1 }
      onIssued(newUc, updatedCoupon)
      setSuccessMsg(`"${coupon.name}" 쿠폰을 지급했습니다.`)
      setTimeout(() => setSuccessMsg(''), 2000)
    } catch {
      alert('쿠폰 지급에 실패했습니다.')
    }
    setIssuing(null)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[70vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold">쿠폰 지급</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">&times;</button>
        </div>

        <div className="px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="쿠폰 이름 또는 코드 검색..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {successMsg && (
          <div className="mx-5 mb-2 px-3 py-2 bg-green-50 text-green-700 text-xs rounded">
            {successMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">지급 가능한 쿠폰이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((coupon) => {
                const alreadyHas = memberExistingCoupons.includes(coupon.id)
                return (
                  <div key={coupon.id} className="border border-gray-100 rounded-md p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{coupon.name}</p>
                      <p className="text-xs text-green-600">{formatDiscount(coupon)}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        코드: {coupon.code} · 발급 {coupon.issued_count}/{coupon.total_quantity === -1 ? '∞' : coupon.total_quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => handleIssue(coupon)}
                      disabled={issuing === coupon.id}
                      className={`px-3 py-1.5 text-xs rounded transition-colors ${
                        alreadyHas
                          ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      } disabled:opacity-50`}
                    >
                      {issuing === coupon.id ? '지급 중...' : alreadyHas ? '재지급' : '지급'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MileageAdjustDialog({
  memberId,
  currentBalance,
  onAdjusted,
  onClose,
}: {
  memberId: string
  currentBalance: number
  onAdjusted: (history: MileageHistory) => void
  onClose: () => void
}) {
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const numAmount = Number(amount) || 0
  const newBalance = adjustType === 'add' ? currentBalance + numAmount : currentBalance - numAmount
  const isValid = numAmount > 0 && newBalance >= 0

  const handleSubmit = async () => {
    if (!isValid) return
    setSaving(true)
    try {
      const adjustAmount = adjustType === 'add' ? numAmount : -numAmount
      const nowStr = new Date().toISOString()
      const result = await cb.database.createData(MILEAGE_HISTORY_TABLE_ID, {
        data: {
          member_id: memberId,
          type: 'adjust',
          amount: adjustAmount,
          balance_after: newBalance,
          description: reason || (adjustType === 'add' ? '관리자 지급' : '관리자 차감'),
          order_id: '',
          created_at: nowStr,
        },
      })
      const newHistory: MileageHistory = {
        id: result.id,
        member_id: memberId,
        type: 'adjust',
        amount: adjustAmount,
        balance_after: newBalance,
        description: reason || (adjustType === 'add' ? '관리자 지급' : '관리자 차감'),
        order_id: '',
        created_at: nowStr,
      }
      onAdjusted(newHistory)
      onClose()
    } catch {
      alert('마일리지 조정에 실패했습니다.')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold">마일리지 조정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg">&times;</button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="text-center bg-purple-50 rounded-md py-3">
            <p className="text-xs text-purple-600 mb-0.5">현재 잔액</p>
            <p className="text-lg font-bold text-purple-700">{formatPrice(currentBalance)}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setAdjustType('add')}
              className={`flex-1 py-2 text-sm rounded border transition-colors ${
                adjustType === 'add'
                  ? 'bg-green-50 border-green-300 text-green-700 font-medium'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" />
              지급
            </button>
            <button
              onClick={() => setAdjustType('subtract')}
              className={`flex-1 py-2 text-sm rounded border transition-colors ${
                adjustType === 'subtract'
                  ? 'bg-red-50 border-red-300 text-red-700 font-medium'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Minus className="w-3.5 h-3.5 inline mr-1" />
              차감
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">금액 (원)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">사유 (선택)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={adjustType === 'add' ? '예: 이벤트 지급' : '예: 오적립 차감'}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-gray-400"
            />
          </div>

          {numAmount > 0 && (
            <div className="text-center text-sm">
              <span className="text-gray-500">변경 후 잔액: </span>
              <span className={`font-bold ${newBalance < 0 ? 'text-red-500' : 'text-purple-700'}`}>
                {formatPrice(newBalance)}
              </span>
              {newBalance < 0 && (
                <p className="text-xs text-red-500 mt-1">잔액이 부족합니다.</p>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isValid || saving}
            className="w-full py-2.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {saving ? '처리 중...' : '조정 적용'}
          </button>
        </div>
      </div>
    </div>
  )
}
