/**
 * 患者タイムラインAPI
 * Patient Timeline API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params

    // 患者の診療記録を取得（新しい順）
    const { data: records, error } = await supabase
      .from('medical_records')
      .select(`
        id,
        visit_date,
        visit_type,
        diseases,
        treatments,
        prescriptions,
        subjective,
        objective,
        assessment,
        plan,
        total_points,
        created_at,
        created_by,
        staff:created_by (
          id,
          name
        )
      `)
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('診療記録取得エラー:', error)
      return NextResponse.json(
        { error: '診療記録の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!records || records.length === 0) {
      return NextResponse.json([])
    }

    // 病名コードと処置コードの詳細情報を取得
    const diseaseCodeIds = new Set<string>()
    const treatmentCodeIds = new Set<string>()
    const medicineCodeIds = new Set<string>()

    records.forEach(record => {
      // 病名コードIDを収集
      if (record.diseases && Array.isArray(record.diseases)) {
        record.diseases.forEach((disease: any) => {
          if (disease.disease_code_id) {
            diseaseCodeIds.add(disease.disease_code_id)
          }
        })
      }

      // 処置コードIDを収集
      if (record.treatments && Array.isArray(record.treatments)) {
        record.treatments.forEach((treatment: any) => {
          if (treatment.treatment_code_id) {
            treatmentCodeIds.add(treatment.treatment_code_id)
          }
        })
      }

      // 薬剤コードIDを収集
      if (record.prescriptions && Array.isArray(record.prescriptions)) {
        record.prescriptions.forEach((prescription: any) => {
          if (prescription.medicine_code_id) {
            medicineCodeIds.add(prescription.medicine_code_id)
          }
        })
      }
    })

    // 病名コードの詳細を一括取得
    const diseaseCodesMap = new Map<string, any>()
    if (diseaseCodeIds.size > 0) {
      const { data: diseaseCodes } = await supabase
        .from('disease_codes')
        .select('id, code, name')
        .in('id', Array.from(diseaseCodeIds))

      if (diseaseCodes) {
        diseaseCodes.forEach(dc => {
          diseaseCodesMap.set(dc.id, dc)
        })
      }
    }

    // 処置コードの詳細を一括取得
    const treatmentCodesMap = new Map<string, any>()
    if (treatmentCodeIds.size > 0) {
      const { data: treatmentCodes } = await supabase
        .from('treatment_codes')
        .select('id, code, name, points')
        .in('id', Array.from(treatmentCodeIds))

      if (treatmentCodes) {
        treatmentCodes.forEach(tc => {
          treatmentCodesMap.set(tc.id, tc)
        })
      }
    }

    // 薬剤コードの詳細を一括取得
    const medicineCodesMap = new Map<string, any>()
    if (medicineCodeIds.size > 0) {
      const { data: medicineCodes } = await supabase
        .from('medicine_codes')
        .select('id, code, name')
        .in('id', Array.from(medicineCodeIds))

      if (medicineCodes) {
        medicineCodes.forEach(mc => {
          medicineCodesMap.set(mc.id, mc)
        })
      }
    }

    // タイムラインエントリーを構築
    const timeline = records.map(record => {
      // 病名に詳細情報を追加（既存の名前を優先、なければマスターから取得）
      const enrichedDiseases = (record.diseases || []).map((disease: any) => ({
        ...disease,
        disease_code: disease.disease_code || diseaseCodesMap.get(disease.disease_code_id)?.code,
        disease_name: disease.disease_name || diseaseCodesMap.get(disease.disease_code_id)?.name
      }))

      // 処置に詳細情報を追加（既存の名前を優先、なければマスターから取得）
      const enrichedTreatments = (record.treatments || []).map((treatment: any) => {
        const treatmentCode = treatmentCodesMap.get(treatment.treatment_code_id)
        return {
          ...treatment,
          treatment_code: treatment.treatment_code || treatmentCode?.code,
          treatment_name: treatment.treatment_name || treatmentCode?.name,
          points: treatment.points || treatmentCode?.points || 0
        }
      })

      // 処方に詳細情報を追加（既存の名前を優先、なければマスターから取得）
      const enrichedPrescriptions = (record.prescriptions || []).map((prescription: any) => ({
        ...prescription,
        medicine_name: prescription.medicine_name || medicineCodesMap.get(prescription.medicine_code_id)?.name
      }))

      return {
        id: record.id,
        visit_date: record.visit_date,
        visit_type: record.visit_type,
        diseases: enrichedDiseases,
        treatments: enrichedTreatments,
        prescriptions: enrichedPrescriptions,
        subjective: record.subjective || '',
        objective: record.objective || '',
        assessment: record.assessment || '',
        plan: record.plan || '',
        total_points: record.total_points || 0,
        created_by_name: (record.staff as any)?.name || '',
        created_at: record.created_at
      }
    })

    return NextResponse.json(timeline)
  } catch (error) {
    console.error('タイムライン取得エラー:', error)
    return NextResponse.json(
      { error: 'タイムラインの取得に失敗しました' },
      { status: 500 }
    )
  }
}
