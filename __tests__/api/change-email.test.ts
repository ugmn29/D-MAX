/**
 * TC-CE001〜CE006: POST /api/auth/change-email
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── モック定義 ─────────────────────────────────────────────────────

const mockAdminAuth = vi.hoisted(() => ({
  updateUser: vi.fn(),
}))

vi.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdmin: vi.fn(() => ({ app: {}, adminAuth: mockAdminAuth })),
}))

const mockVerifyAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth/verify-request', () => ({
  verifyAuth: mockVerifyAuth,
}))

const mockPrisma = vi.hoisted(() => ({
  staff: {
    updateMany: vi.fn(),
  },
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
}))

// ── テスト本体 ─────────────────────────────────────────────────────

import { POST } from '@/app/api/auth/change-email/route'

const STAFF_ID = 'staff-uuid-test'
const CLINIC_ID = 'clinic-uuid-test'
const OLD_EMAIL = 'old@clinic.com'
const NEW_EMAIL = 'new@clinic.com'

const authenticatedUser = {
  uid: 'firebase-uid-xyz',
  email: OLD_EMAIL,
  clinicId: CLINIC_ID,
  role: 'admin' as const,
  staffId: STAFF_ID,
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/auth/change-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: '__session=valid-token',
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/change-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyAuth.mockResolvedValue(authenticatedUser)
    mockAdminAuth.updateUser.mockResolvedValue(undefined)
    mockPrisma.staff.updateMany.mockResolvedValue({ count: 1 })
  })

  it('TC-CE001: 正常なメール変更 → Firebase Auth + DB更新 → 200', async () => {
    const req = makeRequest({ newEmail: NEW_EMAIL })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(mockAdminAuth.updateUser).toHaveBeenCalledWith('firebase-uid-xyz', { email: NEW_EMAIL })
    expect(mockPrisma.staff.updateMany).toHaveBeenCalledWith({
      where: { id: STAFF_ID },
      data: { email: NEW_EMAIL },
    })
  })

  it('TC-CE002: 認証なし（verifyAuth失敗） → 401', async () => {
    mockVerifyAuth.mockRejectedValue(new Error('認証トークンがありません'))

    const req = makeRequest({ newEmail: NEW_EMAIL })
    const res = await POST(req)

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('認証トークンがありません')
  })

  it('TC-CE003: 無効なメール形式 → 400', async () => {
    const req = makeRequest({ newEmail: 'not-an-email' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('有効なメールアドレス')
    expect(mockAdminAuth.updateUser).not.toHaveBeenCalled()
  })

  it('TC-CE004: newEmailが空 → 400', async () => {
    const req = makeRequest({ newEmail: '' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    expect(mockAdminAuth.updateUser).not.toHaveBeenCalled()
  })

  it('TC-CE005: 現在と同じメールアドレス → 400', async () => {
    const req = makeRequest({ newEmail: OLD_EMAIL })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('現在と同じ')
    expect(mockAdminAuth.updateUser).not.toHaveBeenCalled()
  })

  it('TC-CE006: Firebase auth/email-already-exists → 400 + エラーメッセージ', async () => {
    const error = Object.assign(new Error('Email already exists'), { code: 'auth/email-already-exists' })
    mockAdminAuth.updateUser.mockRejectedValue(error)

    const req = makeRequest({ newEmail: NEW_EMAIL })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('このメールアドレスはすでに使用されています')
  })
})
