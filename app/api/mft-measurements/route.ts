import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

function calculateBmi(height?: number | null, weight?: number | null): number | null {
  if (!height || !weight || height <= 0) return null
  const heightInMeters = height / 100
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10
}

// GET /api/mft-measurements?patient_id=xxx
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })
    }

    const data = await prisma.mft_measurements.findMany({
      where: { patient_id: patientId },
      orderBy: { measurement_date: 'desc' }
    })

    return NextResponse.json(data.map(d => convertDatesToStrings(d, ['measurement_date', 'created_at', 'updated_at'])))
  } catch (error) {
    console.error('MFT測定記録取得エラー:', error)
    return NextResponse.json({ error: 'MFT測定記録の取得に失敗しました' }, { status: 500 })
  }
}

// POST /api/mft-measurements - Create
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const bmi = calculateBmi(body.height, body.weight)

    const data = await prisma.mft_measurements.create({
      data: {
        ...body,
        bmi,
        measurement_date: body.measurement_date ? new Date(body.measurement_date) : new Date()
      }
    })

    return NextResponse.json(convertDatesToStrings(data, ['measurement_date', 'created_at', 'updated_at']))
  } catch (error) {
    console.error('MFT測定記録作成エラー:', error)
    return NextResponse.json({ error: 'MFT測定記録の作成に失敗しました' }, { status: 500 })
  }
}

// PUT /api/mft-measurements - Update
export async function PUT(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { id, ...input } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    let updateData: any = { ...input, updated_at: new Date() }

    if (input.height !== undefined || input.weight !== undefined) {
      const current = await prisma.mft_measurements.findUnique({
        where: { id },
        select: { height: true, weight: true }
      })
      const height = input.height !== undefined ? input.height : (current?.height ? Number(current.height) : null)
      const weight = input.weight !== undefined ? input.weight : (current?.weight ? Number(current.weight) : null)
      updateData.bmi = calculateBmi(height, weight)
    }

    if (updateData.measurement_date) {
      updateData.measurement_date = new Date(updateData.measurement_date)
    }

    const data = await prisma.mft_measurements.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(convertDatesToStrings(data, ['measurement_date', 'created_at', 'updated_at']))
  } catch (error) {
    console.error('MFT測定記録更新エラー:', error)
    return NextResponse.json({ error: 'MFT測定記録の更新に失敗しました' }, { status: 500 })
  }
}

// DELETE /api/mft-measurements?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.mft_measurements.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('MFT測定記録削除エラー:', error)
    return NextResponse.json({ error: 'MFT測定記録の削除に失敗しました' }, { status: 500 })
  }
}
