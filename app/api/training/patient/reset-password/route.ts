import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { patientId } = await request.json()

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが必要です' },
        { status: 400 }
      )
    }

    // パスワードをリセット（password_hashをnull、password_setをfalseに）
    await prisma.patients.update({
      where: { id: patientId },
      data: {
        password_hash: null,
        password_set: false,
        updated_at: new Date(),
      },
    })

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
