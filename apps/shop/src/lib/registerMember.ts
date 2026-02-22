import { cb } from './connectbase'
import { MEMBERS_TABLE_ID, COUPONS_TABLE_ID, USER_COUPONS_TABLE_ID, MILEAGE_HISTORY_TABLE_ID } from './constants'
import { toCoupons } from './utils'

/**
 * 로그인 시 members 테이블에 회원 정보를 저장/업데이트한다.
 * 이미 존재하면 last_login만 갱신, 없으면 새로 생성.
 */
export async function registerMember(memberId: string, nickname: string, provider: string) {
  try {
    const result = await cb.database.getData(MEMBERS_TABLE_ID, { limit: 1000 })
    const rows = result.data ?? []
    const existing = rows.find(
      (r: { id: string; data: Record<string, unknown> }) => r.data.member_id === memberId,
    )

    const now = new Date().toISOString()

    if (existing) {
      await cb.database.updateData(MEMBERS_TABLE_ID, existing.id, {
        data: {
          nickname,
          provider,
          last_login: now,
        },
      })
    } else {
      await cb.database.createData(MEMBERS_TABLE_ID, {
        data: {
          member_id: memberId,
          nickname,
          provider,
          last_login: now,
          created_at: now,
        },
      })
      await issueAutoCoupons(memberId)
      await issueWelcomeMileage(memberId)
    }
  } catch {
    // 회원 등록 실패해도 로그인은 진행
  }
}

async function issueAutoCoupons(memberId: string) {
  try {
    const result = await cb.database.getData(COUPONS_TABLE_ID, { limit: 1000 })
    const coupons = toCoupons(result.data ?? [])
    const now = new Date()

    for (const coupon of coupons) {
      if (!coupon.is_auto_issue || !coupon.is_active) continue
      if (now > new Date(coupon.expires_at)) continue
      if (coupon.total_quantity !== -1 && coupon.issued_count >= coupon.total_quantity) continue

      await cb.database.createData(USER_COUPONS_TABLE_ID, {
        data: {
          coupon_id: coupon.id,
          member_id: memberId,
          code: coupon.code,
          status: 'available',
          claimed_at: now.toISOString(),
        },
      })
      await cb.database.updateData(COUPONS_TABLE_ID, coupon.id, {
        data: { issued_count: coupon.issued_count + 1 },
      })
    }
  } catch {
    // 쿠폰 발급 실패해도 로그인 진행
  }
}

const WELCOME_MILEAGE = 1000

async function issueWelcomeMileage(memberId: string) {
  try {
    await cb.database.createData(MILEAGE_HISTORY_TABLE_ID, {
      data: {
        member_id: memberId,
        type: 'earn',
        amount: WELCOME_MILEAGE,
        balance_after: WELCOME_MILEAGE,
        description: '신규 가입 축하 마일리지',
        order_id: '',
        created_at: new Date().toISOString(),
      },
    })
  } catch {
    // 마일리지 발급 실패해도 로그인 진행
  }
}
