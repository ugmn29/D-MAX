import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * PUT /api/patient-note-types/[id]?clinic_id=xxx
 * 患者ノートタイプを更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteTypeId } = await params
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
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.color !== undefined) updateData.color = body.color
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order

    const noteType = await prisma.patient_note_types.update({
      where: {
        id: noteTypeId,
        clinic_id: clinicId
      },
      data: updateData
    })

    const noteTypeWithStringDates = convertDatesToStrings(noteType, ['created_at'])

    return NextResponse.json(noteTypeWithStringDates)
  } catch (error) {
    console.error('患者ノートタイプ更新エラー:', error)
    return NextResponse.json(
      { error: '患者ノートタイプの更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/patient-note-types/[id]?clinic_id=xxx
 * 患者ノートタイプを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: noteTypeId } = await params
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // 関連するpatient_notesの確認
    const noteCount = await prisma.patient_notes.count({
      where: {
        note_type_id: noteTypeId
      }
    })

    if (noteCount > 0) {
      return NextResponse.json(
        { error: 'このノートタイプに関連する患者ノートが存在するため削除できません' },
        { status: 400 }
      )
    }

    await prisma.patient_note_types.delete({
      where: {
        id: noteTypeId,
        clinic_id: clinicId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('患者ノートタイプ削除エラー:', error)
    return NextResponse.json(
      { error: '患者ノートタイプの削除に失敗しました' },
      { status: 500 }
    )
  }
}
