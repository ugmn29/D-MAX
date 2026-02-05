import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Client } from '@line/bot-sdk'

/**
 * POST /api/line/save-rich-menu-ids
 * リッチメニューIDをデータベースに保存し、既存の連携済みユーザーに新しいリッチメニューを割り当て
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
    const { data: existingSettings, error: fetchError } = await supabase
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinic_id)
      .eq('setting_key', 'line_rich_menu')
      .maybeSingle()

    if (fetchError) {
      console.error('❌ 既存設定取得エラー:', fetchError)
    }

    const existingValue = existingSettings?.setting_value || {}

    // 既存の値とマージ（新しい値のみ上書き）
    const newValue = {
      line_registered_rich_menu_id: registered_menu_id || existingValue.line_registered_rich_menu_id,
      line_unregistered_rich_menu_id: unregistered_menu_id || existingValue.line_unregistered_rich_menu_id
    }

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


    // 連携済みユーザーに新しいリッチメニューを割り当て
    let reassignedCount = 0
    if (registered_menu_id) {
      try {
        console.log('🔄 既存連携ユーザーにリッチメニューを再割り当て中...')

        // LINE設定を取得
        const { data: lineSettings } = await supabase
          .from('clinic_settings')
          .select('setting_value')
          .eq('clinic_id', clinic_id)
          .eq('setting_key', 'line')
          .single()

        const channelAccessToken = lineSettings?.setting_value?.channel_access_token

        if (channelAccessToken) {
          // LINE Botクライアント初期化
          const lineClient = new Client({ channelAccessToken })

          // 連携済みユーザーを取得
          const { data: linkages } = await supabase
            .from('line_patient_linkages')
            .select('line_user_id')
            .eq('clinic_id', clinic_id)

          if (linkages && linkages.length > 0) {
            console.log(`📋 ${linkages.length}人の連携済みユーザーを更新中...`)

            // 各ユーザーに新しいリッチメニューを割り当て
            for (const linkage of linkages) {
              try {
                await lineClient.linkRichMenuToUser(linkage.line_user_id, registered_menu_id)
                reassignedCount++
              } catch (linkError) {
                console.warn(`⚠️ ユーザー ${linkage.line_user_id} への割り当て失敗:`, linkError)
              }
            }

            console.log(`✅ ${reassignedCount}/${linkages.length}人のユーザーを更新しました`)
          }
        } else {
          console.warn('⚠️ LINE Channel Access Tokenが見つからないため、ユーザー更新をスキップ')
        }
      } catch (reassignError) {
        console.error('⚠️ リッチメニュー再割り当てエラー:', reassignError)
        // エラーでもメニューID保存は成功しているので続行
      }
    }

    return NextResponse.json({
      success: true,
      message: 'リッチメニューIDを保存しました',
      reassignedUsers: reassignedCount
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
