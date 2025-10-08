import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json()

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが必要です' },
        { status: 400 }
      )
    }

    // パスワードをリセット（password_hashをnull、password_setをfalseに）
    const { error } = await supabaseAdmin
      .from('patients')
      .update({
        password_hash: null,
        password_set: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)

    if (error) {
      console.error('パスワードリセットエラー:', error)
      return NextResponse.json(
        { error: 'パスワードのリセットに失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'パスワードをリセットしました。患者は生年月日でログインできます。'
    })

  } catch (error) {
    console.error('パスワードリセットエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
