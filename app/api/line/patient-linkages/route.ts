import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * GET /api/line/patient-linkages?patient_id=xxx
 * 患者IDからLINE連携情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const searchParams = request.nextUrl.searchParams
    const patient_id = searchParams.get('patient_id')

    if (!patient_id) {
      return NextResponse.json(
        { error: '患者IDは必須です' },
        { status: 400 }
      )
    }

    // 患者に紐づく LINE連携情報を取得
    const linkages = await prisma.line_patient_linkages.findMany({
      where: { patient_id },
      orderBy: [
        { is_primary: 'desc' },
        { linked_at: 'desc' }
      ]
    })

    return NextResponse.json({ linkages: linkages || [] })

  } catch (error) {
    console.error('LINE連携情報の取得エラー:', error)
    return NextResponse.json(
      { error: 'LINE連携情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/line/patient-linkages?linkage_id=xxx
 * LINE連携を解除し、リッチメニューを未連携用に切り替え
 */
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const searchParams = request.nextUrl.searchParams
    const linkage_id = searchParams.get('linkage_id')

    if (!linkage_id) {
      return NextResponse.json(
        { error: '連携IDは必須です' },
        { status: 400 }
      )
    }

    // 連携情報を取得（リッチメニュー切り替え用）
    const linkage = await prisma.line_patient_linkages.findUnique({
      where: { id: linkage_id },
      select: { line_user_id: true, patient_id: true, clinic_id: true }
    })

    if (!linkage) {
      console.error('❌ 連携情報取得失敗')
      return NextResponse.json(
        { error: '連携情報が見つかりません' },
        { status: 404 }
      )
    }

    console.log('🔍 連携解除開始:', {
      linkage_id,
      line_user_id: linkage.line_user_id,
      patient_id: linkage.patient_id,
      clinic_id: linkage.clinic_id
    })

    // 連携を削除
    try {
      await prisma.line_patient_linkages.delete({
        where: { id: linkage_id }
      })
    } catch (deleteError) {
      console.error('❌ 連携解除エラー:', deleteError)
      return NextResponse.json(
        { error: '連携解除に失敗しました' },
        { status: 500 }
      )
    }

    console.log('✅ 連携削除成功')

    // このLINEユーザーに他の連携があるかチェック
    const remainingLinkages = await prisma.line_patient_linkages.findMany({
      where: { line_user_id: linkage.line_user_id },
      select: { id: true }
    })

    const hasOtherLinkages = remainingLinkages.length > 0

    console.log('🔍 残存連携チェック:', {
      line_user_id: linkage.line_user_id,
      remaining_count: remainingLinkages.length,
      has_other_linkages: hasOtherLinkages
    })

    // 他の連携がない場合のみ、リッチメニューを未連携用に切り替え
    if (!hasOtherLinkages) {
      try {
        console.log('🔄 リッチメニューを未連携用に切り替え開始:', {
          clinic_id: linkage.clinic_id,
          line_user_id: linkage.line_user_id,
          is_linked: false
        })

        const richMenuResponse = await fetch(`${request.nextUrl.origin}/api/line/switch-rich-menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clinic_id: linkage.clinic_id,
            line_user_id: linkage.line_user_id,
            is_linked: false // 未連携用に切り替え
          })
        })

        const richMenuResult = await richMenuResponse.json()

        if (richMenuResponse.ok) {
          console.log('✅ リッチメニュー切り替え成功（未連携用）:', richMenuResult)
        } else {
          console.error('❌ リッチメニュー切り替え失敗:', {
            status: richMenuResponse.status,
            error: richMenuResult
          })
        }
      } catch (richMenuError) {
        console.error('❌ リッチメニュー切り替え例外:', richMenuError)
        // リッチメニューエラーは無視（後で手動切り替え可能）
      }
    } else {
      console.log('ℹ️ 他の連携が存在するため、リッチメニューは変更しません')
    }

    return NextResponse.json({
      success: true,
      switched_rich_menu: !hasOtherLinkages
    })

  } catch (error) {
    console.error('❌ 連携解除エラー:', error)
    return NextResponse.json(
      { error: '連携解除に失敗しました' },
      { status: 500 }
    )
  }
}
