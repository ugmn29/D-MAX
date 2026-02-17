// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET: 患者の統計情報を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // 全患者数を取得
    const total = await prisma.patients.count({
      where: { clinic_id: clinicId }
    })

    // 本登録済み患者数を取得
    const registered = await prisma.patients.count({
      where: {
        clinic_id: clinicId,
        is_registered: true
      }
    })

    const temporary = total - registered

    return NextResponse.json({
      total,
      registered,
      temporary
    })
  } catch (error) {
    console.error('患者統計API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
