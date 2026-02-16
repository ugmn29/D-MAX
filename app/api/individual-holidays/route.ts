import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/individual-holidays
 * 個別休診日を取得
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

    const holidays = await prisma.individual_holidays.findMany({
      where: {
        clinic_id: clinicId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    })

    // 日付をキーとしたオブジェクトに変換
    const holidaysMap: Record<string, boolean> = {}
    holidays.forEach(item => {
      const dateStr = item.date.toISOString().split('T')[0]
      holidaysMap[dateStr] = item.is_holiday
    })

    return NextResponse.json(holidaysMap)
  } catch (error) {
    console.error('個別休診日取得エラー:', error)
    return NextResponse.json(
      { error: '個別休診日の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/individual-holidays
 * 個別休診日を設定（upsert）
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { clinic_id, date, is_holiday } = body

    if (!clinic_id || !date) {
      return NextResponse.json(
        { error: 'clinic_id and date are required' },
        { status: 400 }
      )
    }

    const dateObj = new Date(date)

    const result = await prisma.individual_holidays.upsert({
      where: {
        clinic_id_date: {
          clinic_id,
          date: dateObj
        }
      },
      update: {
        is_holiday: is_holiday ?? true,
        updated_at: new Date()
      },
      create: {
        clinic_id,
        date: dateObj,
        is_holiday: is_holiday ?? true
      }
    })

    return NextResponse.json(convertDatesToStrings(result, ['date', 'created_at', 'updated_at']))
  } catch (error) {
    console.error('個別休診日設定エラー:', error)
    return NextResponse.json(
      { error: '個別休診日の設定に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/individual-holidays
 * 個別休診日を削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { clinicId, date, clinic_id } = await request.json()

    const cId = clinic_id || clinicId
    if (!cId || !date) {
      return NextResponse.json(
        { error: 'clinic_id and date are required' },
        { status: 400 }
      )
    }

    await prisma.individual_holidays.delete({
      where: {
        clinic_id_date: {
          clinic_id: cId,
          date: new Date(date)
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('個別休診日削除エラー:', error)
    return NextResponse.json(
      { error: '個別休診日の削除に失敗しました' },
      { status: 500 }
    )
  }
}
