import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/notification-schedules/optimal-send-time
 * 患者の最適な送信時刻を取得（分析データから）
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id は必須です' },
        { status: 400 }
      )
    }

    const analytics = await prisma.patient_notification_analytics.findMany({
      where: {
        patient_id: patientId,
        response_rate: true
      },
      select: {
        hour_of_day: true,
        response_rate: true
      },
      orderBy: { hour_of_day: 'desc' },
      take: 10
    })

    if (!analytics || analytics.length === 0) {
      return NextResponse.json({ optimal_hour: null })
    }

    // 反応率の高い時間帯の平均を計算
    const hours = analytics
      .map(d => d.hour_of_day)
      .filter((h): h is number => h !== null)

    if (hours.length === 0) {
      return NextResponse.json({ optimal_hour: null })
    }

    const avgHour = Math.round(hours.reduce((sum, h) => sum + h, 0) / hours.length)
    return NextResponse.json({ optimal_hour: avgHour })
  } catch (error) {
    console.error('最適送信時刻取得エラー:', error)
    return NextResponse.json(
      { error: '最適送信時刻の取得に失敗しました' },
      { status: 500 }
    )
  }
}
