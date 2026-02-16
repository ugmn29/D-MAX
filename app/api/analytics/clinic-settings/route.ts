import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const clinic = await prisma.clinics.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        time_slot_minutes: true,
      },
    })

    if (!clinic) {
      return NextResponse.json(
        { error: 'クリニックが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: clinic.id,
      time_slot_minutes: clinic.time_slot_minutes ?? 15,
    })
  } catch (error: any) {
    console.error('クリニック設定取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'クリニック設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}
