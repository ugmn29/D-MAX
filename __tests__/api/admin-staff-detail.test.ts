/**
 * TC-ASD001〜ASD008: PUT/DELETE /api/admin/clinics/[id]/staff/[staffId]
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── モック定義 ─────────────────────────────────────────────────────

const mockAdminAuth = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
  setCustomUserClaims: vi.fn(),
  deleteUser: vi.fn(),
}))

vi.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdmin: vi.fn(() => ({ app: {}, adminAuth: mockAdminAuth })),
}))

const mockPrisma = vi.hoisted(() => ({
  staff: {
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/prisma-client', () => ({
  prisma: mockPrisma,
  getPrismaClient: vi.fn(() => mockPrisma),
}))

// ── テスト本体 ─────────────────────────────────────────────────────

import { PUT, DELETE } from '@/app/api/admin/clinics/[id]/staff/[staffId]/route'

// ── 共通フィクスチャ ──────────────────────────────────────────────

const CLINIC_ID = 'clinic-uuid-test'
const STAFF_ID = 'staff-uuid-test'
const SESSION_SECRET = 'test-admin-session-secret'

const mockParams = { params: Promise.resolve({ id: CLINIC_ID, staffId: STAFF_ID }) }

function makeRequest(method: string, body?: Record<string, unknown>, withAuth = true) {
  return new NextRequest(
    `http://localhost/api/admin/clinics/${CLINIC_ID}/staff/${STAFF_ID}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(withAuth ? { Cookie: `__admin_session=${SESSION_SECRET}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }
  )
}

const existingStaff = {
  id: STAFF_ID,
  clinic_id: CLINIC_ID,
  name: '山田太郎',
  email: 'taro@clinic.com',
  role: 'staff',
  is_active: true,
}

// ════════════════════════════════════════════════════════════════════
// PUT /api/admin/clinics/[id]/staff/[staffId]
// ════════════════════════════════════════════════════════════════════

describe('PUT /api/admin/clinics/[id]/staff/[staffId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ADMIN_SESSION_SECRET', SESSION_SECRET)
    mockPrisma.staff.findFirst.mockResolvedValue(existingStaff)
    mockPrisma.staff.update.mockResolvedValue({ ...existingStaff, name: '山田次郎' })
  })

  it('TC-ASD001: 正常更新 → 200 + staff情報返却', async () => {
    const req = makeRequest('PUT', { name: '山田次郎', email: 'taro@clinic.com', role: 'staff' })
    const res = await PUT(req, mockParams)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.staff.name).toBe('山田次郎')
  })

  it('TC-ASD002: roleがadminに変わった場合 → Firebase Custom Claims更新', async () => {
    mockAdminAuth.getUserByEmail.mockResolvedValue({ uid: 'firebase-uid-xyz' })
    mockAdminAuth.setCustomUserClaims.mockResolvedValue(undefined)
    mockPrisma.staff.update.mockResolvedValue({ ...existingStaff, role: 'admin' })

    const req = makeRequest('PUT', { name: '山田太郎', email: 'taro@clinic.com', role: 'admin' })
    const res = await PUT(req, mockParams)

    expect(res.status).toBe(200)
    expect(mockAdminAuth.getUserByEmail).toHaveBeenCalledWith('taro@clinic.com')
    expect(mockAdminAuth.setCustomUserClaims).toHaveBeenCalledWith('firebase-uid-xyz', {
      clinic_id: CLINIC_ID,
      staff_id: STAFF_ID,
      role: 'admin',
    })
  })

  it('TC-ASD003: roleが変わらない場合 → Firebase Custom Claims更新しない', async () => {
    // existing role = 'staff', new role = 'staff'
    const req = makeRequest('PUT', { name: '山田太郎', email: 'taro@clinic.com', role: 'staff' })
    await PUT(req, mockParams)

    expect(mockAdminAuth.setCustomUserClaims).not.toHaveBeenCalled()
  })

  it('TC-ASD004: 認証なし → 401', async () => {
    const req = makeRequest('PUT', { name: '山田太郎', email: 'taro@clinic.com', role: 'staff' }, false)
    const res = await PUT(req, mockParams)

    expect(res.status).toBe(401)
  })

  it('TC-ASD005: スタッフが存在しない → 404', async () => {
    mockPrisma.staff.findFirst.mockResolvedValue(null)
    const req = makeRequest('PUT', { name: '山田太郎', email: 'taro@clinic.com', role: 'staff' })
    const res = await PUT(req, mockParams)

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('スタッフが見つかりません')
  })

  it('TC-ASD006: 名前なし → 400', async () => {
    const req = makeRequest('PUT', { email: 'taro@clinic.com', role: 'staff' })
    const res = await PUT(req, mockParams)

    expect(res.status).toBe(400)
  })

  it('TC-ASD011: メールが変わった場合 → Firebase Auth updateUser呼ばれる → 200', async () => {
    const newEmail = 'new@clinic.com'
    mockAdminAuth.getUserByEmail.mockResolvedValue({ uid: 'firebase-uid-xyz' })
    mockAdminAuth.updateUser.mockResolvedValue(undefined)
    mockPrisma.staff.update.mockResolvedValue({ ...existingStaff, email: newEmail })

    const req = makeRequest('PUT', { name: '山田太郎', email: newEmail, role: 'staff' })
    const res = await PUT(req, mockParams)

    expect(res.status).toBe(200)
    expect(mockAdminAuth.getUserByEmail).toHaveBeenCalledWith('taro@clinic.com')
    expect(mockAdminAuth.updateUser).toHaveBeenCalledWith('firebase-uid-xyz', { email: newEmail })
    expect(mockAdminAuth.setCustomUserClaims).not.toHaveBeenCalled()
  })

  it('TC-ASD012: メール変更時にauth/email-already-exists → 400', async () => {
    const error = Object.assign(new Error('Email already in use'), { code: 'auth/email-already-exists' })
    mockAdminAuth.getUserByEmail.mockResolvedValue({ uid: 'firebase-uid-xyz' })
    mockAdminAuth.updateUser.mockRejectedValue(error)

    const req = makeRequest('PUT', { name: '山田太郎', email: 'taken@clinic.com', role: 'staff' })
    const res = await PUT(req, mockParams)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('このメールアドレスはすでに使用されています')
  })
})

// ════════════════════════════════════════════════════════════════════
// DELETE /api/admin/clinics/[id]/staff/[staffId]
// ════════════════════════════════════════════════════════════════════

describe('DELETE /api/admin/clinics/[id]/staff/[staffId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ADMIN_SESSION_SECRET', SESSION_SECRET)
    mockPrisma.staff.findFirst.mockResolvedValue(existingStaff)
    mockPrisma.staff.delete.mockResolvedValue(existingStaff)
    mockAdminAuth.getUserByEmail.mockResolvedValue({ uid: 'firebase-uid-xyz' })
    mockAdminAuth.deleteUser.mockResolvedValue(undefined)
  })

  it('TC-ASD007: 正常削除 → Firebase + DB両方削除 → 200', async () => {
    const req = makeRequest('DELETE')
    const res = await DELETE(req, mockParams)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(mockAdminAuth.deleteUser).toHaveBeenCalledWith('firebase-uid-xyz')
    expect(mockPrisma.staff.delete).toHaveBeenCalledWith({ where: { id: STAFF_ID } })
  })

  it('TC-ASD008: Firebase削除失敗してもDB削除は実行 → 200', async () => {
    mockAdminAuth.getUserByEmail.mockRejectedValue(new Error('Firebase error'))

    const req = makeRequest('DELETE')
    const res = await DELETE(req, mockParams)

    expect(res.status).toBe(200)
    expect(mockPrisma.staff.delete).toHaveBeenCalled()
  })

  it('TC-ASD009: 認証なし → 401', async () => {
    const req = makeRequest('DELETE', undefined, false)
    const res = await DELETE(req, mockParams)

    expect(res.status).toBe(401)
  })

  it('TC-ASD010: スタッフが存在しない → 404', async () => {
    mockPrisma.staff.findFirst.mockResolvedValue(null)
    const req = makeRequest('DELETE')
    const res = await DELETE(req, mockParams)

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('スタッフが見つかりません')
  })
})
