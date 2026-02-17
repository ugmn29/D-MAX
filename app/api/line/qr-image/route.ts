// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { generateQRToken, generateQRCodeImage } from '@/lib/api/line-qr'

/**
 * QRコード画像を生成してBase64データURLを返す
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patient_id, clinic_id, line_user_id } = body

    if (!patient_id || !clinic_id || !line_user_id) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      )
    }

    // QRトークンを生成（5分間有効）
    const qrToken = await generateQRToken({
      patient_id,
      clinic_id,
      line_user_id,
      purpose: 'checkin',
      expires_in_minutes: 5
    })

    // QRコード画像を生成
    const qrImageDataUrl = await generateQRCodeImage(qrToken.token)

    return NextResponse.json({
      success: true,
      imageUrl: qrImageDataUrl,
      isDataUrl: true,
      token: qrToken.token
    })
  } catch (error) {
    console.error('QRコード画像生成エラー:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'QRコード画像の生成に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}
