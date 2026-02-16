/**
 * カルテ記録個別API Route
 * Medical Record by ID API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// PUT - カルテ記録を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const record = await prisma.medical_records.update({
      where: { id },
      data: {
        ...body,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('カルテ更新エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - カルテ記録を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.medical_records.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('カルテ削除エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
