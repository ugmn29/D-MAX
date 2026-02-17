// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET: 患者の自動リマインド設定を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        auto_reminder_enabled: true,
        auto_reminder_custom_intervals: true
      }
    })

    if (!patient) {
      return NextResponse.json({
        enabled: true,
        custom_intervals: null
      })
    }

    return NextResponse.json({
      enabled: patient.auto_reminder_enabled ?? true,
      custom_intervals: patient.auto_reminder_custom_intervals
    })
  } catch (error) {
    console.error('自動リマインド設定取得API エラー:', error)
    return NextResponse.json({
      enabled: true,
      custom_intervals: null
    })
  }
}

// PUT: 患者の自動リマインド設定を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const body = await request.json()
    const { enabled, custom_intervals } = body

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    const updateData: any = {
      auto_reminder_enabled: enabled,
      updated_at: new Date()
    }

    if (custom_intervals !== undefined) {
      updateData.auto_reminder_custom_intervals = custom_intervals
    }

    await prisma.patients.update({
      where: { id: patientId },
      data: updateData
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('自動リマインド設定更新API エラー:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
