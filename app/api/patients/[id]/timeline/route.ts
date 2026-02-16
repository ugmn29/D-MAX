/**
 * 患者タイムラインAPI
 * Patient Timeline API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const prisma = getPrismaClient()

    // 患者の診療記録を取得（新しい順）
    const records = await prisma.medical_records.findMany({
      where: { patient_id: patientId },
      select: {
        id: true,
        visit_date: true,
        visit_type: true,
        diseases: true,
        treatments: true,
        prescriptions: true,
        subjective: true,
        objective: true,
        assessment: true,
        plan: true,
        total_points: true,
        created_at: true,
        created_by: true,
        staff_medical_records_created_byTostaff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { visit_date: 'desc' },
        { created_at: 'desc' },
      ],
      take: 50,
    })

    if (!records || records.length === 0) {
      return NextResponse.json([])
    }

    // 病名コードと処置コードの詳細情報を取得
    const diseaseCodeIds = new Set<string>()
    const treatmentCodeIds = new Set<string>()
    const medicineCodeIds = new Set<string>()

    records.forEach(record => {
      // 病名コードIDを収集
      const diseases = record.diseases as any[] | null
      if (diseases && Array.isArray(diseases)) {
        diseases.forEach((disease: any) => {
          if (disease.disease_code_id) {
            diseaseCodeIds.add(disease.disease_code_id)
          }
        })
      }

      // 処置コードIDを収集
      const treatments = record.treatments as any[] | null
      if (treatments && Array.isArray(treatments)) {
        treatments.forEach((treatment: any) => {
          if (treatment.treatment_code_id) {
            treatmentCodeIds.add(treatment.treatment_code_id)
          }
        })
      }

      // 薬剤コードIDを収集
      const prescriptions = record.prescriptions as any[] | null
      if (prescriptions && Array.isArray(prescriptions)) {
        prescriptions.forEach((prescription: any) => {
          if (prescription.medicine_code_id) {
            medicineCodeIds.add(prescription.medicine_code_id)
          }
        })
      }
    })

    // 病名コードの詳細を一括取得
    const diseaseCodesMap = new Map<string, any>()
    if (diseaseCodeIds.size > 0) {
      const diseaseCodes = await prisma.disease_codes.findMany({
        where: { id: { in: Array.from(diseaseCodeIds) } },
        select: { id: true, code: true, name: true },
      })

      diseaseCodes.forEach(dc => {
        diseaseCodesMap.set(dc.id, dc)
      })
    }

    // 処置コードの詳細を一括取得
    const treatmentCodesMap = new Map<string, any>()
    if (treatmentCodeIds.size > 0) {
      const treatmentCodes = await prisma.treatment_codes.findMany({
        where: { id: { in: Array.from(treatmentCodeIds) } },
        select: { id: true, code: true, name: true, points: true },
      })

      treatmentCodes.forEach(tc => {
        treatmentCodesMap.set(tc.id, tc)
      })
    }

    // 薬剤コードの詳細を一括取得
    const medicineCodesMap = new Map<string, any>()
    if (medicineCodeIds.size > 0) {
      const medicineCodes = await prisma.medicine_codes.findMany({
        where: { id: { in: Array.from(medicineCodeIds) } },
        select: { id: true, code: true, name: true },
      })

      medicineCodes.forEach(mc => {
        medicineCodesMap.set(mc.id, mc)
      })
    }

    // タイムラインエントリーを構築
    const timeline = records.map(record => {
      const diseases = (record.diseases as any[]) || []
      const treatments = (record.treatments as any[]) || []
      const prescriptions = (record.prescriptions as any[]) || []

      // 病名に詳細情報を追加（既存の名前を優先、なければマスターから取得）
      const enrichedDiseases = diseases.map((disease: any) => ({
        ...disease,
        disease_code: disease.disease_code || diseaseCodesMap.get(disease.disease_code_id)?.code,
        disease_name: disease.disease_name || diseaseCodesMap.get(disease.disease_code_id)?.name
      }))

      // 処置に詳細情報を追加（既存の名前を優先、なければマスターから取得）
      const enrichedTreatments = treatments.map((treatment: any) => {
        const treatmentCode = treatmentCodesMap.get(treatment.treatment_code_id)
        return {
          ...treatment,
          treatment_code: treatment.treatment_code || treatmentCode?.code,
          treatment_name: treatment.treatment_name || treatmentCode?.name,
          points: treatment.points || treatmentCode?.points || 0
        }
      })

      // 処方に詳細情報を追加（既存の名前を優先、なければマスターから取得）
      const enrichedPrescriptions = prescriptions.map((prescription: any) => ({
        ...prescription,
        medicine_name: prescription.medicine_name || medicineCodesMap.get(prescription.medicine_code_id)?.name
      }))

      return {
        id: record.id,
        visit_date: record.visit_date instanceof Date ? record.visit_date.toISOString() : record.visit_date,
        visit_type: record.visit_type,
        diseases: enrichedDiseases,
        treatments: enrichedTreatments,
        prescriptions: enrichedPrescriptions,
        subjective: record.subjective || '',
        objective: record.objective || '',
        assessment: record.assessment || '',
        plan: record.plan || '',
        total_points: record.total_points || 0,
        created_by_name: record.staff_medical_records_created_byTostaff?.name || '',
        created_at: record.created_at instanceof Date ? record.created_at.toISOString() : record.created_at
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
