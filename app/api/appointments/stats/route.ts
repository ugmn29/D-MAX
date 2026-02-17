// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getAppointmentStats } from '@/lib/api/appointments-prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const date = searchParams.get('date')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const stats = await getAppointmentStats(clinicId, date || undefined)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('予約統計取得エラー:', error)
    return NextResponse.json({ error: '予約統計の取得に失敗しました' }, { status: 500 })
  }
}
