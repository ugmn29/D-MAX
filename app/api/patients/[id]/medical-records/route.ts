/**
 * 医療記録保存API
 * Medical Records API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const data = await request.json()

    // Get the first staff member as default created_by if not provided
    let createdBy = data.created_by
    if (!createdBy) {
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .limit(1)
        .single()

      if (staffData) {
        createdBy = staffData.id
      }
    }

    // 医療記録を保存 (JSONB columns for diseases, treatments, prescriptions)
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .insert({
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
      })
      .select()
      .single()

    if (recordError) {
      console.error('医療記録保存エラー:', recordError)
      return NextResponse.json(
        { error: '医療記録の保存に失敗しました', details: recordError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('医療記録API全体エラー:', error)
    return NextResponse.json(
      { error: '医療記録の保存中にエラーが発生しました', details: String(error) },
      { status: 500 }
    )
  }
}
