import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinicId')

    if (!clinicId) {
      return NextResponse.json(
        { error: '医院IDが必要です' },
        { status: 400 }
      )
    }

    // 医院情報を取得
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .select('id, name, phone, address, email')
      .eq('id', clinicId)
      .single()

    if (error || !clinic) {
      console.error('医院情報取得エラー:', error)

      // デフォルトの医院情報を返す（開発用）
      return NextResponse.json({
        success: true,
        clinic: {
          id: clinicId,
          name: 'デモクリニック',
          phone: null,
          address: null,
          email: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      clinic
    })

  } catch (error) {
    console.error('医院情報取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
