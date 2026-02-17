/**
 * カルテ記録API Route
 * Medical Records API
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
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })
    }

    const records = await prisma.medical_records.findMany({
      where: { patient_id: patientId },
      orderBy: { visit_date: 'desc' },
      take: limit,
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error('カルテ記録取得エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - カルテ記録を保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, patient_id, ...recordData } = body

    const record = await prisma.medical_records.create({
      data: {
        clinic_id,
        patient_id,
        ...recordData,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('カルテ保存エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
