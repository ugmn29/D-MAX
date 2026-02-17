import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'
import { nanoid } from 'nanoid'

/**
 * POST /api/web-booking-tokens
 * Web予約用トークンを生成
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()

    const {
      clinic_id,
      patient_id,
      treatment_menu_id,
      treatment_menu_level2_id,
      treatment_menu_level3_id,
      staff_ids = [],
      expires_in_days = 7,
      created_by,
      notification_schedule_id
    } = body

    if (!clinic_id || !patient_id || !created_by) {
      return NextResponse.json(
        { error: 'clinic_id, patient_id, created_by は必須です' },
        { status: 400 }
      )
    }

    // トークン文字列を生成（URL安全な文字のみ、21文字）
    const token = nanoid(21)

    // 有効期限を計算
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_in_days)

    const created = await prisma.web_booking_tokens.create({
      data: {
        clinic_id,
        patient_id,
        treatment_menu_id: treatment_menu_id || null,
        treatment_menu_level2_id: treatment_menu_level2_id || null,
        treatment_menu_level3_id: treatment_menu_level3_id || null,
        staff_ids: staff_ids,
        token,
        expires_at: expiresAt,
        created_by,
        notification_schedule_id: notification_schedule_id || null
      }
    })

    const result = convertDatesToStrings(created, [
      'expires_at', 'used_at', 'created_at', 'updated_at'
    ])

    return NextResponse.json(result)
  } catch (error) {
    console.error('トークン生成エラー:', error)
    return NextResponse.json(
      { error: 'トークンの生成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/web-booking-tokens?clinic_id=xxx
 * 有効期限切れのトークンを削除（クリーンアップ用）
 */
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const result = await prisma.web_booking_tokens.deleteMany({
      where: {
        clinic_id: clinicId,
        expires_at: {
          lt: new Date()
        }
      }
    })

    return NextResponse.json({ deleted_count: result.count })
  } catch (error) {
    console.error('期限切れトークン削除エラー:', error)
    return NextResponse.json(
      { error: '期限切れトークンの削除に失敗しました' },
      { status: 500 }
    )
  }
}
