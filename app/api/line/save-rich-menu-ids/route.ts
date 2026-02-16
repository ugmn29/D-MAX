import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { jsonToObject } from '@/lib/prisma-helpers'
import { Client } from '@line/bot-sdk'

/**
 * POST /api/line/save-rich-menu-ids
 * リッチメニューIDをデータベースに保存し、既存の連携済みユーザーに新しいリッチメニューを割り当て
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/line/save-rich-menu-ids - 開始')

    const prisma = getPrismaClient()

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

    // 既存のリッチメニューID設定を取得
    const existingSettings = await prisma.clinic_settings.findFirst({
      where: {
        clinic_id,
        setting_key: 'line_rich_menu',
      },
      select: { setting_value: true }
    })

    const existingValue = jsonToObject<any>(existingSettings?.setting_value) || {}

    // 既存の値とマージ（新しい値のみ上書き）
    const newValue = {
      line_registered_rich_menu_id: registered_menu_id || existingValue.line_registered_rich_menu_id,
      line_unregistered_rich_menu_id: unregistered_menu_id || existingValue.line_unregistered_rich_menu_id
    }

    await prisma.clinic_settings.upsert({
      where: {
        clinic_id_setting_key: {
          clinic_id,
          setting_key: 'line_rich_menu',
        }
      },
      create: {
        clinic_id,
        setting_key: 'line_rich_menu',
        setting_value: newValue,
      },
      update: {
        setting_value: newValue,
      }
    })


    // 連携済みユーザーに新しいリッチメニューを割り当て
    let reassignedCount = 0
    if (registered_menu_id) {
      try {
        console.log('🔄 既存連携ユーザーにリッチメニューを再割り当て中...')

        // LINE設定を取得
        const lineSettings = await prisma.clinic_settings.findFirst({
          where: {
            clinic_id,
            setting_key: 'line',
          },
          select: { setting_value: true }
        })

        const channelAccessToken = jsonToObject<any>(lineSettings?.setting_value)?.channel_access_token

        if (channelAccessToken) {
          // LINE Botクライアント初期化
          const lineClient = new Client({ channelAccessToken })

          // 連携済みユーザーを取得
          const linkages = await prisma.line_patient_linkages.findMany({
            where: { clinic_id },
            select: { line_user_id: true }
          })

          if (linkages.length > 0) {
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
