import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Search, X, Check, Ban, DollarSign, Eye } from 'lucide-react'
import { cb } from '@/lib/connectbase'
import { INFLUENCERS_TABLE_ID, COMMISSIONS_TABLE_ID, DEFAULT_COMMISSION_RATE } from '@/lib/constants'
import { toInfluencers, toCommissions, formatPrice, formatDateTime } from '@/lib/utils'
import type { Influencer, Commission } from '@/lib/types'

export const Route = createFileRoute('/influencers/')({
  loader: async () => {
    const [infRes, comRes] = await Promise.all([
      cb.database.getData(INFLUENCERS_TABLE_ID, { limit: 1000 }),
      cb.database.getData(COMMISSIONS_TABLE_ID, { limit: 1000 }),
    ])
    return {
      influencers: toInfluencers(infRes.data ?? []),
      commissions: toCommissions(comRes.data ?? []),
    }
  },
  component: InfluencersPage,
})

function generateRefCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'INF_'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function InfluencersPage() {
  const { influencers: initialInfluencers, commissions: initialCommissions } = Route.useLoaderData()
  const [influencers, setInfluencers] = useState(initialInfluencers)
  const [commissions, setCommissions] = useState(initialCommissions)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  // 통계
  const approved = influencers.filter((i) => i.status === 'approved').length
  const pending = influencers.filter((i) => i.status === 'pending').length
  const totalEarned = influencers.reduce((s, i) => s + i.total_earned, 0)
  const totalUnsettled = influencers.reduce((s, i) => s + (i.total_earned - i.total_settled), 0)

  const filtered = influencers
    .filter((i) => {
      if (search) {
        const q = search.toLowerCase()
        if (!i.nickname.toLowerCase().includes(q) && !i.ref_code.toLowerCase().includes(q) && !i.member_id.toLowerCase().includes(q)) return false
      }
      if (filter !== 'all' && i.status !== filter) return false
      return true
    })
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())

  const handleApprove = async (inf: Influencer) => {
    setProcessing(inf.id)
    try {
      const refCode = generateRefCode()
      await cb.database.updateData(INFLUENCERS_TABLE_ID, inf.id, {
        data: {
          status: 'approved',
          ref_code: refCode,
          commission_rate: DEFAULT_COMMISSION_RATE,
          approved_at: new Date().toISOString(),
        },
      })
      const updated = { ...inf, status: 'approved' as const, ref_code: refCode, commission_rate: DEFAULT_COMMISSION_RATE, approved_at: new Date().toISOString() }
      setInfluencers((prev) => prev.map((i) => (i.id === inf.id ? updated : i)))
      if (selectedInfluencer?.id === inf.id) setSelectedInfluencer(updated)
    } catch { /* ignore */ }
    setProcessing(null)
  }

  const handleReject = async (inf: Influencer, memo: string) => {
    setProcessing(inf.id)
    try {
      await cb.database.updateData(INFLUENCERS_TABLE_ID, inf.id, {
        data: { status: 'rejected', memo },
      })
      const updated = { ...inf, status: 'rejected' as const, memo }
      setInfluencers((prev) => prev.map((i) => (i.id === inf.id ? updated : i)))
      if (selectedInfluencer?.id === inf.id) setSelectedInfluencer(updated)
    } catch { /* ignore */ }
    setProcessing(null)
  }

  const handleSettle = async (inf: Influencer, commissionIds: string[]) => {
    setProcessing(inf.id)
    try {
      const pendingCommissions = commissions.filter((c) => commissionIds.includes(c.id))
      const settleAmount = pendingCommissions.reduce((s, c) => s + c.commission_amount, 0)

      for (const c of pendingCommissions) {
        await cb.database.updateData(COMMISSIONS_TABLE_ID, c.id, {
          data: { status: 'settled' },
        })
      }
      await cb.database.updateData(INFLUENCERS_TABLE_ID, inf.id, {
        data: { total_settled: inf.total_settled + settleAmount },
      })

      const updatedInf = { ...inf, total_settled: inf.total_settled + settleAmount }
      setInfluencers((prev) => prev.map((i) => (i.id === inf.id ? updatedInf : i)))
      setCommissions((prev) =>
        prev.map((c) => (commissionIds.includes(c.id) ? { ...c, status: 'settled' as const } : c)),
      )
      if (selectedInfluencer?.id === inf.id) setSelectedInfluencer(updatedInf)
    } catch { /* ignore */ }
    setProcessing(null)
  }

  const handleUpdateRate = async (inf: Influencer, rate: number) => {
    try {
      await cb.database.updateData(INFLUENCERS_TABLE_ID, inf.id, {
        data: { commission_rate: rate },
      })
      const updated = { ...inf, commission_rate: rate }
      setInfluencers((prev) => prev.map((i) => (i.id === inf.id ? updated : i)))
      if (selectedInfluencer?.id === inf.id) setSelectedInfluencer(updated)
    } catch { /* ignore */ }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { label: '대기', color: 'bg-amber-50 text-amber-700' }
      case 'approved': return { label: '승인', color: 'bg-green-50 text-green-700' }
      case 'rejected': return { label: '반려', color: 'bg-red-50 text-red-600' }
      default: return { label: status, color: 'bg-gray-100 text-gray-600' }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">인플루언서 관리</h1>
          <p className="text-sm text-gray-500 mt-1">인플루언서 신청 관리 및 커미션 현황</p>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '총 인플루언서', value: influencers.length },
          { label: '승인 활동중', value: approved },
          { label: '승인 대기', value: pending },
          { label: '미정산 금액', value: formatPrice(totalUnsettled) },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 검색 + 필터 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="닉네임, 추천코드 검색"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs rounded-md transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? '전체' : f === 'pending' ? '대기' : f === 'approved' ? '승인' : '반려'}
              {f === 'pending' && pending > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pending}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">인플루언서가 없습니다</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">닉네임</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">추천코드</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">상태</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">커미션율</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">누적 수익</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">미정산</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">신청일</th>
                <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inf) => {
                const badge = getStatusBadge(inf.status)
                const unsettled = inf.total_earned - inf.total_settled
                return (
                  <tr key={inf.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{inf.nickname || '-'}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{inf.member_id.slice(0, 12)}...</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{inf.ref_code || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{Math.round(inf.commission_rate * 100)}%</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatPrice(inf.total_earned)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {unsettled > 0 ? (
                        <span className="text-orange-600 font-medium">{formatPrice(unsettled)}</span>
                      ) : (
                        <span className="text-gray-400">0원</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{inf.applied_at ? formatDateTime(inf.applied_at) : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {inf.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(inf)}
                              disabled={processing === inf.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                              title="승인"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(inf, '')}
                              disabled={processing === inf.id}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="반려"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedInfluencer(inf)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedInfluencer && (
        <InfluencerDetailModal
          influencer={selectedInfluencer}
          commissions={commissions.filter((c) => c.influencer_id === selectedInfluencer.id)}
          processing={processing}
          onClose={() => setSelectedInfluencer(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onSettle={handleSettle}
          onUpdateRate={handleUpdateRate}
        />
      )}
    </div>
  )
}

// --- 상세 모달 ---

function InfluencerDetailModal({
  influencer,
  commissions,
  processing,
  onClose,
  onApprove,
  onReject,
  onSettle,
  onUpdateRate,
}: {
  influencer: Influencer
  commissions: Commission[]
  processing: string | null
  onClose: () => void
  onApprove: (inf: Influencer) => void
  onReject: (inf: Influencer, memo: string) => void
  onSettle: (inf: Influencer, commissionIds: string[]) => void
  onUpdateRate: (inf: Influencer, rate: number) => void
}) {
  const [rejectMemo, setRejectMemo] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rateInput, setRateInput] = useState(String(Math.round(influencer.commission_rate * 100)))

  const sorted = [...commissions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const pendingCommissions = sorted.filter((c) => c.status === 'pending')
  const unsettled = influencer.total_earned - influencer.total_settled

  const handleRateSave = () => {
    const rate = Number(rateInput) / 100
    if (rate > 0 && rate <= 1) {
      onUpdateRate(influencer, rate)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">{influencer.nickname || '인플루언서'}</h2>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
              influencer.status === 'approved' ? 'bg-green-50 text-green-700'
                : influencer.status === 'pending' ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-600'
            }`}>
              {influencer.status === 'approved' ? '승인' : influencer.status === 'pending' ? '대기' : '반려'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-400">회원 ID</p>
              <p className="text-sm font-mono">{influencer.member_id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">추천 코드</p>
              <p className="text-sm font-mono font-bold">{influencer.ref_code || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">신청일</p>
              <p className="text-sm">{influencer.applied_at ? formatDateTime(influencer.applied_at) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">승인일</p>
              <p className="text-sm">{influencer.approved_at ? formatDateTime(influencer.approved_at) : '-'}</p>
            </div>
          </div>

          {/* 승인/반려 액션 (pending일 때) */}
          {influencer.status === 'pending' && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium mb-3">승인 대기 중입니다</p>
              {!showRejectForm ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(influencer)}
                    disabled={processing === influencer.id}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    반려
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={rejectMemo}
                    onChange={(e) => setRejectMemo(e.target.value)}
                    placeholder="반려 사유 (선택사항)"
                    className="px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:border-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onReject(influencer, rejectMemo); setShowRejectForm(false) }}
                      disabled={processing === influencer.id}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      반려 확인
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="px-4 py-2 border border-gray-200 text-sm rounded hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 커미션 현황 (approved일 때) */}
          {influencer.status === 'approved' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{formatPrice(influencer.total_earned)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">총 수익</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-orange-700">{formatPrice(unsettled)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">미정산</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-green-700">{formatPrice(influencer.total_settled)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">정산 완료</p>
                </div>
              </div>

              {/* 커미션 비율 수정 */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-gray-600">커미션 비율:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    min={1}
                    max={100}
                    className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm text-center outline-none focus:border-gray-400"
                  />
                  <span className="text-sm">%</span>
                </div>
                {Number(rateInput) !== Math.round(influencer.commission_rate * 100) && (
                  <button
                    onClick={handleRateSave}
                    className="px-3 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors"
                  >
                    저장
                  </button>
                )}
              </div>

              {/* 일괄 정산 버튼 */}
              {pendingCommissions.length > 0 && (
                <button
                  onClick={() => onSettle(influencer, pendingCommissions.map((c) => c.id))}
                  disabled={processing === influencer.id}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors mb-6 disabled:opacity-50"
                >
                  <DollarSign className="w-4 h-4" />
                  미정산 전체 정산 ({formatPrice(unsettled)})
                </button>
              )}

              {/* 커미션 내역 */}
              <h3 className="text-sm font-bold mb-3">커미션 내역</h3>
              {sorted.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">커미션 내역이 없습니다</p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">날짜</th>
                        <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">경로</th>
                        <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">주문금액</th>
                        <th className="text-right text-xs font-medium text-gray-500 px-3 py-2">커미션</th>
                        <th className="text-center text-xs font-medium text-gray-500 px-3 py-2">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sorted.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs text-gray-500">{formatDateTime(c.created_at)}</td>
                          <td className="px-3 py-2 text-xs">
                            {c.source === 'ref_link' ? '추천 링크' : '쿠폰 연동'}
                          </td>
                          <td className="px-3 py-2 text-xs text-right">{formatPrice(c.order_amount)}</td>
                          <td className="px-3 py-2 text-xs text-right font-medium text-green-600">
                            +{formatPrice(c.commission_amount)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              c.status === 'settled' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {c.status === 'settled' ? '정산완료' : '대기'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* 메모 */}
          {influencer.memo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">메모</p>
              <p className="text-sm">{influencer.memo}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
