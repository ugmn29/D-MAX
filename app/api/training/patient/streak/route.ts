import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが必要です' },
        { status: 400 }
      )
    }

    // 過去30日分の実施記録を取得（日付ごとにグループ化）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const records = await prisma.training_records.findMany({
      where: {
        patient_id: patientId,
        completed: true,
        performed_at: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        performed_at: true,
        completed: true,
      },
      orderBy: {
        performed_at: 'desc',
      },
    })

    if (!records || records.length === 0) {
      return NextResponse.json({ success: true, streak: 0 })
    }

    // 日付ごとにユニークな日を抽出
    const uniqueDates = new Set(
      records.map(r => {
        const d = r.performed_at instanceof Date ? r.performed_at : new Date(r.performed_at!)
        return d.toISOString().split('T')[0]
      })
    )
    const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a))

    // 連続日数を計算
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    let currentDate = new Date(today)

    for (const date of sortedDates) {
      const checkDate = currentDate.toISOString().split('T')[0]

      if (date === checkDate) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return NextResponse.json({
      success: true,
      streak
    })

  } catch (error) {
    console.error('Streak API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
