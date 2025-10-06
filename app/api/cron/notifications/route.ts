import { NextRequest, NextResponse } from 'next/server'
import { processPendingNotifications, processAutoReminders } from '@/lib/api/notification-sender'

/**
 * GET: 定期実行される通知バッチ処理
 *
 * Vercel Cronで使用
 * vercel.jsonに以下を設定:
 * {
 *   "crons": [{
 *     "path": "/api/cron/notifications",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cronからのリクエストか検証
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // デモクリニックIDで実行（実際は全クリニック分ループ）
    const DEMO_CLINIC_ID = '00000000-0000-0000-0000-000000000000'

    // 1. スケジュールされた通知を送信
    const pendingResult = await processPendingNotifications(DEMO_CLINIC_ID)

    // 2. 自動リマインド候補を処理（1日1回実行想定）
    let autoRemindersCreated = 0
    const currentHour = new Date().getHours()
    if (currentHour === 9) {
      // 毎日午前9時に実行
      autoRemindersCreated = await processAutoReminders(DEMO_CLINIC_ID)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clinic_id: DEMO_CLINIC_ID,
      results: {
        pending_notifications: pendingResult,
        auto_reminders_created: autoRemindersCreated
      }
    })
  } catch (error) {
    console.error('Cron通知処理エラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
