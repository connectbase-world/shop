import { cb } from './connectbase'
import { MEMBERS_TABLE_ID } from './constants'
import { toMemberRows } from './utils'

const ADMIN_SESSION_KEY = 'admin_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24시간

type AdminSession = {
  authenticated: boolean
  memberId: string
  memberRowId: string
  nickname: string
  role: 'admin' | 'super_admin'
  loginAt: number
}

export function checkAdminSession(): boolean {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!raw) return false
    const session: AdminSession = JSON.parse(raw)
    if (!session.authenticated) return false
    if (Date.now() - session.loginAt > SESSION_DURATION) {
      localStorage.removeItem(ADMIN_SESSION_KEY)
      return false
    }
    return true
  } catch {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    return false
  }
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!raw) return null
    const session: AdminSession = JSON.parse(raw)
    if (!session.authenticated) return null
    if (Date.now() - session.loginAt > SESSION_DURATION) {
      localStorage.removeItem(ADMIN_SESSION_KEY)
      return null
    }
    return session
  } catch {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    return null
  }
}

export async function checkMemberRole(
  memberId: string,
  nickname: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await cb.database.getData(MEMBERS_TABLE_ID, { limit: 1000 })
    const rows = toMemberRows(result.data ?? [])
    const member = rows.find((r) => r.member_id === memberId)
    if (!member) {
      return { success: false, error: '등록된 회원이 아닙니다.' }
    }
    if (member.role !== 'admin' && member.role !== 'super_admin') {
      return { success: false, error: '관리자 권한이 없습니다.' }
    }

    const session: AdminSession = {
      authenticated: true,
      memberId: member.member_id,
      memberRowId: member.id,
      nickname: nickname || member.nickname,
      role: member.role,
      loginAt: Date.now(),
    }
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))

    cb.database.updateData(MEMBERS_TABLE_ID, member.id, {
      data: { last_login: new Date().toISOString() },
    })

    return { success: true }
  } catch {
    return { success: false, error: '인증에 실패했습니다.' }
  }
}

export function adminLogout(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY)
  cb.auth.signOut().catch(() => {})
  cb.clearTokens?.()
}
