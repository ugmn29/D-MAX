import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * POST /api/auto-reminders/process
 * 自動リマインド候補を検出して通知スケジュールを作成
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { clinic_id } = body

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // 自動リマインドルールを取得
    const rule = await prisma.auto_reminder_rules.findUnique({
      where: { clinic_id }
    })

    if (!rule || !rule.enabled) {
      return NextResponse.json({ created: 0 })
    }

    // 候補患者を検出（最終来院日から指定期間経過）
    const intervals = (rule.intervals as any[]) || []
    let created = 0

    for (const interval of intervals) {
      const monthsAgo = interval.months
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() - monthsAgo)

      // 最終来院日が対象期間の患者を取得（completed statusの予約）
      const candidates = await prisma.appointments.findMany({
        where: {
          clinic_id,
          status: 'COMPLETED',
          start_time: {
            gte: targetDate
          }
        },
        select: {
          patient_id: true
        },
        distinct: ['patient_id']
      })

      if (!candidates || candidates.length === 0) continue

      for (const candidate of candidates) {
        // 既に通知スケジュールが存在しないか確認
        const existing = await prisma.patient_notification_schedules.findFirst({
          where: {
            patient_id: candidate.patient_id,
            is_auto_reminder: true,
            auto_reminder_sequence: interval.sequence,
            status: { in: ['scheduled', 'sent'] }
          }
        })

        if (existing) continue

        // 通知スケジュールを作成
        const sendDate = new Date()
        sendDate.setHours(rule.default_send_hour || 18, 0, 0, 0)

        await prisma.patient_notification_schedules.create({
          data: {
            patient_id: candidate.patient_id,
            clinic_id,
            template_id: interval.template_id || null,
            notification_type: 'periodic_checkup',
            message: interval.message || '定期検診のお知らせです',
            send_datetime: sendDate,
            send_channel: interval.channel || 'line',
            status: 'scheduled',
            is_auto_reminder: true,
            auto_reminder_sequence: interval.sequence
          }
        })

        created++
      }
    }

    return NextResponse.json({ created })
  } catch (error) {
    console.error('自動リマインド処理エラー:', error)
    return NextResponse.json(
      { error: '自動リマインド処理に失敗しました' },
      { status: 500 }
    )
  }
}
