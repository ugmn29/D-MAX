import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['identified_at', 'resolved_at', 'created_at'] as const

// PUT /api/training/issues/[id]
// 課題を解決済みにする、または更新する
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { is_resolved, severity, notes } = body

    const updateData: any = {}

    if (is_resolved !== undefined) {
      updateData.is_resolved = is_resolved
      if (is_resolved) {
        updateData.resolved_at = new Date()
      } else {
        updateData.resolved_at = null
      }
    }

    if (severity !== undefined) {
      updateData.severity = severity
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const prisma = getPrismaClient()

    const updated = await prisma.patient_issue_records.update({
      where: { id },
      data: updateData,
      include: {
        patient_issues: true
      }
    })

    const { patient_issues, ...rest } = updated as any
    const result = {
      ...convertDatesToStrings(rest, [...DATE_FIELDS]),
      issue: patient_issues ? convertDatesToStrings(patient_issues, ['created_at']) : null
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('課題更新エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/training/issues/[id]
// 課題を削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const prisma = getPrismaClient()

    await prisma.patient_issue_records.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: '課題を削除しました',
    })
  } catch (error: any) {
    console.error('課題削除エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
