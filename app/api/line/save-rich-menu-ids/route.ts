import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/line/save-rich-menu-ids
 * リッチメニューIDをデータベースに保存
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/line/save-rich-menu-ids - 開始')

    const body = await request.json()
    const {
      clinic_id,
      registered_menu_id,
      unregistered_menu_id
    } = body

    console.log('💾 リッチメニューID保存リクエスト:', {
      clinic_id,
      registered_menu_id,
      unregistered_menu_id,
      has_supabaseAdmin: !!supabaseAdmin
    })

    if (!clinic_id) {
      console.error('❌ clinic_id が未指定')
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.error('❌ supabaseAdmin が初期化されていません')
      return NextResponse.json(
        { error: 'サーバー設定エラー: Supabase Admin未初期化' },
        { status: 500 }
      )
    }

    const supabase = supabaseAdmin

    // 既存のリッチメニューID設定を取得
    console.log('🔍 既存設定を取得中...')
    const { data: existingSettings, error: fetchError } = await supabase
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinic_id)
      .eq('setting_key', 'line_rich_menu')
      .maybeSingle()

    if (fetchError) {
      console.error('❌ 既存設定取得エラー:', fetchError)
    }

    console.log('📋 既存設定:', existingSettings?.setting_value || 'なし')

    const existingValue = existingSettings?.setting_value || {}

    // 既存の値とマージ（新しい値のみ上書き）
    const newValue = {
      line_registered_rich_menu_id: registered_menu_id || existingValue.line_registered_rich_menu_id,
      line_unregistered_rich_menu_id: unregistered_menu_id || existingValue.line_unregistered_rich_menu_id
    }

    console.log('📊 保存する値:', newValue)

    // line_rich_menu キーに保存
    console.log('💾 データベースに保存中...')
    const { data: upsertData, error } = await supabase
      .from('clinic_settings')
      .upsert({
        clinic_id: clinic_id,
        setting_key: 'line_rich_menu',
        setting_value: newValue
      }, {
        onConflict: 'clinic_id,setting_key'
      })
      .select()

    if (error) {
      console.error('❌ リッチメニューID保存エラー:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      throw new Error(`Database Error: ${error.message}`)
    }

    console.log('✅ リッチメニューID保存成功')
    console.log('📊 保存されたデータ:', upsertData)

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
