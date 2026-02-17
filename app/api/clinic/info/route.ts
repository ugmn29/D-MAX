import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

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

    const prisma = getPrismaClient()

    // 医院情報を取得
    const clinic = await prisma.clinics.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        phone: true,
        address_line: true,
        email: true,
      },
    })

    if (!clinic) {
      console.error('医院情報取得エラー: 該当する医院が見つかりません')

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
      clinic: {
        id: clinic.id,
        name: clinic.name,
        phone: clinic.phone,
        address: clinic.address_line,
        email: clinic.email,
      }
    })

  } catch (error) {
    console.error('医院情報取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
