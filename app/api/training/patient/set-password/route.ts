import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { patientId, password } = await request.json()

    if (!patientId || !password) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で設定してください' },
        { status: 400 }
      )
    }

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 10)

    // データベースを更新
    const { error } = await supabaseAdmin
      .from('patients')
      .update({
        password_hash: passwordHash,
        password_set: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)

    if (error) {
      console.error('パスワード設定エラー:', error)
      return NextResponse.json(
        { error: 'パスワードの設定に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'パスワードを設定しました'
    })

  } catch (error) {
    console.error('パスワード設定エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
