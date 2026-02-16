/**
 * Staff Positions API Route - Prisma版
 * サーバーサイド専用
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { convertToDate } from '@/lib/prisma/helpers'

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

    const positions = await prisma.staff_positions.findMany({
      where: {
        clinic_id: clinicId
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    const result = positions.map(position => ({
      id: position.id,
      name: position.name,
      sort_order: position.sort_order,
      clinic_id: position.clinic_id,
      created_at: convertToDate(position.created_at).toISOString(),
      updated_at: convertToDate(position.created_at).toISOString()
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('スタッフ役職取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const newPosition = await prisma.staff_positions.create({
      data: {
        name: body.name,
        sort_order: body.sort_order ?? 0,
        clinic_id: clinicId,
        template_id: body.template_id || null
      }
    })

    const result = {
      id: newPosition.id,
      name: newPosition.name,
      sort_order: newPosition.sort_order,
      clinic_id: newPosition.clinic_id,
      created_at: convertToDate(newPosition.created_at).toISOString(),
      updated_at: convertToDate(newPosition.created_at).toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('スタッフ役職作成エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
