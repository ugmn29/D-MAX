/**
 * 医療記録保存API
 * Medical Records API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const data = await request.json()
    const prisma = getPrismaClient()

    // Get the first staff member as default created_by if not provided
    let createdBy = data.created_by
    if (!createdBy) {
      const staffData = await prisma.staff.findFirst({
        select: { id: true },
      })

      if (staffData) {
        createdBy = staffData.id
      }
    }

    // 医療記録を保存 (JSONB columns for diseases, treatments, prescriptions)
    const record = await prisma.medical_records.create({
      data: {
        patient_id: patientId,
        clinic_id: data.clinic_id,
        visit_date: data.visit_date,
        visit_type: data.visit_type,
        subjective: data.subjective || '',
        objective: data.objective || '',
        assessment: data.assessment || '',
        plan: data.plan || '',
        total_points: data.total_points || 0,
        diseases: data.diseases || [],
        treatments: data.treatments || [],
        prescriptions: data.prescriptions || [],
        self_pay_items: data.self_pay_items || [],
        created_by: createdBy,
        updated_by: createdBy,
      },
    })

    const converted = convertDatesToStrings(record, ['visit_date', 'created_at', 'updated_at'])

    return NextResponse.json({ success: true, record: converted })
  } catch (error) {
    console.error('医療記録API全体エラー:', error)
    return NextResponse.json(
      { error: '医療記録の保存中にエラーが発生しました', details: String(error) },
      { status: 500 }
    )
  }
}
