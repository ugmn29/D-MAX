import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * POST /api/clinic/settings
 * クリニック設定を保存 (Prisma版)
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const body = await request.json()
    const { clinic_id, setting_key, setting_value } = body

    // バリデーション
    if (!clinic_id) {
      return NextResponse.json(
        { error: 'クリニックIDは必須です' },
        { status: 400 }
      )
    }

    if (!setting_key) {
      return NextResponse.json(
        { error: '設定キーは必須です' },
        { status: 400 }
      )
    }

    console.log('🔧 クリニック設定保存:', {
      clinic_id,
      setting_key,
      has_value: !!setting_value
    })

    // Prismaのupsertを使用
    const data = await prisma.clinic_settings.upsert({
      where: {
        clinic_id_setting_key: {
          clinic_id,
          setting_key
        }
      },
      update: {
        setting_value,
        updated_at: new Date()
      },
      create: {
        clinic_id,
        setting_key,
        setting_value
      }
    })

    console.log('✅ 設定保存成功:', {
      clinic_id,
      setting_key
    })

    // notificationConnectionの場合、LINE設定も同期
    if (setting_key === 'notificationConnection' && setting_value?.line) {
      const line = setting_value.line

      if (line.enabled && line.accessToken && line.channelSecret) {
        console.log('🔄 LINE設定を同期中...')

        try {
          await prisma.clinic_settings.upsert({
            where: {
              clinic_id_setting_key: {
                clinic_id,
                setting_key: 'line'
              }
            },
            update: {
              setting_value: {
                channel_access_token: line.accessToken,
                channel_secret: line.channelSecret,
                channel_id: line.channelId || undefined,
                webhook_url: line.webhookUrl || 'https://shikabot-mu.vercel.app/api/line/webhook'
              },
              updated_at: new Date()
            },
            create: {
              clinic_id,
              setting_key: 'line',
              setting_value: {
                channel_access_token: line.accessToken,
                channel_secret: line.channelSecret,
                channel_id: line.channelId || undefined,
                webhook_url: line.webhookUrl || 'https://shikabot-mu.vercel.app/api/line/webhook'
              }
            }
          })

          console.log('✅ LINE設定を同期しました')
        } catch (lineError) {
          console.error('⚠️ LINE設定同期エラー:', lineError)
          // エラーでも通知設定は保存されているので継続
        }
      }
    }

    // Date型をISO文字列に変換して返す
    const responseData = convertDatesToStrings(data, ['created_at', 'updated_at'])

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('❌ 設定保存エラー:', error)
    return NextResponse.json(
      { error: '設定の保存に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/clinic/settings?clinic_id=xxx&setting_key=xxx
 * クリニック設定を取得 (Prisma版)
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')
    const setting_key = searchParams.get('setting_key')

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'クリニックIDは必須です' },
        { status: 400 }
      )
    }

    // setting_keyの有無で条件分岐
    const settings = setting_key
      ? await prisma.clinic_settings.findMany({
          where: {
            clinic_id,
            setting_key
          }
        })
      : await prisma.clinic_settings.findMany({
          where: {
            clinic_id
          }
        })

    // Date型をISO文字列に変換
    const settingsWithStringDates = settings.map(setting =>
      convertDatesToStrings(setting, ['created_at', 'updated_at'])
    )

    return NextResponse.json({ settings: settingsWithStringDates })

  } catch (error) {
    console.error('設定取得エラー:', error)
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}
