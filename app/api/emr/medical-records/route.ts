/**
 * 診療記録API Route
 * Medical Records API - Prisma版
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

// GET - 患者のカルテ記録一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const records = await prisma.medical_records.findMany({
      where: { patient_id: patientId },
      orderBy: { visit_date: 'desc' },
      take: limit,
    })

    return NextResponse.json(records || [])
  } catch (error) {
    console.error('カルテ記録取得API エラー:', error)
    return NextResponse.json(
      { error: 'カルテ記録の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST - カルテ記録を新規作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, patient_id, ...recordData } = body

    if (!clinic_id || !patient_id) {
      return NextResponse.json(
        { error: 'clinic_id and patient_id are required' },
        { status: 400 }
      )
    }

    const record = await prisma.medical_records.create({
      data: {
        clinic_id,
        patient_id,
        ...recordData,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('カルテ保存API エラー:', error)
    return NextResponse.json(
      { error: 'カルテ記録の保存に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT - カルテ記録を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const record = await prisma.medical_records.update({
      where: { id },
      data: {
        ...updates,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('カルテ更新API エラー:', error)
    return NextResponse.json(
      { error: 'カルテ記録の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE - カルテ記録を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await prisma.medical_records.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('カルテ削除API エラー:', error)
    return NextResponse.json(
      { error: 'カルテ記録の削除に失敗しました' },
      { status: 500 }
    )
  }
}
