import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/patient-note-types?clinic_id=xxx
 * 患者ノートタイプ一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const noteTypes = await prisma.patient_note_types.findMany({
      where: {
        clinic_id: clinicId
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    const noteTypesWithStringDates = noteTypes.map(noteType =>
      convertDatesToStrings(noteType, ['created_at'])
    )

    return NextResponse.json(noteTypesWithStringDates)
  } catch (error) {
    console.error('患者ノートタイプ取得エラー:', error)
    return NextResponse.json(
      { error: '患者ノートタイプの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/patient-note-types?clinic_id=xxx
 * 患者ノートタイプを作成
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, icon, color, sort_order } = body

    if (!name) {
      return NextResponse.json(
        { error: 'ノートタイプ名は必須です' },
        { status: 400 }
      )
    }

    const noteType = await prisma.patient_note_types.create({
      data: {
        clinic_id: clinicId,
        name,
        icon: icon || null,
        color: color || null,
        sort_order: sort_order ?? 0
      }
    })

    const noteTypeWithStringDates = convertDatesToStrings(noteType, ['created_at'])

    return NextResponse.json(noteTypeWithStringDates)
  } catch (error) {
    console.error('患者ノートタイプ作成エラー:', error)
    return NextResponse.json(
      { error: '患者ノートタイプの作成に失敗しました' },
      { status: 500 }
    )
  }
}
