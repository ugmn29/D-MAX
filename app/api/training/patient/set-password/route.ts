import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
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
    })

  } catch (error) {
    console.error('パスワード設定エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
