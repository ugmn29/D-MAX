import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * POST /api/notification-sender/send
 * 通知送信に伴うDB操作を一括処理
 *
 * Body:
 *   action: 'get_line_user_id' | 'mark_sent' | 'mark_failed' | 'mark_cancelled'
 *
 * action = 'get_line_user_id':
 *   patient_id: string
 *   Returns: { line_user_id: string | null }
 *
 * action = 'mark_sent':
 *   schedule_id: string
 *   patient_id: string
 *   clinic_id: string
 *   send_channel: string
 *   Returns: { success: true }
 *
 * action = 'mark_failed':
 *   schedule_id: string
 *   patient_id: string
 *   clinic_id: string
 *   send_channel: string
 *   failure_reason: string
 *   retry_count: number
 *   Returns: { success: true }
 *
 * action = 'mark_cancelled':
 *   schedule_id: string
 *   Returns: { success: true }
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'get_line_user_id': {
        const { patient_id } = body

        if (!patient_id) {
          return NextResponse.json(
            { error: 'patient_id is required' },
            { status: 400 }
          )
        }

        const links = await prisma.line_user_links.findMany({
          where: { patient_id },
          select: { line_user_id: true },
          take: 1
        })

        const lineUserId = links.length > 0 ? links[0].line_user_id : null
        return NextResponse.json({ line_user_id: lineUserId })
      }

      case 'mark_sent': {
        const { schedule_id, patient_id, clinic_id, send_channel } = body

        if (!schedule_id) {
          return NextResponse.json(
            { error: 'schedule_id is required' },
            { status: 400 }
          )
        }

        const now = new Date()

        // スケジュールを送信済みに更新
        await prisma.patient_notification_schedules.update({
          where: { id: schedule_id },
          data: {
            status: 'sent',
            sent_at: now,
            updated_at: now
          }
        })

        // 分析データを記録
        if (patient_id && clinic_id) {
          await prisma.patient_notification_analytics.create({
            data: {
              patient_id,
              clinic_id,
              notification_schedule_id: schedule_id,
              sent_at: now,
              send_channel: send_channel || null
            }
          })
        }

        return NextResponse.json({ success: true })
      }

      case 'mark_failed': {
        const { schedule_id, patient_id, clinic_id, send_channel, failure_reason, retry_count } = body

        if (!schedule_id) {
          return NextResponse.json(
            { error: 'schedule_id is required' },
            { status: 400 }
          )
        }

        const currentRetryCount = retry_count || 0
        const now = new Date()

        // スケジュールを更新（3回以上リトライしたら失敗）
        await prisma.patient_notification_schedules.update({
          where: { id: schedule_id },
          data: {
            status: currentRetryCount >= 3 ? 'failed' : 'scheduled',
            failure_reason: failure_reason || '送信に失敗しました',
            retry_count: currentRetryCount + 1,
            updated_at: now
          }
        })

        // 失敗ログを記録
        if (patient_id && clinic_id) {
          await prisma.notification_failure_logs.create({
            data: {
              notification_schedule_id: schedule_id,
              patient_id,
              clinic_id,
              attempted_channel: send_channel || null,
              failure_reason: failure_reason || '送信に失敗しました',
              is_retryable: currentRetryCount < 3
            }
          })
        }

        return NextResponse.json({ success: true })
      }

      case 'mark_cancelled': {
        const { schedule_id } = body

        if (!schedule_id) {
          return NextResponse.json(
            { error: 'schedule_id is required' },
            { status: 400 }
          )
        }

        await prisma.patient_notification_schedules.update({
          where: { id: schedule_id },
          data: {
            status: 'cancelled',
            updated_at: new Date()
          }
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('通知送信DB操作エラー:', error)
    return NextResponse.json(
      { error: '通知送信のDB操作に失敗しました' },
      { status: 500 }
    )
  }
}
