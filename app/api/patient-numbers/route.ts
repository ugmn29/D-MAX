import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * GET /api/patient-numbers
 * 患者番号関連の操作
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const action = searchParams.get('action')
    const patientNumber = searchParams.get('patient_number')
    const startFrom = searchParams.get('start_from')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    if (action === 'check_exists' && patientNumber) {
      const patients = await prisma.patients.findMany({
        where: {
          clinic_id: clinicId,
          patient_number: parseInt(patientNumber, 10)
        },
        select: { id: true },
        take: 1
      })
      return NextResponse.json({ exists: patients.length > 0 })
    }

    if (action === 'next_available') {
      const from = parseInt(startFrom || '10000', 10)
      const patients = await prisma.patients.findMany({
        where: {
          clinic_id: clinicId,
          patient_number: { gte: from }
        },
        select: { patient_number: true },
        orderBy: { patient_number: 'desc' },
        take: 1
      })
      const nextNumber = (patients[0]?.patient_number ?? from - 1) + 1
      return NextResponse.json({ next_number: nextNumber })
    }

    if (action === 'check_multiple') {
      const numbers = searchParams.get('numbers')
      if (!numbers) {
        return NextResponse.json({ duplicates: [] })
      }
      const numberArray = numbers.split(',').map(n => parseInt(n, 10))
      const patients = await prisma.patients.findMany({
        where: {
          clinic_id: clinicId,
          patient_number: { in: numberArray }
        },
        select: { patient_number: true }
      })
      return NextResponse.json({
        duplicates: patients.map(p => p.patient_number)
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('患者番号操作エラー:', error)
    return NextResponse.json(
      { error: '患者番号の操作に失敗しました' },
      { status: 500 }
    )
  }
}
