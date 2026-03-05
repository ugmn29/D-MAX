/**
 * TC-ASA001〜ASA011: POST /api/admin/clinics/[id]/staff
 * TC-ASG001〜ASG003: GET  /api/admin/clinics/[id]/staff
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── モック定義 ─────────────────────────────────────────────────────

const mockAdminAuth = vi.hoisted(() => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  setCustomUserClaims: vi.fn(),
  generatePasswordResetLink: vi.fn(),
}))

vi.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdmin: vi.fn(() => ({ app: {}, adminAuth: mockAdminAuth })),
}))

const mockPrisma = vi.hoisted(() => ({
  clinics: { findUnique: vi.fn() },
  staff: { create: vi.fn(), findMany: vi.fn() },
}))

vi.mock('@/lib/prisma-client', () => ({
  prisma: mockPrisma,
  getPrismaClient: vi.fn(() => mockPrisma),
}))

const mockSendStaffWelcomeEmail = vi.hoisted(() => vi.fn())
vi.mock('@/lib/api/send-staff-welcome-email', () => ({
  sendStaffWelcomeEmail: mockSendStaffWelcomeEmail,
}))

// ── テスト本体 ─────────────────────────────────────────────────────

import { POST, GET } from '@/app/api/admin/clinics/[id]/staff/route'

// ── 共通フィクスチャ ──────────────────────────────────────────────

const CLINIC_ID = 'clinic-uuid-admin-test'
const SESSION_SECRET = 'test-admin-session-secret'

function makePostRequest(body: Record<string, unknown>, withAuth = true) {
  return new NextRequest(`http://localhost/api/admin/clinics/${CLINIC_ID}/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(withAuth ? { Cookie: `__admin_session=${SESSION_SECRET}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(withAuth = true) {
  return new NextRequest(`http://localhost/api/admin/clinics/${CLINIC_ID}/staff`, {
    headers: withAuth ? { Cookie: `__admin_session=${SESSION_SECRET}` } : {},
  })
}

const mockParams = { params: Promise.resolve({ id: CLINIC_ID }) }

const now = new Date('2024-03-15T10:00:00.000Z')

function makeStaffRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'new-staff-uuid',
    clinic_id: CLINIC_ID,
    name: '院長太郎',
    email: 'owner@clinic.com',
    role: 'admin',
    is_active: true,
    created_at: now,
    ...overrides,
  }
}

// ════════════════════════════════════════════════════════════════════
// POST /api/admin/clinics/[id]/staff
// ════════════════════════════════════════════════════════════════════

describe('POST /api/admin/clinics/[id]/staff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ADMIN_SESSION_SECRET', SESSION_SECRET)
    mockPrisma.clinics.findUnique.mockResolvedValue({ id: CLINIC_ID, name: 'テスト歯科' })
    mockAdminAuth.createUser.mockResolvedValue({ uid: 'firebase-uid-abc' })
    mockAdminAuth.deleteUser.mockResolvedValue(undefined)
    mockAdminAuth.setCustomUserClaims.mockResolvedValue(undefined)
    mockAdminAuth.generatePasswordResetLink.mockResolvedValue('https://reset.example.com/link')
    mockPrisma.staff.create.mockResolvedValue(makeStaffRecord())
    mockSendStaffWelcomeEmail.mockResolvedValue(true)
  })

  it('TC-ASA001: 正常作成（デフォルトadminロール）→ 200 + ok:true + emailSent:true', async () => {
    const req = makePostRequest({ name: '院長太郎', email: 'owner@clinic.com' })
    const res = await POST(req, mockParams)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.staff.name).toBe('院長太郎')
    expect(data.staff.role).toBe('admin')
    expect(data.emailSent).toBe(true)
    expect(typeof data.passwordSetupLink).toBe('string')
  })

  it('TC-ASA002: staffロール指定 → 200 + role:staff', async () => {
    mockPrisma.staff.create.mockResolvedValue(makeStaffRecord({ role: 'staff' }))
    const req = makePostRequest({ name: '受付スタッフ', email: 'staff@clinic.com', role: 'staff' })
    const res = await POST(req, mockParams)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.staff.role).toBe('staff')
  })

  it('TC-ASA003: 認証なし（Cookieなし）→ 401', async () => {
    const req = makePostRequest({ name: '院長太郎', email: 'owner@clinic.com' }, false)
    const res = await POST(req, mockParams)

    expect(res.status).toBe(401)
  })

  it('TC-ASA004: クリニックが存在しない → 404', async () => {
    mockPrisma.clinics.findUnique.mockResolvedValue(null)
    const req = makePostRequest({ name: '院長太郎', email: 'owner@clinic.com' })
    const res = await POST(req, mockParams)

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('クリニックが見つかりません')
  })

  it('TC-ASA005: 名前なし → 400', async () => {
    const req = makePostRequest({ email: 'owner@clinic.com' })
    const res = await POST(req, mockParams)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('名前・メールアドレスは必須です')
  })

  it('TC-ASA006: メールアドレスなし → 400', async () => {
    const req = makePostRequest({ name: '院長太郎' })
    const res = await POST(req, mockParams)

    expect(res.status).toBe(400)
  })

  it('TC-ASA007: Firebaseのメール重複エラー → 400 + 日本語メッセージ', async () => {
    const err = new Error('email already in use') as any
    err.code = 'auth/email-already-exists'
    mockAdminAuth.createUser.mockRejectedValue(err)

    const req = makePostRequest({ name: '院長太郎', email: 'existing@clinic.com' })
    const res = await POST(req, mockParams)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('このメールアドレスはすでに登録されています')
  })

  it('TC-ASA008: DB作成失敗 → Firebaseユーザーをロールバック → 500', async () => {
    mockPrisma.staff.create.mockRejectedValue(new Error('DB constraint'))

    const req = makePostRequest({ name: '院長太郎', email: 'owner@clinic.com' })
    const res = await POST(req, mockParams)

    expect(res.status).toBe(500)
    expect(mockAdminAuth.deleteUser).toHaveBeenCalledWith('firebase-uid-abc')
  })

  it('TC-ASA009: メール送信失敗（sendStaffWelcomeEmailがfalse）でも200 + emailSent:false', async () => {
    mockSendStaffWelcomeEmail.mockResolvedValue(false)
    const req = makePostRequest({ name: '院長太郎', email: 'owner@clinic.com' })
    const res = await POST(req, mockParams)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.emailSent).toBe(false)
    expect(data.passwordSetupLink).toBeTruthy()
  })

  it('TC-ASA010: sendStaffWelcomeEmailに正しいパラメータが渡される', async () => {
    const req = makePostRequest({ name: '院長太郎', email: 'owner@clinic.com' })
    await POST(req, mockParams)

    expect(mockSendStaffWelcomeEmail).toHaveBeenCalledWith({
      email: 'owner@clinic.com',
      name: '院長太郎',
      clinicName: 'テスト歯科',
      passwordSetupLink: 'https://reset.example.com/link',
    })
  })
})

// ════════════════════════════════════════════════════════════════════
// GET /api/admin/clinics/[id]/staff
// ════════════════════════════════════════════════════════════════════

describe('GET /api/admin/clinics/[id]/staff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('ADMIN_SESSION_SECRET', SESSION_SECRET)
    mockPrisma.staff.findMany.mockResolvedValue([makeStaffRecord()])
  })

  it('TC-ASG001: スタッフ一覧取得 → 200 + 配列', async () => {
    const req = makeGetRequest()
    const res = await GET(req, mockParams)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('院長太郎')
  })

  it('TC-ASG002: 認証なし → 401', async () => {
    const req = makeGetRequest(false)
    const res = await GET(req, mockParams)

    expect(res.status).toBe(401)
  })

  it('TC-ASG003: Prismaエラー → 500', async () => {
    mockPrisma.staff.findMany.mockRejectedValue(new Error('DB error'))
    const req = makeGetRequest()
    const res = await GET(req, mockParams)

    expect(res.status).toBe(500)
  })
})
