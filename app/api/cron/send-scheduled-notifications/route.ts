import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { Resend } from 'resend'

/**
 * GET /api/cron/send-scheduled-notifications
 *
 * 定期実行: 送信予定の通知を処理してLINEで送信
 *
 * Vercel Cronまたは外部cronサービスから定期的に呼び出されることを想定
 * 例: 5分おきに実行
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    // 認証チェック（本番環境では必須）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: '認証エラー' },
        { status: 401 }
      )
    }

    console.log('定期通知送信ジョブ開始:', new Date().toISOString())

    // 現在時刻から5分後までの送信予定通知を取得
    const now = new Date()
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000)

    const schedules = await prisma.patient_notification_schedules.findMany({
      where: {
        status: 'scheduled',
        auto_send: true,
        send_datetime: {
          lte: fiveMinutesLater,
          gte: now
        }
      },
      include: {
        treatment_menus: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!schedules || schedules.length === 0) {
      console.log('送信予定の通知はありません')
      return NextResponse.json({
        success: true,
        message: '送信予定の通知はありません',
        sent: 0
      })
    }

    console.log(`${schedules.length}件の通知を処理します`)

    let successCount = 0
    let errorCount = 0

    // 各通知を処理
    for (const schedule of schedules) {
      try {
        // LINE連携を確認（常に優先）
        const lineUserLink = await prisma.line_user_links.findFirst({
          where: {
            patient_id: schedule.patient_id,
            clinic_id: schedule.clinic_id,
            is_blocked: false
          },
          select: { line_user_id: true }
        })
        const lineUserId = lineUserLink?.line_user_id ?? null
        const effectiveChannel = lineUserId ? 'line' : (schedule.send_channel || 'email')

        if (effectiveChannel === 'line') {
          // LINE通知を送信
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/line/send-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clinic_id: schedule.clinic_id,
              patient_id: schedule.patient_id,
              notification_type: schedule.notification_type,
              template_id: schedule.template_id,
              custom_data: {
                treatment_menu_name: schedule.treatment_menus?.name,
                message: schedule.custom_message
              }
            })
          })
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'LINE送信失敗')
          }
        } else if (effectiveChannel === 'email') {
          // メール通知を送信（Resend経由）
          if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY が設定されていません')
          }
          const patient = await prisma.patients.findUnique({
            where: { id: schedule.patient_id },
            select: { email: true, name: true }
          })
          if (!patient?.email) {
            throw new Error('メールアドレスが登録されていません')
          }
          const resend = new Resend(process.env.RESEND_API_KEY)
          const { error } = await resend.emails.send({
            from: 'HubDent予約 <yoyaku@hubdent.net>',
            to: patient.email,
            subject: '通知',
            text: schedule.custom_message || '',
          })
          if (error) throw new Error(error.message)
        } else {
          console.log(`スキップ（SMS未対応）: ${schedule.id}`)
          continue
        }

        // 送信成功: ステータスを更新
        await prisma.patient_notification_schedules.update({
          where: { id: schedule.id },
          data: {
            status: 'sent',
            sent_at: new Date()
          }
        })

        successCount++
        console.log(`送信成功 [${effectiveChannel}]: ${schedule.id}`)

      } catch (error: any) {
        console.error(`通知送信エラー (${schedule.id}):`, error)

        // 送信失敗: ステータスを更新
        await prisma.patient_notification_schedules.update({
          where: { id: schedule.id },
          data: {
            status: 'failed',
            error_message: error.message
          }
        })

        errorCount++
      }
    }

    console.log(`通知送信完了: 成功=${successCount}, 失敗=${errorCount}`)

    return NextResponse.json({
      success: true,
      message: '通知送信処理が完了しました',
      total: schedules.length,
      sent: successCount,
      failed: errorCount
    })

  } catch (error: any) {
    console.error('定期通知送信ジョブエラー:', error)
    return NextResponse.json(
      {
        error: '定期通知送信ジョブに失敗しました',
        message: error.message
      },
      { status: 500 }
    )
  }
}
