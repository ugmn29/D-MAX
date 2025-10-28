import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import QRCode from 'qrcode'

/**
 * GET /api/patients/[id]/qr-code
 * 患者のQRコードを取得（存在しない場合は自動生成）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const patientId = params.id
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'data-url' // data-url | svg | terminal

    // 患者が存在するか確認
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, clinic_id, patient_number, last_name, first_name')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    // 既存のQRコードを取得
    let { data: qrCodeData, error: qrError } = await supabase
      .from('patient_qr_codes')
      .select('*')
      .eq('patient_id', patientId)
      .single()

    // QRコードが存在しない場合は生成
    if (qrError || !qrCodeData) {
      const qr_token = `${patient.clinic_id}-${patient.id}-${Date.now()}`

      const { data: newQrCode, error: insertError } = await supabase
        .from('patient_qr_codes')
        .insert({
          patient_id: patientId,
          clinic_id: patient.clinic_id,
          qr_token,
          expires_at: null, // 無期限
          usage_count: 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error('QRコード生成エラー:', insertError)
        return NextResponse.json(
          { error: 'QRコードの生成に失敗しました' },
          { status: 500 }
        )
      }

      qrCodeData = newQrCode
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
    await supabase
      .from('patient_qr_codes')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (qrCodeData.usage_count || 0) + 1
      })
      .eq('id', qrCodeData.id)

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
        created_at: qrCodeData.created_at,
        last_used_at: qrCodeData.last_used_at,
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const patientId = params.id

    const { error } = await supabase
      .from('patient_qr_codes')
      .delete()
      .eq('patient_id', patientId)

    if (error) {
      console.error('QRコード削除エラー:', error)
      return NextResponse.json(
        { error: 'QRコードの削除に失敗しました' },
        { status: 500 }
      )
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
