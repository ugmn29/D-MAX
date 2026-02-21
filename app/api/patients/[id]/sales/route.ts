/**
 * 患者別売上履歴API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { decodeInsuranceType } from '@/lib/api/sales-import'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')

    if (!clinic_id) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    const sales = await prisma.sales.findMany({
      where: {
        patient_id: patientId,
        clinic_id
      },
      select: {
        id: true,
        sale_date: true,
        treatment_date: true,
        receipt_number: true,
        insurance_type: true,
        insurance_points: true,
        insurance_amount: true,
        patient_copay: true,
        self_pay_amount: true,
        total_amount: true,
        amount: true,
        category: true,
        payment_method: true,
        notes: true,
        treatment_menus: {
          select: { id: true, name: true }
        },
        staff: {
          select: { id: true, name: true }
        }
      },
      orderBy: { treatment_date: 'desc' }
    })

    const rows = sales.map(s => ({
      id: s.id,
      treatment_date: s.treatment_date ?? s.sale_date,
      receipt_number: s.receipt_number,
      insurance_type_raw: s.insurance_type,
      insurance_type_label: decodeInsuranceType(s.insurance_type ?? ''),
      insurance_points: s.insurance_points ?? 0,
      insurance_amount: s.insurance_amount ?? 0,
      patient_copay: s.patient_copay ?? 0,
      self_pay_amount: s.self_pay_amount ?? 0,
      total_amount: s.total_amount ?? s.amount ?? 0,
      category: s.category,
      payment_method: s.payment_method,
      notes: s.notes,
      treatment_menu_name: s.treatment_menus?.name ?? null,
      staff_name: s.staff?.name ?? null
    }))

    const totals = {
      insurance_amount: rows.reduce((sum, r) => sum + r.insurance_amount, 0),
      patient_copay: rows.reduce((sum, r) => sum + r.patient_copay, 0),
      self_pay_amount: rows.reduce((sum, r) => sum + r.self_pay_amount, 0),
      total_amount: rows.reduce((sum, r) => sum + r.total_amount, 0)
    }

    return NextResponse.json({
      success: true,
      data: rows,
      totals,
      count: rows.length
    })
  } catch (error: any) {
    console.error('患者別売上APIエラー:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
