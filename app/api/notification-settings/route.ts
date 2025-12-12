import { NextRequest, NextResponse } from 'next/server'
import { getNotificationSettings, saveNotificationSettings } from '@/lib/api/notification-settings'

// GET: 通知設定を取得
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

    const settings = await getNotificationSettings(clinicId)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    )
  }
}

// POST: 通知設定を保存
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/notification-settings - 開始')

    const body = await request.json()
    const { clinic_id, settings } = body

    console.log('📊 clinic_id:', clinic_id)
    console.log('📊 settings 受信:', {
      has_settings: !!settings,
      has_line: !!settings?.line,
      line_enabled: settings?.line?.enabled,
      has_token: !!settings?.line?.channel_access_token,
      has_secret: !!settings?.line?.channel_secret
    })

    if (!clinic_id || !settings) {
      console.error('❌ バリデーションエラー: clinic_idまたはsettingsが未設定')
      return NextResponse.json(
        { error: 'clinic_id and settings are required' },
        { status: 400 }
      )
    }

    console.log('💾 saveNotificationSettings 呼び出し中...')
    await saveNotificationSettings(clinic_id, settings)
    console.log('✅ saveNotificationSettings 完了')

    return NextResponse.json({ success: true, message: '設定を保存しました' })
  } catch (error) {
    console.error('❌ Error saving notification settings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('❌ Error stack:', errorStack)
    return NextResponse.json(
      { error: errorMessage, details: errorStack },
      { status: 500 }
    )
  }
}
