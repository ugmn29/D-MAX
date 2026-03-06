/**
 * TC-SD001〜SD005: PATCH /api/staff/[id]
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── モック定義 ─────────────────────────────────────────────────────

const mockAdminAuth = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdmin: vi.fn(() => ({ app: {}, adminAuth: mockAdminAuth })),
}))

const mockPrisma = vi.hoisted(() => ({
  staff: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/prisma/helpers', () => ({
  convertToDate: vi.fn((v: any) => (v instanceof Date ? v : new Date(v ?? Date.now()))),
}))

// ── テスト本体 ─────────────────────────────────────────────────────

import { PATCH } from '@/app/api/staff/[id]/route'

const CLINIC_ID = 'clinic-uuid-test'
const STAFF_ID = 'staff-uuid-test'
const OLD_EMAIL = 'old@clinic.com'

const mockParams = { params: Promise.resolve({ id: STAFF_ID }) }

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest(
    `http://localhost/api/staff/${STAFF_ID}?clinic_id=${CLINIC_ID}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
}

const now = new Date()
const existingStaff = {
  id: STAFF_ID,
  clinic_id: CLINIC_ID,
  email: OLD_EMAIL,
}

const updatedStaffBase = {
  id: STAFF_ID,
  clinic_id: CLINIC_ID,
  name: '山田太郎',
  name_kana: null,
  email: OLD_EMAIL,
  phone: null,
  position_id: null,
  role: 'staff',
  is_active: true,
  created_at: now,
  updated_at: now,
  staff_positions: null,
}

describe('PATCH /api/staff/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.staff.findFirst.mockResolvedValue(existingStaff)
    mockPrisma.staff.update.mockResolvedValue(updatedStaffBase)
    mockAdminAuth.getUserByEmail.mockResolvedValue({ uid: 'firebase-uid-xyz' })
    mockAdminAuth.updateUser.mockResolvedValue(undefined)
  })

  it('TC-SD001: 正常更新（メール変更なし） → Firebase updateUser呼ばれない → 200', async () => {
    const req = makeRequest({ name: '山田太郎', email: OLD_EMAIL })
    const res = await PATCH(req, mockParams)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe(STAFF_ID)
    expect(mockAdminAuth.updateUser).not.toHaveBeenCalled()
  })

  it('TC-SD002: メール変更あり → Firebase Auth updateUser呼ばれる → 200', async () => {
    const newEmail = 'new@clinic.com'
    mockPrisma.staff.update.mockResolvedValue({ ...updatedStaffBase, email: newEmail })

    const req = makeRequest({ name: '山田太郎', email: newEmail })
    const res = await PATCH(req, mockParams)

    expect(res.status).toBe(200)
    expect(mockAdminAuth.getUserByEmail).toHaveBeenCalledWith(OLD_EMAIL)
    expect(mockAdminAuth.updateUser).toHaveBeenCalledWith('firebase-uid-xyz', { email: newEmail })
  })

  it('TC-SD003: メール変更時にauth/email-already-exists → 400', async () => {
    const error = Object.assign(new Error('Email already in use'), { code: 'auth/email-already-exists' })
    mockAdminAuth.updateUser.mockRejectedValue(error)

    const req = makeRequest({ name: '山田太郎', email: 'taken@clinic.com' })
    const res = await PATCH(req, mockParams)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('このメールアドレスはすでに使用されています')
  })

  it('TC-SD004: clinic_idなし → 400', async () => {
    const req = new NextRequest(
      `http://localhost/api/staff/${STAFF_ID}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '山田太郎' }),
      }
    )
    const res = await PATCH(req, mockParams)

    expect(res.status).toBe(400)
  })

  it('TC-SD005: Firebase getUserByEmail失敗（重複以外）→ エラーログ出力してDBは正常返却', async () => {
    mockAdminAuth.getUserByEmail.mockRejectedValue(new Error('Firebase unavailable'))

    const req = makeRequest({ name: '山田太郎', email: 'new@clinic.com' })
    const res = await PATCH(req, mockParams)

    // Firebase失敗でもDB更新は成功しているので200を返す
    expect(res.status).toBe(200)
  })
})
