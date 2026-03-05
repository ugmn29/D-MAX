/**
 * TC-SA001〜SA018: POST /api/staff
 * TC-SG001〜SG006: GET  /api/staff
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── モック定義（vi.hoisted で vi.mock ファクトリより先に評価） ────

const mockAdminAuth = vi.hoisted(() => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  setCustomUserClaims: vi.fn(),
  generatePasswordResetLink: vi.fn(),
}))

vi.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdmin: vi.fn(() => ({ app: {}, adminAuth: mockAdminAuth })),
}))

const mockVerifyAdmin = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth/verify-request', () => ({
  verifyAdmin: mockVerifyAdmin,
  verifyAuth: vi.fn(),
}))

const mockPrisma = vi.hoisted(() => ({
  staff: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  clinics: {
    findUnique: vi.fn(),
  },
}))

vi.mock('@/lib/prisma-client', () => ({
  prisma: mockPrisma,
  getPrismaClient: vi.fn(() => mockPrisma),
}))

// @/lib/prisma/client は @/lib/prisma-client の再エクスポートだが念のため同一オブジェクトで差し替え
vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
  getPrismaClient: vi.fn(() => mockPrisma),
}))

const mockSendStaffWelcomeEmail = vi.hoisted(() => vi.fn())
vi.mock('@/lib/api/send-staff-welcome-email', () => ({
  sendStaffWelcomeEmail: mockSendStaffWelcomeEmail,
}))

// ── テスト本体 ────────────────────────────────────────────────────

import { POST, GET } from '@/app/api/staff/route'

// ── 共通フィクスチャ ──────────────────────────────────────────────

const CLINIC_ID = 'clinic-uuid-123'
const STAFF_ID = 'staff-admin-uuid'

const adminUser = {
  uid: 'admin-uid',
  email: 'admin@test.com',
  clinicId: CLINIC_ID,
  role: 'admin' as const,
  staffId: STAFF_ID,
}

const now = new Date('2024-03-15T10:00:00.000Z')

function makeStaffRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'new-staff-uuid',
    clinic_id: CLINIC_ID,
    name: '山田花子',
    name_kana: null,
    email: 'hanako@test.com',
    phone: null,
    position_id: null,
    role: 'staff',
    is_active: true,
    created_at: now,
    updated_at: now,
    staff_positions: null,
    ...overrides,
  }
}

function makePostRequest(body: Record<string, unknown>, cookie = '__session=admin-token') {
  return new NextRequest('http://localhost/api/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/staff')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

// ════════════════════════════════════════════════════════════════════
// POST /api/staff
// ════════════════════════════════════════════════════════════════════

describe('POST /api/staff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyAdmin.mockResolvedValue(adminUser)
    mockAdminAuth.createUser.mockResolvedValue({ uid: 'firebase-uid-xyz' })
    mockAdminAuth.deleteUser.mockResolvedValue(undefined)
    mockAdminAuth.setCustomUserClaims.mockResolvedValue(undefined)
    mockAdminAuth.generatePasswordResetLink.mockResolvedValue(
      'https://reset.example.com/link'
    )
    mockPrisma.staff.create.mockResolvedValue(makeStaffRecord())
    mockPrisma.clinics.findUnique.mockResolvedValue({ name: 'テストクリニック' })
    mockSendStaffWelcomeEmail.mockResolvedValue(true)
  })

  it('TC-SA001: 管理者が必須項目のみでスタッフ作成 → 200 + role:staff', async () => {
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('山田花子')
    expect(data.role).toBe('staff')
    expect(data.clinic_id).toBe(CLINIC_ID)
  })

  it('TC-SA002: 全項目指定でスタッフ作成 → 200 + 全フィールド返却', async () => {
    mockPrisma.staff.create.mockResolvedValue(
      makeStaffRecord({
        name_kana: 'ヤマダハナコ',
        phone: '090-1234-5678',
        role: 'admin',
      })
    )
    const req = makePostRequest({
      name: '山田花子',
      name_kana: 'ヤマダハナコ',
      email: 'hanako@test.com',
      phone: '090-1234-5678',
      role: 'admin',
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name_kana).toBe('ヤマダハナコ')
    expect(data.phone).toBe('090-1234-5678')
  })

  it('TC-SA003: adminロールでスタッフ作成 → 200 + role:admin', async () => {
    mockPrisma.staff.create.mockResolvedValue(makeStaffRecord({ role: 'admin' }))
    const req = makePostRequest({ name: '山田太郎', email: 'taro@test.com', role: 'admin' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.role).toBe('admin')
  })

  it('TC-SA004: passwordSetupLinkがレスポンスに含まれる', async () => {
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(typeof data.passwordSetupLink).toBe('string')
    expect(data.passwordSetupLink).toContain('reset.example.com')
  })

  it('TC-SA005: 認証なし → 401 + "認証トークンがありません"', async () => {
    mockVerifyAdmin.mockRejectedValue(new Error('認証トークンがありません'))
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' }, '')

    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('認証トークンがありません')
  })

  it('TC-SA006: staffロール → 403 + "管理者権限が必要です"', async () => {
    mockVerifyAdmin.mockRejectedValue(new Error('管理者権限が必要です'))
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })

    const res = await POST(req)
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('管理者権限が必要です')
  })

  it('TC-SA007: name未指定 → 400 + "名前とメールアドレスは必須です"', async () => {
    const req = makePostRequest({ email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('名前とメールアドレスは必須です')
  })

  it('TC-SA008: email未指定 → 400 + "名前とメールアドレスは必須です"', async () => {
    const req = makePostRequest({ name: '山田花子' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('名前とメールアドレスは必須です')
  })

  it('TC-SA009: Firebase重複メール → 400 + "このメールアドレスは既に登録されています"', async () => {
    const duplicateError = new Error('Email already exists') as any
    duplicateError.code = 'auth/email-already-exists'
    mockAdminAuth.createUser.mockRejectedValue(duplicateError)

    const req = makePostRequest({ name: '山田花子', email: 'existing@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('このメールアドレスは既に登録されています')
  })

  it('TC-SA010: DB失敗時にFirebaseユーザーをロールバック削除 → 500 + deleteUser呼び出し', async () => {
    mockPrisma.staff.create.mockRejectedValue(new Error('DB constraint violation'))

    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(500)
    expect(mockAdminAuth.deleteUser).toHaveBeenCalledWith('firebase-uid-xyz')
  })

  it('TC-SA011: 無効なrole値 → 200 + role:staff（デフォルト扱い）', async () => {
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com', role: 'superadmin' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    // DBに保存されるroleは'staff'になる（staff/route.tsで正規化）
    expect(mockPrisma.staff.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'staff' }) })
    )
  })

  it('TC-SA012: position_idなしで作成できる → 200', async () => {
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.position).toBeUndefined()
  })

  it('TC-SA013: generatePasswordResetLink失敗 → スタッフ作成は成功 + passwordSetupLink:null', async () => {
    mockAdminAuth.generatePasswordResetLink.mockRejectedValue(new Error('Email not found'))

    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.passwordSetupLink).toBeNull()
  })

  it('TC-SA014: setCustomUserClaims失敗 → outer catch → 500', async () => {
    mockAdminAuth.setCustomUserClaims.mockRejectedValue(new Error('Claims error'))

    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('スタッフの作成に失敗しました')
  })

  it('TC-SA015: Firebase createUserの汎用エラー → 400 + e.message', async () => {
    const genericError = new Error('Too many requests') as any
    genericError.code = 'auth/too-many-requests'
    mockAdminAuth.createUser.mockRejectedValue(genericError)

    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Too many requests')
  })

  it('TC-SA016: 不正なJSONボディ → 500', async () => {
    const req = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: '__session=admin-token' },
      body: 'invalid-json-string',
    })
    const res = await POST(req)

    expect(res.status).toBe(500)
  })

  it('TC-SA017: ロールバック時にdeleteUserも失敗 → outer catch → 500', async () => {
    mockPrisma.staff.create.mockRejectedValue(new Error('DB error'))
    mockAdminAuth.deleteUser.mockRejectedValue(new Error('Firebase delete failed'))

    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(500)
  })

  it('TC-SA018: DBがrole:nullを返す → レスポンスのroleは"staff"デフォルト', async () => {
    mockPrisma.staff.create.mockResolvedValue(makeStaffRecord({ role: null }))

    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.role).toBe('staff')
  })

  it('TC-SA019: メール送信成功 → レスポンスにemailSent:true', async () => {
    mockSendStaffWelcomeEmail.mockResolvedValue(true)
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.emailSent).toBe(true)
  })

  it('TC-SA020: メール送信失敗（sendStaffWelcomeEmailがfalse）でも200 + emailSent:false', async () => {
    mockSendStaffWelcomeEmail.mockResolvedValue(false)
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.emailSent).toBe(false)
    expect(data.passwordSetupLink).toBeTruthy()
  })

  it('TC-SA021: クリニック取得失敗（findUniqueがnull）→ メール未送信でも200', async () => {
    mockPrisma.clinics.findUnique.mockResolvedValue(null)
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.emailSent).toBe(false)
    expect(mockSendStaffWelcomeEmail).not.toHaveBeenCalled()
  })

  it('TC-SA022: sendStaffWelcomeEmailに正しいパラメータが渡される', async () => {
    const req = makePostRequest({ name: '山田花子', email: 'hanako@test.com' })
    await POST(req)

    expect(mockSendStaffWelcomeEmail).toHaveBeenCalledWith({
      email: 'hanako@test.com',
      name: '山田花子',
      clinicName: 'テストクリニック',
      passwordSetupLink: 'https://reset.example.com/link',
    })
  })
})

// ════════════════════════════════════════════════════════════════════
// GET /api/staff
// ════════════════════════════════════════════════════════════════════

describe('GET /api/staff', () => {
  const activeStaff = makeStaffRecord({ id: 'staff-1', name: '青木一郎', is_active: true })
  const inactiveStaff = makeStaffRecord({ id: 'staff-2', name: '石田二郎', is_active: false })

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.staff.findMany.mockResolvedValue([activeStaff])
  })

  it('TC-SG001: clinic_idでスタッフ一覧取得 → 200 + 配列', async () => {
    const req = makeGetRequest({ clinic_id: CLINIC_ID })
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(mockPrisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clinic_id: CLINIC_ID, is_active: true } })
    )
  })

  it('TC-SG002: スタッフ0件 → 200 + 空配列', async () => {
    mockPrisma.staff.findMany.mockResolvedValue([])
    const req = makeGetRequest({ clinic_id: CLINIC_ID })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('TC-SG003: clinic_idなし → 400 + "clinic_id is required"', async () => {
    const req = makeGetRequest()
    const res = await GET(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('clinic_id is required')
  })

  it('TC-SG004: デフォルトでアクティブのみ取得（非アクティブ含まず）', async () => {
    mockPrisma.staff.findMany.mockResolvedValue([activeStaff])
    const req = makeGetRequest({ clinic_id: CLINIC_ID })
    await GET(req)

    expect(mockPrisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ is_active: true }) })
    )
  })

  it('TC-SG005: active_only=falseで全件取得（非アクティブ含む）', async () => {
    mockPrisma.staff.findMany.mockResolvedValue([activeStaff, inactiveStaff])
    const req = makeGetRequest({ clinic_id: CLINIC_ID, active_only: 'false' })
    const res = await GET(req)

    expect(res.status).toBe(200)
    // is_activeによるフィルタなし
    expect(mockPrisma.staff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clinic_id: CLINIC_ID } })
    )
  })

  it('TC-SG006: Prismaクエリ失敗 → 500 + "Internal server error"', async () => {
    mockPrisma.staff.findMany.mockRejectedValue(new Error('DB connection lost'))
    const req = makeGetRequest({ clinic_id: CLINIC_ID })
    const res = await GET(req)

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Internal server error')
  })
})
