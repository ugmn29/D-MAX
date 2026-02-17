import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { patientId, clinicId, trainingId, menuId, completed, actualDurationSeconds } = body

    if (!patientId || !clinicId || !trainingId || !menuId) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    // 時間帯を判定
    const hour = new Date().getHours()
    let timeOfDay = 'morning'
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening'
    else if (hour >= 21 || hour < 6) timeOfDay = 'night'

    // トレーニング記録を保存
    const data = await prisma.training_records.create({
      data: {
        patient_id: patientId,
        clinic_id: clinicId,
        training_id: trainingId,
        menu_id: menuId,
        completed: completed || false,
        interrupted: !completed,
        time_of_day: timeOfDay,
        actual_duration_seconds: actualDurationSeconds,
        performed_at: new Date(),
      },
    })

    const record = convertDatesToStrings(data, ['performed_at', 'created_at'])

    return NextResponse.json({
      success: true,
      record
    })

  } catch (error) {
    console.error('Complete API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
