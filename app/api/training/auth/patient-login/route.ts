import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service Role クライアント（RLSバイパス用）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface PatientLoginRequest {
  clinicId: string
  patientNumber: number
  credential: string // 生年月日 (YYYYMMDD) or パスワード
  deviceId?: string // デバイス識別子（アカウント切り替え用）
}

interface PatientLoginResponse {
  success: boolean
  token?: string
  patient?: {
    id: string
    patientNumber: number
    name: string
    clinicId: string
    passwordSet: boolean
  }
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PatientLoginRequest = await request.json()
    const { clinicId, patientNumber, credential, deviceId } = body

    console.log('Login attempt:', { clinicId, patientNumber, hasCredential: !!credential })

    // バリデーション
    if (!clinicId || !patientNumber || !credential) {
      console.log('Validation failed')
      return NextResponse.json(
        { success: false, error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    // 患者情報を取得（本登録済みのみ）
    const { data: patient, error: fetchError } = await supabaseAdmin
      .from('patients')
      .select('id, patient_number, last_name, first_name, birth_date, password_hash, password_set, clinic_id')
      .eq('clinic_id', clinicId)
      .eq('patient_number', patientNumber)
      .eq('is_registered', true)
      .single()

    console.log('Patient fetch result:', { patient: !!patient, error: fetchError })

    if (fetchError || !patient) {
      console.log('Patient not found:', fetchError)
      return NextResponse.json(
        { success: false, error: '患者情報が見つかりません' },
        { status: 404 }
      )
    }

    // 認証方式の判定と検証
    let isAuthenticated = false

    if (patient.password_set && patient.password_hash) {
      // パスワード認証
      isAuthenticated = await bcrypt.compare(credential, patient.password_hash)
    } else {
      // 生年月日認証（YYYYMMDD形式）
      const birthDate = patient.birth_date?.replace(/-/g, '') // 2015-04-15 → 20150415
      isAuthenticated = credential === birthDate
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: '認証情報が正しくありません' },
        { status: 401 }
      )
    }

    // カスタムトークン生成（Supabase Admin API使用）
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `patient-${patient.id}@training.local`, // ダミーメールアドレス
      options: {
        data: {
          patient_id: patient.id,
          patient_number: patient.patient_number,
          clinic_id: patient.clinic_id,
          role: 'patient'
        }
      }
    })

    if (tokenError || !tokenData) {
      console.error('Token generation error:', tokenError)
      return NextResponse.json(
        { success: false, error: 'トークン生成に失敗しました' },
        { status: 500 }
      )
    }

    // 最終ログイン日時を更新
    await supabaseAdmin
      .from('patients')
      .update({ training_last_login_at: new Date().toISOString() })
      .eq('id', patient.id)

    // デバイスアカウント情報を保存（アカウント切り替え機能用）
    if (deviceId) {
      await supabaseAdmin
        .from('device_accounts')
        .upsert({
          device_identifier: deviceId,
          patient_id: patient.id,
          last_login_at: new Date().toISOString()
        }, {
          onConflict: 'device_identifier,patient_id'
        })
    }

    // レスポンス
    return NextResponse.json({
      success: true,
      token: tokenData.properties.hashed_token,
      patient: {
        id: patient.id,
        patientNumber: patient.patient_number,
        name: `${patient.last_name} ${patient.first_name}`,
        clinicId: patient.clinic_id,
        passwordSet: patient.password_set || false
      }
    } as PatientLoginResponse)

  } catch (error) {
    console.error('Patient login error:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
