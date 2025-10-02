import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface SetPasswordRequest {
  patientId: string
  newPassword: string
  currentCredential?: string // 既存のパスワードまたは生年月日
}

interface SetPasswordResponse {
  success: boolean
  message?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SetPasswordRequest = await request.json()
    const { patientId, newPassword, currentCredential } = body

    // バリデーション
    if (!patientId || !newPassword) {
      return NextResponse.json(
        { success: false, error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    // パスワード強度チェック（8文字以上）
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'パスワードは8文字以上で設定してください' },
        { status: 400 }
      )
    }

    // 患者情報を取得
    const { data: patient, error: fetchError } = await supabaseAdmin
      .from('patients')
      .select('id, birth_date, password_hash, password_set')
      .eq('id', patientId)
      .single()

    if (fetchError || !patient) {
      return NextResponse.json(
        { success: false, error: '患者情報が見つかりません' },
        { status: 404 }
      )
    }

    // 既にパスワードが設定されている場合は、現在の認証情報を検証
    if (patient.password_set && currentCredential) {
      const isValid = await bcrypt.compare(currentCredential, patient.password_hash || '')

      if (!isValid) {
        // パスワードが違う場合、生年月日でも試す
        const birthDate = patient.birth_date?.replace(/-/g, '')
        if (currentCredential !== birthDate) {
          return NextResponse.json(
            { success: false, error: '現在の認証情報が正しくありません' },
            { status: 401 }
          )
        }
      }
    }

    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    // パスワードを更新
    const { error: updateError } = await supabaseAdmin
      .from('patients')
      .update({
        password_hash: passwordHash,
        password_set: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'パスワードの設定に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'パスワードを設定しました'
    } as SetPasswordResponse)

  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
