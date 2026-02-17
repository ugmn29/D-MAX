import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'
import QRCode from 'qrcode'

/**
 * GET /api/patients/[id]/qr-code
 * 患者のQRコードを取得（存在しない場合は自動生成）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrismaClient()

    const { id: patientId } = await params
    console.log('QRコード取得:', patientId)
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'data-url' // data-url | svg | terminal

    // 患者が存在するか確認
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { id: true, clinic_id: true, patient_number: true, last_name: true, first_name: true }
    })

    if (!patient) {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    // 既存のQRコードを取得
    let qrCodeData = await prisma.patient_qr_codes.findUnique({
      where: { patient_id: patientId }
    })

    // QRコードが存在しない場合は生成
    if (!qrCodeData) {
      const qr_token = `${patient.clinic_id}-${patient.id}-${Date.now()}`

      try {
        qrCodeData = await prisma.patient_qr_codes.create({
          data: {
            patient_id: patientId,
            clinic_id: patient.clinic_id,
            qr_token,
            expires_at: null, // 無期限
            usage_count: 0,
          }
        })
      } catch (insertError) {
        console.error('QRコード生成エラー:', insertError)
        return NextResponse.json(
          { error: 'QRコードの生成に失敗しました' },
          { status: 500 }
        )
      }
    }

    // QRコードの内容（JSON形式）
    const qrContent = JSON.stringify({
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      patient_number: patient.patient_number,
      token: qrCodeData.qr_token,
      type: 'checkin',
      timestamp: Date.now()
    })

    // QRコード画像を生成
    let qrCodeImage: string

    if (format === 'svg') {
      qrCodeImage = await QRCode.toString(qrContent, {
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
    } else if (format === 'terminal') {
      qrCodeImage = await QRCode.toString(qrContent, {
        type: 'terminal',
        small: true
      })
    } else {
      // デフォルト: data URL (PNG)
      qrCodeImage = await QRCode.toDataURL(qrContent, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
    }

    // 使用回数を更新
    await prisma.patient_qr_codes.update({
      where: { id: qrCodeData.id },
      data: {
        last_used_at: new Date(),
        usage_count: (qrCodeData.usage_count || 0) + 1
      }
    })

    // Date型を文字列に変換
    const qrDataConverted = convertDatesToStrings(qrCodeData, ['created_at', 'last_used_at'])

    return NextResponse.json({
      qr_code: qrCodeImage,
      format,
      patient: {
        id: patient.id,
        name: `${patient.last_name} ${patient.first_name}`,
        patient_number: patient.patient_number
      },
      qr_data: {
        token: qrCodeData.qr_token,
        created_at: qrDataConverted.created_at,
        last_used_at: qrDataConverted.last_used_at,
        usage_count: (qrCodeData.usage_count || 0) + 1
      }
    })

  } catch (error) {
    console.error('QRコード取得エラー:', error)
    return NextResponse.json(
      { error: 'QRコードの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/patients/[id]/qr-code
 * 患者のQRコードを削除（再生成用）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrismaClient()

    const { id: patientId } = await params

    // patient_idでレコードが存在するか確認してから削除
    const existing = await prisma.patient_qr_codes.findUnique({
      where: { patient_id: patientId }
    })

    if (existing) {
      await prisma.patient_qr_codes.delete({
        where: { patient_id: patientId }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('QRコード削除エラー:', error)
    return NextResponse.json(
      { error: 'QRコードの削除に失敗しました' },
      { status: 500 }
    )
  }
}
