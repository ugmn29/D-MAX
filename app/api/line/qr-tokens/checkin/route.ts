// Migrated to Prisma API Routes
/**
 * QRコードチェックイン API Route
 * POST: QRコードスキャンによる来院登録処理
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * POST: QRコードチェックイン処理
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'token is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // トークンを検索
    const qrToken = await prisma.line_qr_tokens.findUnique({
      where: { token }
    })

    if (!qrToken) {
      return NextResponse.json({
        success: false,
        error: 'QRコードが無効または期限切れです'
      })
    }

    // 有効期限チェック
    const now = new Date()
    const expiresAt = new Date(qrToken.expires_at)
    if (now > expiresAt) {
      // 期限切れ - ステータスを更新
      await prisma.line_qr_tokens.update({
        where: { id: qrToken.id },
        data: { status: 'expired' }
      })
      return NextResponse.json({
        success: false,
        error: 'QRコードが無効または期限切れです'
      })
    }

    // ステータスチェック
    if (qrToken.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'QRコードが無効または期限切れです'
      })
    }

    // 患者情報を取得
    const patient = await prisma.patients.findUnique({
      where: { id: qrToken.patient_id }
    })

    if (!patient) {
      return NextResponse.json({
        success: false,
        error: '患者情報が見つかりません'
      })
    }

    // 本日の予約を検索
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const appointments = await prisma.appointments.findMany({
      where: {
        patient_id: qrToken.patient_id,
        start_time: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      orderBy: {
        start_time: 'asc'
      }
    })

    const appointment = appointments.length > 0 ? appointments[0] : null

    if (!appointment) {
      // 予約がない場合 - トークンを使用済みにマーク
      await prisma.line_qr_tokens.update({
        where: { id: qrToken.id },
        data: { status: 'used', used_at: new Date() }
      })
      return NextResponse.json({
        success: false,
        patient: serializePatient(patient),
        error: '本日の予約がありません。受付にお声がけください。'
      })
    }

    // 来院登録
    await prisma.appointments.update({
      where: { id: appointment.id },
      data: {
        checked_in_at: new Date(),
        check_in_method: 'qr_code'
      }
    })

    // トークンを使用済みにマーク
    await prisma.line_qr_tokens.update({
      where: { id: qrToken.id },
      data: { status: 'used', used_at: new Date() }
    })

    // LINE通知を送信（患者のLINEに来院確認）
    // TODO: LINE Messaging API統合時に実装
    console.log('来院確認通知送信:', {
      lineUserId: qrToken.line_user_id,
      patientName: patient.name,
      appointmentTime: appointment.start_time
    })

    return NextResponse.json({
      success: true,
      patient: serializePatient(patient),
      appointment: serializeAppointment(appointment)
    })
  } catch (error) {
    console.error('QRチェックインエラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'チェックイン処理に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * 患者データをシリアライズ
 */
function serializePatient(patient: any) {
  const result: any = { ...patient }
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Date) {
      result[key] = result[key].toISOString()
    }
  }
  return result
}

/**
 * 予約データをシリアライズ
 */
function serializeAppointment(appointment: any) {
  const result: any = { ...appointment }
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Date) {
      result[key] = result[key].toISOString()
    }
  }
  return result
}
