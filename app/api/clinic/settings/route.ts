import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/clinic/settings
 * クリニック設定を保存
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin

    if (!supabase) {
      console.error('Supabase Admin clientが初期化されていません')
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      )
    }

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

    // データベースに保存
    const { data, error } = await supabase
      .from('clinic_settings')
      .upsert({
        clinic_id,
        setting_key,
        setting_value
      }, {
        onConflict: 'clinic_id,setting_key'
      })
      .select()

    if (error) {
      console.error('❌ 設定保存エラー:', error)
      return NextResponse.json(
        { error: `設定の保存に失敗しました: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ 設定保存成功:', {
      clinic_id,
      setting_key
    })

    // notificationConnectionの場合、LINE設定も同期
    if (setting_key === 'notificationConnection' && setting_value?.line) {
      const line = setting_value.line

      if (line.enabled && line.accessToken && line.channelSecret) {
        console.log('🔄 LINE設定を同期中...')

        // LINE基本設定を保存（getLineSettings関数が読み取る形式）
        const { error: lineError } = await supabase
          .from('clinic_settings')
          .upsert({
            clinic_id,
            setting_key: 'line',
            setting_value: {
              channel_access_token: line.accessToken,
              channel_secret: line.channelSecret,
              channel_id: line.channelId || undefined,
              webhook_url: line.webhookUrl || 'https://dmax-mu.vercel.app/api/line/webhook'
            }
          }, {
            onConflict: 'clinic_id,setting_key'
          })

        if (lineError) {
          console.error('⚠️ LINE設定同期エラー:', lineError)
          // エラーでも通知設定は保存されているので継続
        } else {
          console.log('✅ LINE設定を同期しました')
        }
      }
    }

    return NextResponse.json({
      success: true,
      data
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
 * クリニック設定を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin

    if (!supabase) {
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')
    const setting_key = searchParams.get('setting_key')

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'クリニックIDは必須です' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('clinic_settings')
      .select('*')
      .eq('clinic_id', clinic_id)

    if (setting_key) {
      query = query.eq('setting_key', setting_key)
    }

    const { data, error } = await query

    if (error) {
      console.error('設定取得エラー:', error)
      return NextResponse.json(
        { error: '設定の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings: data })

  } catch (error) {
    console.error('設定取得エラー:', error)
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}
