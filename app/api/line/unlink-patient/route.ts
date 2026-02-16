import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * POST /api/line/unlink-patient
 * 患者とLINEアカウントの連携を解除
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const body = await request.json()
    const { line_user_id, patient_id } = body

    // バリデーション
    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDは必須です' },
        { status: 400 }
      )
    }

    if (!patient_id) {
      return NextResponse.json(
        { error: '患者IDは必須です' },
        { status: 400 }
      )
    }

    // 連携情報を取得
    const linkage = await prisma.line_patient_linkages.findFirst({
      where: {
        line_user_id,
        patient_id,
      }
    })

    if (!linkage) {
      return NextResponse.json(
        { error: '連携情報が見つかりません' },
        { status: 404 }
      )
    }

    // 連携を削除
    try {
      await prisma.line_patient_linkages.delete({
        where: { id: linkage.id }
      })
    } catch (deleteError) {
      console.error('連携解除エラー:', deleteError)
      return NextResponse.json(
        { error: '連携解除に失敗しました' },
        { status: 500 }
      )
    }

    // 残りの連携を確認
    const remainingLinkages = await prisma.line_patient_linkages.findMany({
      where: { line_user_id },
      select: { id: true }
    })

    const hasRemainingLinks = remainingLinkages.length > 0

    // リッチメニューを切り替え
    try {
      console.log('🔄 リッチメニュー切り替え開始:', {
        clinic_id: linkage.clinic_id,
        line_user_id,
        is_linked: hasRemainingLinks
      })

      const richMenuResponse = await fetch(`${request.nextUrl.origin}/api/line/switch-rich-menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: linkage.clinic_id,
          line_user_id,
          is_linked: hasRemainingLinks  // 他の連携が残っていれば連携済みメニューのまま
        })
      })

      const richMenuResult = await richMenuResponse.json()

      if (richMenuResponse.ok) {
        console.log('✅ リッチメニュー切り替え成功:', richMenuResult)
      } else {
        console.error('❌ リッチメニュー切り替え失敗:', {
          status: richMenuResponse.status,
          error: richMenuResult
        })
      }
    } catch (richMenuError) {
      console.error('❌ リッチメニュー切り替え例外:', richMenuError)
    }

    return NextResponse.json({
      success: true,
      message: '連携を解除しました',
      has_remaining_links: hasRemainingLinks
    })

  } catch (error) {
    console.error('連携解除エラー:', error)
    return NextResponse.json(
      { error: '連携解除に失敗しました' },
      { status: 500 }
    )
  }
}
