import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DEFAULT_NOTIFICATION_SETTINGS = {
  email: {
    enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_address: '',
    from_name: ''
  },
  sms: {
    enabled: false,
    provider: 'twilio',
    api_key: '',
    api_secret: '',
    sender_number: ''
  },
  line: {
    enabled: false,
    channel_id: '',
    channel_secret: '',
    channel_access_token: '',
    webhook_url: '',
    liff_id_initial_link: '',
    liff_id_qr_code: '',
    liff_id_family_register: '',
    liff_id_appointments: '',
    liff_id_web_booking: ''
  }
}

// GET: 通知設定を取得
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const setting = await prisma.clinic_settings.findFirst({
      where: {
        clinic_id: clinicId,
        setting_key: 'notification_settings'
      }
    })

    if (!setting) {
      // データが存在しない場合はデフォルト値を返す
      return NextResponse.json(DEFAULT_NOTIFICATION_SETTINGS)
    }

    return NextResponse.json(setting.setting_value)
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
    const prisma = getPrismaClient()

    console.log('POST /api/notification-settings - 開始')

    const body = await request.json()
    const { clinic_id, settings } = body

    console.log('clinic_id:', clinic_id)
    console.log('settings 受信:', {
      has_settings: !!settings,
      has_line: !!settings?.line,
      line_enabled: settings?.line?.enabled,
      has_token: !!settings?.line?.channel_access_token,
      has_secret: !!settings?.line?.channel_secret
    })

    if (!clinic_id || !settings) {
      console.error('バリデーションエラー: clinic_idまたはsettingsが未設定')
      return NextResponse.json(
        { error: 'clinic_id and settings are required' },
        { status: 400 }
      )
    }

    // upsert: 既存の設定があれば更新、なければ新規作成
    console.log('saveNotificationSettings 呼び出し中...')
    await prisma.clinic_settings.upsert({
      where: {
        clinic_id_setting_key: {
          clinic_id: clinic_id,
          setting_key: 'notification_settings'
        }
      },
      update: {
        setting_value: settings,
        updated_at: new Date()
      },
      create: {
        clinic_id: clinic_id,
        setting_key: 'notification_settings',
        setting_value: settings
      }
    })
    console.log('saveNotificationSettings 完了')

    // LINE設定が有効な場合、line キーにも同期保存（getLineSettings関数用）
    if (settings.line?.enabled && settings.line?.channel_access_token && settings.line?.channel_secret) {
      console.log('LINE基本設定を同期中...')

      const lineSettings: Record<string, any> = {
        channel_access_token: settings.line.channel_access_token,
        channel_secret: settings.line.channel_secret,
        channel_id: settings.line.channel_id || undefined,
        webhook_url: settings.line.webhook_url || 'https://shikabot-mu.vercel.app/api/line/webhook'
      }

      // LIFF IDを追加（存在する場合）
      if (settings.line.liff_id_initial_link) lineSettings.liff_id_initial_link = settings.line.liff_id_initial_link
      if (settings.line.liff_id_qr_code) lineSettings.liff_id_qr_code = settings.line.liff_id_qr_code
      if (settings.line.liff_id_family_register) lineSettings.liff_id_family_register = settings.line.liff_id_family_register
      if (settings.line.liff_id_appointments) lineSettings.liff_id_appointments = settings.line.liff_id_appointments
      if (settings.line.liff_id_web_booking) lineSettings.liff_id_web_booking = settings.line.liff_id_web_booking

      console.log('保存するLINE設定:', {
        ...lineSettings,
        channel_access_token: lineSettings.channel_access_token ? '***設定済み***' : undefined,
        channel_secret: lineSettings.channel_secret ? '***設定済み***' : undefined
      })

      try {
        await prisma.clinic_settings.upsert({
          where: {
            clinic_id_setting_key: {
              clinic_id: clinic_id,
              setting_key: 'line'
            }
          },
          update: {
            setting_value: lineSettings,
            updated_at: new Date()
          },
          create: {
            clinic_id: clinic_id,
            setting_key: 'line',
            setting_value: lineSettings
          }
        })
        console.log('LINE基本設定を同期しました（LIFF ID含む）')
      } catch (lineError) {
        console.error('LINE基本設定の同期に失敗:', lineError)
        // エラーでも通知設定は保存されているので継続
      }
    }

    return NextResponse.json({ success: true, message: '設定を保存しました' })
  } catch (error) {
    console.error('Error saving notification settings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Error stack:', errorStack)
    return NextResponse.json(
      { error: errorMessage, details: errorStack },
      { status: 500 }
    )
  }
}
