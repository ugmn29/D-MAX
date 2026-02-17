// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET: 患者の治療計画メモを取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // UUID形式でない場合はスキップ
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(patientId)) {
      return NextResponse.json({ treatment_memo: null })
    }

    const prisma = getPrismaClient()

    const whereClause: any = { id: patientId }
    if (clinicId) {
      whereClause.clinic_id = clinicId
    }

    const patient = await prisma.patients.findFirst({
      where: whereClause,
      select: { treatment_memo: true }
    })

    return NextResponse.json({
      treatment_memo: patient?.treatment_memo || null
    })
  } catch (error) {
    console.error('治療計画メモ取得API エラー:', error)
    return NextResponse.json({ treatment_memo: null })
  }
}

// PUT: 患者の治療計画メモを更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const body = await request.json()
    const { clinic_id, memo } = body

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    // UUID形式でない場合はスキップ
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(patientId)) {
      return NextResponse.json({ success: true })
    }

    const prisma = getPrismaClient()

    // clinic_idが指定されている場合、患者がそのクリニックに属するか確認
    if (clinic_id) {
      const existing = await prisma.patients.findFirst({
        where: { id: patientId, clinic_id }
      })
      if (!existing) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }
    }

    await prisma.patients.update({
      where: { id: patientId },
      data: {
        treatment_memo: memo,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('治療計画メモ更新API エラー:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ error: '治療計画メモの保存に失敗しました' }, { status: 500 })
  }
}
