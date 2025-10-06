import { NextRequest, NextResponse } from 'next/server'
import { generateQRToken, generateQRCodeImage } from '@/lib/api/line-qr'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

/**
 * QRコード画像を生成してURLを返す
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

    // Base64データを抽出
    const base64Data = qrImageDataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Supabase Storageにアップロード
    const client = getSupabaseClient()
    const fileName = `qr-${qrToken.id}-${Date.now()}.png`
    const { data: uploadData, error: uploadError } = await client
      .storage
      .from('line-qr-codes')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        cacheControl: '300' // 5分間キャッシュ
      })

    if (uploadError) {
      console.error('QR画像アップロードエラー:', uploadError)

      // アップロード失敗の場合、base64データURLをそのまま返す
      return NextResponse.json({
        success: true,
        imageUrl: qrImageDataUrl,
        isDataUrl: true,
        token: qrToken.token
      })
    }

    // 公開URLを取得
    const { data: urlData } = client
      .storage
      .from('line-qr-codes')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      isDataUrl: false,
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
