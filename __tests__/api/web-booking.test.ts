/**
 * Web予約関連APIのテスト
 *
 * TC-WBA001〜WBA005: GET  /api/web-booking/appointments
 * TC-WBC001〜WBC006: POST /api/web-booking/send-confirmation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── モック定義 ────────────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  appointments: {
    findMany: vi.fn(),
  },
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
  getPrismaClient: vi.fn(() => mockPrisma),
}))

vi.mock('@/lib/prisma-client', () => ({
  prisma: mockPrisma,
  getPrismaClient: vi.fn(() => mockPrisma),
}))

const mockResendSend = vi.hoisted(() => vi.fn())
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}))

// ── テスト本体 ────────────────────────────────────────────────────

import { GET } from '@/app/api/web-booking/appointments/route'
import { POST } from '@/app/api/web-booking/send-confirmation/route'

const CLINIC_ID = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'

// Date オブジェクトを返すヘルパー（Prisma の Time 型をエミュレート）
function makeTimeDate(hh: string, mm: string): Date {
  return new Date(`1970-01-01T${hh}:${mm}:00.000Z`)
}

function makeAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt-uuid-001',
    appointment_date: new Date('2026-03-10'),
    start_time: makeTimeDate('10', '00'),
    end_time: makeTimeDate('10', '30'),
    status: 'NOT_YET_ARRIVED' as const,
    staff1_id: 'staff-001',
    staff2_id: null,
    staff3_id: null,
    unit_id: 'unit-001',
    is_block: false,
    ...overrides,
  }
}

function makeReq(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(url, options)
}

// ─────────────────────────────────────────────────────────────────
// GET /api/web-booking/appointments
// ─────────────────────────────────────────────────────────────────

describe('GET /api/web-booking/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('TC-WBA001: clinic_id なし → 400', async () => {
    const req = makeReq('http://localhost/api/web-booking/appointments')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/clinic_id/)
  })

  it('TC-WBA002: 正常取得 → appointment_date が YYYY-MM-DD 形式', async () => {
    mockPrisma.appointments.findMany.mockResolvedValueOnce([makeAppointment()])
    const req = makeReq(
      `http://localhost/api/web-booking/appointments?clinic_id=${CLINIC_ID}`
    )
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].appointment_date).toBe('2026-03-10')
  })

  it('TC-WBA003: start_time・end_time が HH:MM 形式に変換される', async () => {
    mockPrisma.appointments.findMany.mockResolvedValueOnce([makeAppointment()])
    const req = makeReq(
      `http://localhost/api/web-booking/appointments?clinic_id=${CLINIC_ID}`
    )
    const res = await GET(req)
    const body = await res.json()
    expect(body[0].start_time).toBe('10:00')
    expect(body[0].end_time).toBe('10:30')
  })

  it('TC-WBA004: status が日本語に変換される（NOT_YET_ARRIVED → 未来院）', async () => {
    mockPrisma.appointments.findMany.mockResolvedValueOnce([makeAppointment()])
    const req = makeReq(
      `http://localhost/api/web-booking/appointments?clinic_id=${CLINIC_ID}`
    )
    const res = await GET(req)
    const body = await res.json()
    expect(body[0].status).toBe('未来院')
  })

  it('TC-WBA005: Prisma エラー → 500', async () => {
    mockPrisma.appointments.findMany.mockRejectedValueOnce(new Error('DB error'))
    const req = makeReq(
      `http://localhost/api/web-booking/appointments?clinic_id=${CLINIC_ID}`
    )
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────
// POST /api/web-booking/send-confirmation
// ─────────────────────────────────────────────────────────────────

describe('POST /api/web-booking/send-confirmation', () => {
  const validBody = {
    patientEmail: 'patient@example.com',
    patientName: '田中太郎',
    clinicName: 'テスト歯科',
    appointmentDate: '2026-03-10',
    appointmentTime: '10:00',
    menuName: '初診',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-api-key'
  })

  it('TC-WBC001: 必須パラメータ不足（patientEmail なし）→ 400', async () => {
    const { patientEmail: _, ...body } = validBody
    const req = makeReq('http://localhost/api/web-booking/send-confirmation', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeTruthy()
  })

  it('TC-WBC002: 必須パラメータ不足（appointmentDate なし）→ 400', async () => {
    const { appointmentDate: _, ...body } = validBody
    const req = makeReq('http://localhost/api/web-booking/send-confirmation', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('TC-WBC003: RESEND_API_KEY 未設定 → 200 + sent: false', async () => {
    delete process.env.RESEND_API_KEY
    const req = makeReq('http://localhost/api/web-booking/send-confirmation', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sent).toBe(false)
  })

  it('TC-WBC004: Resend 送信成功 → 200 + sent: true', async () => {
    mockResendSend.mockResolvedValueOnce({ data: { id: 'email-id-001' }, error: null })
    const req = makeReq('http://localhost/api/web-booking/send-confirmation', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sent).toBe(true)
    expect(data.id).toBe('email-id-001')
  })

  it('TC-WBC005: Resend がエラーを返す → 200 + sent: false', async () => {
    mockResendSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid recipient' },
    })
    const req = makeReq('http://localhost/api/web-booking/send-confirmation', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sent).toBe(false)
    expect(data.reason).toBe('Invalid recipient')
  })

  it('TC-WBC006: Resend が例外をスロー → 200 + sent: false', async () => {
    mockResendSend.mockRejectedValueOnce(new Error('Network error'))
    const req = makeReq('http://localhost/api/web-booking/send-confirmation', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sent).toBe(false)
  })
})
