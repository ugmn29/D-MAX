// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET: 患者の希望連絡手段を取得
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
      select: { preferred_contact_method: true }
    })

    if (!patient) {
      return NextResponse.json({ preferred_contact_method: null })
    }

    return NextResponse.json({ preferred_contact_method: patient.preferred_contact_method })
  } catch (error) {
    console.error('連絡手段取得API エラー:', error)
    return NextResponse.json({ preferred_contact_method: null })
  }
}

// PUT: 患者の希望連絡手段を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const body = await request.json()
    const { contact_method } = body

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    await prisma.patients.update({
      where: { id: patientId },
      data: {
        preferred_contact_method: contact_method,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('連絡手段更新API エラー:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
