import { NextRequest, NextResponse } from 'next/server'
import { processPendingNotifications, processAutoReminders } from '@/lib/api/notification-sender'
import { getPrismaClient } from '@/lib/prisma-client'

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

    // 全稼働クリニックを取得
    const prisma = getPrismaClient()
    const clinics = await prisma.clinics.findMany({
      where: { status: { in: ['active', 'trial'] } },
      select: { id: true }
    })

    const currentHour = new Date().getHours()
    const results: Record<string, any> = {}

    for (const clinic of clinics) {
      // 1. スケジュールされた通知を送信
      const pendingResult = await processPendingNotifications(clinic.id)

      // 2. 自動リマインド候補を処理（毎日午前9時に実行・JST）
      let autoRemindersCreated = 0
      if (currentHour === 9) {
        autoRemindersCreated = await processAutoReminders(clinic.id)
      }

      results[clinic.id] = {
        pending_notifications: pendingResult,
        auto_reminders_created: autoRemindersCreated
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clinic_count: clinics.length,
      results
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
