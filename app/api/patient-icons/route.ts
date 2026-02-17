// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at'] as const

// GET: 患者の特記事項アイコンを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const clinicId = searchParams.get('clinic_id')

    if (!patientId || !clinicId) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()
    const patientIcons = await prisma.patient_icons.findUnique({
      where: {
        patient_id_clinic_id: {
          patient_id: patientId,
          clinic_id: clinicId
        }
      }
    })

    if (!patientIcons) {
      return NextResponse.json(
        { error: 'Patient icons not found' },
        { status: 404 }
      )
    }

    const result = convertDatesToStrings(patientIcons, [...DATE_FIELDS])
    return NextResponse.json(result)
  } catch (error) {
    console.error('患者アイコン取得API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 患者の特記事項アイコンを保存（upsert）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { patient_id, clinic_id, icon_ids } = body

    if (!patient_id || !clinic_id) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(icon_ids)) {
      return NextResponse.json(
        { error: 'icon_ids must be an array' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()
    const patientIcons = await prisma.patient_icons.upsert({
      where: {
        patient_id_clinic_id: {
          patient_id,
          clinic_id
        }
      },
      update: {
        icon_ids,
        updated_at: new Date()
      },
      create: {
        patient_id,
        clinic_id,
        icon_ids
      }
    })

    const result = convertDatesToStrings(patientIcons, [...DATE_FIELDS])
    return NextResponse.json(result)
  } catch (error) {
    console.error('患者アイコン保存API エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: 患者の特記事項アイコンを削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const clinicId = searchParams.get('clinic_id')

    if (!patientId || !clinicId) {
      return NextResponse.json(
        { error: 'patient_id and clinic_id are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()
    await prisma.patient_icons.delete({
      where: {
        patient_id_clinic_id: {
          patient_id: patientId,
          clinic_id: clinicId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('患者アイコン削除API エラー:', error)

    // Prisma P2025エラー: Record not found
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Patient icons not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
