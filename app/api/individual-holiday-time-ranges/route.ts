import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * GET /api/individual-holiday-time-ranges
 * 時間帯休診を取得 → Record<dateString, {startTime, endTime}[]>
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!clinicId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'clinic_id, start_date, end_date are required' },
        { status: 400 }
      )
    }

    const rows = await prisma.individual_holiday_time_ranges.findMany({
      where: {
        clinic_id: clinicId,
        date: { gte: new Date(startDate), lte: new Date(endDate) }
      },
      orderBy: { start_time: 'asc' }
    })

    const result: Record<string, { startTime: string; endTime: string }[]> = {}
    for (const row of rows) {
      const dateStr = row.date.toISOString().split('T')[0]
      const startTime = row.start_time.toISOString().substring(11, 16)
      const endTime = row.end_time.toISOString().substring(11, 16)
      if (!result[dateStr]) result[dateStr] = []
      result[dateStr].push({ startTime, endTime })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('時間帯休診取得エラー:', error)
    return NextResponse.json({ error: '時間帯休診の取得に失敗しました' }, { status: 500 })
  }
}

/**
 * POST /api/individual-holiday-time-ranges
 * 該当日の時間帯休診を一括置換（delete + create）
 * body: { clinic_id, date, ranges: [{start_time, end_time}] }
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { clinic_id, date, ranges } = await request.json()

    if (!clinic_id || !date || !Array.isArray(ranges)) {
      return NextResponse.json(
        { error: 'clinic_id, date, ranges are required' },
        { status: 400 }
      )
    }

    const dateObj = new Date(date)

    await prisma.$transaction([
      prisma.individual_holiday_time_ranges.deleteMany({
        where: { clinic_id, date: dateObj }
      }),
      prisma.individual_holiday_time_ranges.createMany({
        data: ranges.map((r: { start_time: string; end_time: string }) => ({
          clinic_id,
          date: dateObj,
          start_time: new Date(`1970-01-01T${r.start_time}:00Z`),
          end_time: new Date(`1970-01-01T${r.end_time}:00Z`)
        }))
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('時間帯休診設定エラー:', error)
    return NextResponse.json({ error: '時間帯休診の設定に失敗しました' }, { status: 500 })
  }
}

/**
 * DELETE /api/individual-holiday-time-ranges
 * 該当日の時間帯休診を全削除
 * body: { clinic_id, date }
 */
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { clinic_id, date } = await request.json()

    if (!clinic_id || !date) {
      return NextResponse.json(
        { error: 'clinic_id and date are required' },
        { status: 400 }
      )
    }

    await prisma.individual_holiday_time_ranges.deleteMany({
      where: { clinic_id, date: new Date(date) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('時間帯休診削除エラー:', error)
    return NextResponse.json({ error: '時間帯休診の削除に失敗しました' }, { status: 500 })
  }
}
