import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

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
        // LINEチャネルのみ処理（email, smsは別途実装が必要）
        if (schedule.send_channel !== 'line') {
          console.log(`スキップ（非LINE）: ${schedule.id}`)
          continue
        }

        // Web予約URLを生成（該当する場合）
        let webBookingUrl = null
        const webBookingMenuIds = schedule.web_booking_menu_ids as any
        if (webBookingMenuIds && webBookingMenuIds.length > 0) {
          // TODO: Web予約トークンを生成してLIFF URLを作成
          webBookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/web-booking?clinic_id=${schedule.clinic_id}`
        }

        // 治療メニュー名を取得
        const treatmentMenuName = schedule.treatment_menus?.name

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
              treatment_menu_name: treatmentMenuName,
              web_booking_url: webBookingUrl,
              message: schedule.custom_message
            }
          })
        })

        if (response.ok) {
          // 送信成功: ステータスを更新
          await prisma.patient_notification_schedules.update({
            where: { id: schedule.id },
            data: {
              status: 'sent',
              sent_at: new Date()
            }
          })

          successCount++
          console.log(`送信成功: ${schedule.id}`)
        } else {
          const error = await response.json()
          throw new Error(error.message || '送信失敗')
        }

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
