import { NextResponse } from 'next/server'
import { getLineSettings } from '@/lib/line/messaging'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/line/fix-default-menu
 * デフォルトリッチメニューを未連携用メニューに設定
 */
export async function POST() {
  try {
    const clinicId = '11111111-1111-1111-1111-111111111111'

    // LINE設定を取得
    const lineSettings = await getLineSettings(clinicId)

    // 未連携メニューIDを取得
    const { data: richMenuSettings } = await supabaseAdmin
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinicId)
      .eq('setting_key', 'line_rich_menu')
      .single()

    const unregisteredMenuId = richMenuSettings?.setting_value?.line_unregistered_rich_menu_id

    if (!unregisteredMenuId) {
      return NextResponse.json(
        { error: '未連携メニューIDが設定されていません' },
        { status: 400 }
      )
    }

    // 現在のデフォルトメニューを確認
    const currentDefaultResponse = await fetch(
      'https://api.line.me/v2/bot/user/all/richmenu',
      {
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    let currentDefaultId = null
    if (currentDefaultResponse.ok) {
      const result = await currentDefaultResponse.json()
      currentDefaultId = result.richMenuId
    }

    // デフォルトメニューを設定
    const setDefaultResponse = await fetch(
      `https://api.line.me/v2/bot/user/all/richmenu/${unregisteredMenuId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    if (!setDefaultResponse.ok) {
      const error = await setDefaultResponse.json()
      throw new Error(`Failed to set default menu: ${JSON.stringify(error)}`)
    }

    return NextResponse.json({
      success: true,
      message: 'デフォルトメニューを設定しました',
      previousDefaultId: currentDefaultId,
      newDefaultId: unregisteredMenuId
    })

  } catch (error) {
    console.error('デフォルトメニュー設定エラー:', error)
    return NextResponse.json(
      {
        error: 'Failed to set default menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/line/fix-default-menu
 * デフォルトリッチメニューの状態を確認
 */
export async function GET() {
  try {
    const clinicId = '11111111-1111-1111-1111-111111111111'

    const lineSettings = await getLineSettings(clinicId)

    const { data: richMenuSettings } = await supabaseAdmin
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', clinicId)
      .eq('setting_key', 'line_rich_menu')
      .single()

    const unregisteredMenuId = richMenuSettings?.setting_value?.line_unregistered_rich_menu_id

    // 現在のデフォルトメニューを確認
    const currentDefaultResponse = await fetch(
      'https://api.line.me/v2/bot/user/all/richmenu',
      {
        headers: {
          'Authorization': `Bearer ${lineSettings.channelAccessToken}`
        }
      }
    )

    let currentDefaultId = null
    if (currentDefaultResponse.ok) {
      const result = await currentDefaultResponse.json()
      currentDefaultId = result.richMenuId
    }

    return NextResponse.json({
      success: true,
      currentDefaultId,
      expectedUnregisteredId: unregisteredMenuId,
      isCorrect: currentDefaultId === unregisteredMenuId
    })

  } catch (error) {
    console.error('デフォルトメニュー確認エラー:', error)
    return NextResponse.json(
      {
        error: 'Failed to check default menu',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
