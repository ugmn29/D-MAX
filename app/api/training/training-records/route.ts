import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/training-records?patient_id=xxx&clinic_id=yyy
// 患者のトレーニング実施記録を取得（トレーニング情報含む）
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patient_id')
    const clinicId = searchParams.get('clinic_id')

    if (!patientId) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })
    }

    const whereClause: any = {
      patient_id: patientId,
    }
    if (clinicId) {
      whereClause.clinic_id = clinicId
    }

    const records = await prisma.training_records.findMany({
      where: whereClause,
      include: {
        trainings: true,
      },
      orderBy: {
        performed_at: 'desc',
      },
    })

    const result = records.map((record) => ({
      training_id: record.training_id,
      completed: record.completed,
      interrupted: record.interrupted,
      performed_at: record.performed_at?.toISOString() || null,
      training_name: record.trainings?.training_name || '不明',
    }))

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('トレーニング記録取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
