/**
 * TC-PG001〜PG005: GET  /api/patients
 * TC-PP001〜PP017: POST /api/patients
 * TC-PU001〜PU006: PUT  /api/patients
 * TC-PD001〜PD006: DELETE /api/patients
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── モック定義 ────────────────────────────────────────────────────

const mockVerifyAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth/verify-request', () => ({
  verifyAuth: mockVerifyAuth,
  verifyAdmin: vi.fn(),
}))

const mockPrisma = vi.hoisted(() => ({
  clinics: { findUnique: vi.fn() },
  patients: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/prisma-client', () => ({
  prisma: mockPrisma,
  getPrismaClient: vi.fn(() => mockPrisma),
}))

vi.mock('@/lib/audit-log', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}))

// ── テスト本体 ────────────────────────────────────────────────────

import { GET, POST, PUT, DELETE } from '@/app/api/patients/route'

// ── 共通フィクスチャ ──────────────────────────────────────────────

const CLINIC_A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
const CLINIC_B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
const PATIENT_UUID = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'

const staffUser = {
  uid: 'staff-uid',
  email: 'staff@clinic.com',
  clinicId: CLINIC_A,
  role: 'staff' as const,
  staffId: 'staff-uuid-456',
}

const now = new Date('2024-03-15T10:00:00.000Z')
const birthDate = new Date('1990-01-15')

function makePatient(overrides: Record<string, unknown> = {}) {
  return {
    id: PATIENT_UUID,
    clinic_id: CLINIC_A,
    patient_number: 1,
    last_name: '田中',
    first_name: '太郎',
    last_name_kana: null,
    first_name_kana: null,
    birth_date: birthDate,
    gender: 'male',
    phone: null,
    email: null,
    is_registered: true,
    password_hash: 'hashed_password_should_not_appear',
    created_at: now,
    updated_at: now,
    training_last_login_at: null,
    ...overrides,
  }
}

function makeGetRequest(cookie = 'Cookie: __session=valid-token') {
  return new NextRequest('http://localhost/api/patients', {
    headers: cookie ? { Cookie: '__session=valid-token' } : {},
  })
}

function makePostRequest(body: Record<string, unknown>, cookie?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cookie) headers['Cookie'] = cookie
  return new NextRequest('http://localhost/api/patients', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function makePutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/patients', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: '__session=valid-token' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest(id?: string) {
  const url = id
    ? `http://localhost/api/patients?id=${id}`
    : 'http://localhost/api/patients'
  return new NextRequest(url, {
    method: 'DELETE',
    headers: { Cookie: '__session=valid-token' },
  })
}

// ════════════════════════════════════════════════════════════════════
// GET /api/patients
// ════════════════════════════════════════════════════════════════════

describe('GET /api/patients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyAuth.mockResolvedValue(staffUser)
    mockPrisma.patients.findMany.mockResolvedValue([makePatient()])
  })

  it('TC-PG001: 認証済みスタッフが自クリニック患者一覧取得 → 200 + 配列', async () => {
    const res = await GET(makeGetRequest())

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(1)
    expect(data[0].last_name).toBe('田中')
  })

  it('TC-PG002: password_hashがレスポンスに含まれない', async () => {
    const res = await GET(makeGetRequest())
    const data = await res.json()

    data.forEach((patient: Record<string, unknown>) => {
      expect(patient).not.toHaveProperty('password_hash')
    })
  })

  it('TC-PG003: 認証なし → 401 + "認証が必要です"', async () => {
    mockVerifyAuth.mockRejectedValue(new Error('認証トークンがありません'))
    const req = new NextRequest('http://localhost/api/patients')
    const res = await GET(req)

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toBe('認証が必要です')
  })

  it('TC-PG004: 自クリニックの患者のみ取得（clinic_idがトークンから強制）', async () => {
    await GET(makeGetRequest())

    expect(mockPrisma.patients.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ clinic_id: CLINIC_A }),
      })
    )
  })

  it('TC-PG005: patient_number昇順で返される', async () => {
    mockPrisma.patients.findMany.mockResolvedValue([
      makePatient({ patient_number: 3 }),
      makePatient({ patient_number: 1 }),
      makePatient({ patient_number: 2 }),
    ])
    await GET(makeGetRequest())

    expect(mockPrisma.patients.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { patient_number: 'asc' } })
    )
  })
})

// ════════════════════════════════════════════════════════════════════
// POST /api/patients
// ════════════════════════════════════════════════════════════════════

describe('POST /api/patients', () => {
  const validBody = {
    clinic_id: CLINIC_A,
    last_name: '田中',
    first_name: '太郎',
    birth_date: '1990-01-15',
    gender: 'male',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyAuth.mockResolvedValue(staffUser)
    mockPrisma.clinics.findUnique.mockResolvedValue({ id: CLINIC_A, status: 'active' })
    mockPrisma.patients.findMany.mockResolvedValue([]) // 既存患者なし
    mockPrisma.patients.create.mockResolvedValue(makePatient())
  })

  it('TC-PP001: 非認証（Web予約）で患者作成可能 → 200', async () => {
    mockVerifyAuth.mockRejectedValue(new Error('認証トークンがありません'))
    const req = makePostRequest(validBody) // Cookieなし
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.last_name).toBe('田中')
  })

  it('TC-PP002: 認証済みスタッフが患者作成 → 200', async () => {
    const req = makePostRequest(validBody, '__session=valid-token')
    const res = await POST(req)

    expect(res.status).toBe(200)
  })

  it('TC-PP003: patient_number省略時の初回採番 → 1', async () => {
    mockPrisma.patients.findMany.mockResolvedValue([]) // 既存患者なし
    mockPrisma.patients.create.mockResolvedValue(makePatient({ patient_number: 1 }))

    const req = makePostRequest(validBody)
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockPrisma.patients.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ patient_number: 1 }) })
    )
  })

  it('TC-PP004: 欠番（1,3が存在）→ 2を採番', async () => {
    mockPrisma.patients.findMany.mockResolvedValue([
      { patient_number: 1 },
      { patient_number: 3 },
    ])
    mockPrisma.patients.create.mockResolvedValue(makePatient({ patient_number: 2 }))

    const req = makePostRequest(validBody)
    await POST(req)

    expect(mockPrisma.patients.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ patient_number: 2 }) })
    )
  })

  it('TC-PP005: 欠番なし（1,2,3が存在）→ 4を採番', async () => {
    mockPrisma.patients.findMany.mockResolvedValue([
      { patient_number: 1 },
      { patient_number: 2 },
      { patient_number: 3 },
    ])
    mockPrisma.patients.create.mockResolvedValue(makePatient({ patient_number: 4 }))

    const req = makePostRequest(validBody)
    await POST(req)

    expect(mockPrisma.patients.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ patient_number: 4 }) })
    )
  })

  it('TC-PP006: last_nameが空 → 400 + Zodエラー', async () => {
    const req = makePostRequest({ ...validBody, last_name: '' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('入力データが不正です')
    expect(data.details).toBeDefined()
  })

  it('TC-PP007: clinic_idがUUID形式でない → 400 + Zodエラー', async () => {
    const req = makePostRequest({ ...validBody, clinic_id: 'not-a-uuid' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('入力データが不正です')
  })

  it('TC-PP008: 存在しないclinic_id → 400 + "指定されたクリニックが見つかりません"', async () => {
    mockPrisma.clinics.findUnique.mockResolvedValue(null)
    const req = makePostRequest(validBody)
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('指定されたクリニックが見つかりません')
  })

  it('TC-PP009: 他クリニックのclinic_idを指定 → 403 + "このクリニックへのアクセス権限がありません"', async () => {
    mockPrisma.clinics.findUnique.mockResolvedValue({ id: CLINIC_B, status: 'active' })
    // スタッフはclinic-A、ボディのclinic_idはclinic-B
    const req = makePostRequest({ ...validBody, clinic_id: CLINIC_B }, '__session=valid-token')
    const res = await POST(req)

    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('このクリニックへのアクセス権限がありません')
  })

  it('TC-PP010: password_hashがレスポンスに含まれない', async () => {
    const req = makePostRequest(validBody)
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).not.toHaveProperty('password_hash')
  })

  it('TC-PP011: 無効なメール形式 → 400 + Zodエラー', async () => {
    const req = makePostRequest({ ...validBody, email: 'not-an-email' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('入力データが不正です')
  })

  it('TC-PP012: 無効なgender値 → 400 + Zodエラー', async () => {
    const req = makePostRequest({ ...validBody, gender: 'unknown' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('入力データが不正です')
  })

  it('TC-PP013: last_name 50文字（最大値）→ 200', async () => {
    const req = makePostRequest({ ...validBody, last_name: 'あ'.repeat(50) })
    const res = await POST(req)

    expect(res.status).toBe(200)
  })

  it('TC-PP014: last_name 51文字（超過）→ 400 + Zodエラー', async () => {
    const req = makePostRequest({ ...validBody, last_name: 'あ'.repeat(51) })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('TC-PP015: birth_dateが不正形式 → 400 + Zodエラー', async () => {
    const req = makePostRequest({ ...validBody, birth_date: '1990/01/01' })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('TC-PP016: first_name省略時は空文字でDBに保存', async () => {
    const { first_name: _fn, ...bodyWithoutFirstName } = validBody
    const req = makePostRequest(bodyWithoutFirstName)
    await POST(req)

    expect(mockPrisma.patients.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ first_name: '' }) })
    )
  })

  it('TC-PP017: 不正なJSONボディ → 500', async () => {
    const req = new NextRequest('http://localhost/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    })
    const res = await POST(req)

    expect(res.status).toBe(500)
  })
})

// ════════════════════════════════════════════════════════════════════
// PUT /api/patients
// ════════════════════════════════════════════════════════════════════

describe('PUT /api/patients', () => {
  const updateBody = {
    id: PATIENT_UUID,
    last_name: '鈴木',
    first_name: '一郎',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyAuth.mockResolvedValue(staffUser)
    mockPrisma.patients.findFirst.mockResolvedValue(makePatient())
    mockPrisma.patients.update.mockResolvedValue(
      makePatient({ last_name: '鈴木', first_name: '一郎' })
    )
  })

  it('TC-PU001: 患者情報を正常更新 → 200 + 更新後オブジェクト', async () => {
    const req = makePutRequest(updateBody)
    const res = await PUT(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.last_name).toBe('鈴木')
  })

  it('TC-PU002: PUTレスポンスにpassword_hashが含まれない', async () => {
    const req = makePutRequest(updateBody)
    const res = await PUT(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).not.toHaveProperty('password_hash')
  })

  it('TC-PU003: 認証なし → 401', async () => {
    mockVerifyAuth.mockRejectedValue(new Error('認証トークンがありません'))
    const req = new NextRequest('http://localhost/api/patients', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBody),
    })
    const res = await PUT(req)

    expect(res.status).toBe(401)
  })

  it('TC-PU004: id省略 → 400 + "id is required"', async () => {
    const { id: _id, ...bodyWithoutId } = updateBody
    const req = makePutRequest(bodyWithoutId)
    const res = await PUT(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('id is required')
  })

  it('TC-PU005: 存在しない患者ID → 404 + "Patient not found"', async () => {
    mockPrisma.patients.findFirst.mockResolvedValue(null)
    const req = makePutRequest({ ...updateBody, id: 'non-existent-uuid' })
    const res = await PUT(req)

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Patient not found')
  })

  it('TC-PU006: 他クリニックの患者を更新 → 403', async () => {
    mockPrisma.patients.findFirst.mockResolvedValue(
      makePatient({ clinic_id: CLINIC_B }) // 別クリニック
    )
    const req = makePutRequest(updateBody)
    const res = await PUT(req)

    expect(res.status).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════════════
// DELETE /api/patients
// ════════════════════════════════════════════════════════════════════

describe('DELETE /api/patients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyAuth.mockResolvedValue(staffUser)
    mockPrisma.patients.findFirst.mockResolvedValue(makePatient())
    mockPrisma.patients.delete.mockResolvedValue(makePatient())
  })

  it('TC-PD001: 患者を正常削除 → 200 + {success:true}', async () => {
    const req = makeDeleteRequest(PATIENT_UUID)
    const res = await DELETE(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('TC-PD002: 認証なし → 401', async () => {
    mockVerifyAuth.mockRejectedValue(new Error('認証トークンがありません'))
    const req = new NextRequest(`http://localhost/api/patients?id=${PATIENT_UUID}`, {
      method: 'DELETE',
    })
    const res = await DELETE(req)

    expect(res.status).toBe(401)
  })

  it('TC-PD003: idなし → 400 + "id is required"', async () => {
    const req = makeDeleteRequest() // idなし
    const res = await DELETE(req)

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('id is required')
  })

  it('TC-PD004: 存在しない患者 → 404 + "Patient not found"', async () => {
    mockPrisma.patients.findFirst.mockResolvedValue(null)
    const req = makeDeleteRequest('non-existent-uuid')
    const res = await DELETE(req)

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe('Patient not found')
  })

  it('TC-PD005: 他クリニックの患者を削除 → 403', async () => {
    mockPrisma.patients.findFirst.mockResolvedValue(
      makePatient({ clinic_id: CLINIC_B })
    )
    const req = makeDeleteRequest(PATIENT_UUID)
    const res = await DELETE(req)

    expect(res.status).toBe(403)
  })

  it('TC-PD006: Prisma P2025以外のエラー → 500', async () => {
    const dbError = new Error('Constraint violation') as any
    dbError.code = 'P2003' // P2025ではない
    mockPrisma.patients.delete.mockRejectedValue(dbError)

    const req = makeDeleteRequest(PATIENT_UUID)
    const res = await DELETE(req)

    expect(res.status).toBe(500)
  })
})
