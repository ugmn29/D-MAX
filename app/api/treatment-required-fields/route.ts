/**
 * 処置必須記載項目API Route
 * Treatment Required Fields API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 処置の必須記載項目を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const treatmentCode = searchParams.get('treatment_code')

    if (!treatmentCode) {
      return NextResponse.json(
        { error: 'treatment_code is required' },
        { status: 400 }
      )
    }

    const fields = await prisma.treatment_required_fields.findMany({
      where: { treatment_code: treatmentCode },
      orderBy: { display_order: 'asc' },
    })

    return NextResponse.json(fields || [])
  } catch (error) {
    console.error('必須記載項目API エラー:', error)
    return NextResponse.json(
      { error: '必須記載項目の取得に失敗しました' },
      { status: 500 }
    )
  }
}
