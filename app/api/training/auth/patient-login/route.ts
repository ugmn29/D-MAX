import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

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
    const prisma = getPrismaClient()
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
    const patient = await prisma.patients.findFirst({
      where: {
        clinic_id: clinicId,
        patient_number: patientNumber,
        is_registered: true,
      },
      select: {
        id: true,
        patient_number: true,
        last_name: true,
        first_name: true,
        birth_date: true,
        password_hash: true,
        password_set: true,
        clinic_id: true,
      },
    })

    console.log('Patient fetch result:', { patient: !!patient })

    if (!patient) {
      console.log('Patient not found in database')
      return NextResponse.json(
        {
          success: false,
          error: '患者情報が見つかりません。本登録済みの患者のみログイン可能です。'
        },
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
      const birthDateStr = patient.birth_date instanceof Date
        ? patient.birth_date.toISOString().split('T')[0].replace(/-/g, '')
        : patient.birth_date?.toString().replace(/-/g, '') || ''
      isAuthenticated = credential === birthDateStr
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: '認証情報が正しくありません' },
        { status: 401 }
      )
    }

    // トークン生成（Supabase Auth の代わりにcryptoベースのトークンを使用）
    const tokenPayload = {
      patient_id: patient.id,
      patient_number: patient.patient_number,
      clinic_id: patient.clinic_id,
      role: 'patient',
      iat: Date.now(),
    }
    const token = crypto
      .createHash('sha256')
      .update(JSON.stringify(tokenPayload) + crypto.randomBytes(16).toString('hex'))
      .digest('hex')

    // 最終ログイン日時を更新
    await prisma.patients.update({
      where: { id: patient.id },
      data: { training_last_login_at: new Date() },
    })

    // デバイスアカウント情報を保存（アカウント切り替え機能用）
    if (deviceId) {
      await prisma.device_accounts.upsert({
        where: {
          device_identifier_patient_id: {
            device_identifier: deviceId,
            patient_id: patient.id,
          },
        },
        update: {
          last_login_at: new Date(),
        },
        create: {
          device_identifier: deviceId,
          patient_id: patient.id,
          last_login_at: new Date(),
        },
      })
    }

    // レスポンス
    return NextResponse.json({
      success: true,
      token,
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
