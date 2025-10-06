import { NextRequest, NextResponse } from 'next/server'
import { processPendingNotifications, processAutoReminders } from '@/lib/api/notification-sender'

/**
 * POST: 通知バッチ処理を実行
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, process_type } = body

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    let result: any = {}

    if (process_type === 'pending' || !process_type) {
      // スケジュールされた通知を送信
      const pendingResult = await processPendingNotifications(clinic_id)
      result.pending = pendingResult
    }

    if (process_type === 'auto_reminders' || !process_type) {
      // 自動リマインド候補を処理
      const remindersCreated = await processAutoReminders(clinic_id)
      result.auto_reminders = {
        created: remindersCreated
      }
    }

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('通知バッチ処理エラー:', error)
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    )
  }
}

/**
 * GET: バッチ処理のステータス確認
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // TODO: バッチ処理のステータスを返す
    return NextResponse.json({
      status: 'ready',
      last_run: null,
      next_run: null
    })
  } catch (error) {
    console.error('ステータス取得エラー:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
