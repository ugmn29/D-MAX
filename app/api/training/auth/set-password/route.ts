import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'

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
    const prisma = getPrismaClient()
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
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        birth_date: true,
        password_hash: true,
        password_set: true,
      },
    })

    if (!patient) {
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
        const birthDateStr = patient.birth_date instanceof Date
          ? patient.birth_date.toISOString().split('T')[0].replace(/-/g, '')
          : patient.birth_date?.toString().replace(/-/g, '') || ''
        if (currentCredential !== birthDateStr) {
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
    await prisma.patients.update({
      where: { id: patientId },
      data: {
        password_hash: passwordHash,
        password_set: true,
        updated_at: new Date(),
      },
    })

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
