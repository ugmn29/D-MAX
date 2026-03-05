/**
 * TC-DB001〜TC-DB006: GET /api/appointments/daily-briefing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockVerifyAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth/verify-request', () => ({
  verifyAuth: mockVerifyAuth,
  verifyAdmin: vi.fn(),
}))

const mockPrisma = vi.hoisted(() => ({
  appointments: { findMany: vi.fn() },
  subkarte_entries: { findMany: vi.fn() },
}))

vi.mock('@/lib/prisma-client', () => ({
  prisma: mockPrisma,
  getPrismaClient: vi.fn(() => mockPrisma),
}))

// テスト対象
import { GET } from '@/app/api/appointments/daily-briefing/route'

const CLINIC_ID = 'clinic-001'
const PATIENT_ID = 'patient-001'

const makeRequest = (date: string) =>
  new NextRequest(`http://localhost/api/appointments/daily-briefing?date=${date}`)

const mockAppointment = {
  id: 'apt-001',
  clinic_id: CLINIC_ID,
  patient_id: PATIENT_ID,
  start_time: new Date('1970-01-01T09:00:00Z'),
  end_time: new Date('1970-01-01T09:30:00Z'),
  status: '未来院',
  staff1_id: 'staff-001',
  staff2_id: null,
  staff3_id: null,
  is_block: false,
  patients: { id: PATIENT_ID, last_name: '田中', first_name: '太郎', patient_number: 1 },
  treatment_menus_appointments_menu1_idTotreatment_menus: { id: 'm1', name: 'スケーリング', color: '#3b82f6' },
  treatment_menus_appointments_menu2_idTotreatment_menus: null,
  treatment_menus_appointments_menu3_idTotreatment_menus: null,
  staff_appointments_staff1_idTostaff: { id: 'staff-001', name: '山田' },
  staff_appointments_staff2_idTostaff: null,
  staff_appointments_staff3_idTostaff: null,
}

const mockSubkarte = {
  patient_id: PATIENT_ID,
  content: '歯茎の状態が改善してきた。',
  created_at: new Date('2026-02-01T10:00:00Z'),
}

describe('GET /api/appointments/daily-briefing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyAuth.mockResolvedValue({ clinicId: CLINIC_ID, staffId: 'staff-001' })
  })

  it('TC-DB001: 認証なし → 401', async () => {
    mockVerifyAuth.mockRejectedValue(new Error('Unauthorized'))
    const res = await GET(makeRequest('2026-03-05'))
    expect(res.status).toBe(401)
  })

  it('TC-DB002: date パラメータなし → 400', async () => {
    const req = new NextRequest('http://localhost/api/appointments/daily-briefing')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('TC-DB003: 予約0件 → 空配列を返す', async () => {
    mockPrisma.appointments.findMany.mockResolvedValue([])
    const res = await GET(makeRequest('2026-03-05'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([])
  })

  it('TC-DB004: 予約あり + サブカルテあり → 正しくマージして返す', async () => {
    mockPrisma.appointments.findMany.mockResolvedValue([mockAppointment])
    mockPrisma.subkarte_entries.findMany.mockResolvedValue([mockSubkarte])

    const res = await GET(makeRequest('2026-03-05'))
    expect(res.status).toBe(200)
    const data = await res.json()

    expect(data).toHaveLength(1)
    expect(data[0].patient.last_name).toBe('田中')
    expect(data[0].menu1.name).toBe('スケーリング')
    expect(data[0].start_time).toBe('09:00')
    expect(data[0].latest_subkarte.content).toBe('歯茎の状態が改善してきた。')
  })

  it('TC-DB005: 予約あり + サブカルテなし → latest_subkarte が null', async () => {
    mockPrisma.appointments.findMany.mockResolvedValue([mockAppointment])
    mockPrisma.subkarte_entries.findMany.mockResolvedValue([])

    const res = await GET(makeRequest('2026-03-05'))
    const data = await res.json()
    expect(data[0].latest_subkarte).toBeNull()
  })

  it('TC-DB006: Prisma エラー → 500', async () => {
    mockPrisma.appointments.findMany.mockRejectedValue(new Error('DB Error'))
    const res = await GET(makeRequest('2026-03-05'))
    expect(res.status).toBe(500)
  })
})
