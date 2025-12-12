import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/line/save-rich-menu-ids
 * リッチメニューIDをデータベースに保存
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      registered_menu_id,
      unregistered_menu_id
    } = body

    console.log('💾 リッチメニューID保存:', {
      clinic_id,
      registered_menu_id,
      unregistered_menu_id
    })

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin

    // 既存のリッチメニューID設定を取得
    const { data: existingSettings } = await supabase
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinic_id)
      .eq('setting_key', 'line_rich_menu')
      .maybeSingle()

    const existingValue = existingSettings?.setting_value || {}

    // 既存の値とマージ（新しい値のみ上書き）
    const newValue = {
      line_registered_rich_menu_id: registered_menu_id || existingValue.line_registered_rich_menu_id,
      line_unregistered_rich_menu_id: unregistered_menu_id || existingValue.line_unregistered_rich_menu_id
    }

    console.log('📊 保存する値:', newValue)

    // line_rich_menu キーに保存
    const { error } = await supabase
      .from('clinic_settings')
      .upsert({
        clinic_id: clinic_id,
        setting_key: 'line_rich_menu',
        setting_value: newValue
      }, {
        onConflict: 'clinic_id,setting_key'
      })

    if (error) {
      console.error('❌ リッチメニューID保存エラー:', error)
      throw new Error(`Database Error: ${error.message}`)
    }

    console.log('✅ リッチメニューID保存成功')

    return NextResponse.json({
      success: true,
      message: 'リッチメニューIDを保存しました'
    })

  } catch (error) {
    console.error('❌ リッチメニューID保存エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
