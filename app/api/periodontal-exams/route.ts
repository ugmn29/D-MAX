import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'
import { NextRequest, NextResponse } from 'next/server'

// POST - 歯周検査を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patient_id, clinic_id, examination_date, examiner_id, measurement_type, examination_phase, notes, tooth_data } = body
    const prisma = getPrismaClient()

    // 歯周検査レコードを作成
    const exam = await prisma.periodontal_examinations.create({
      data: {
        patient_id,
        clinic_id,
        examination_date: examination_date ? new Date(examination_date) : new Date(),
        examiner_id,
        measurement_type,
        examination_phase,
        notes,
      },
    })

    // P検TODOを自動作成（examination_phaseが指定されている場合）
    if (examination_phase && ['P_EXAM_1', 'P_EXAM_2', 'P_EXAM_3', 'P_EXAM_4'].includes(examination_phase)) {
      // 既存の最大sort_orderを取得
      const existingPlan = await prisma.treatment_plans.findFirst({
        where: {
          clinic_id,
          patient_id,
        },
        orderBy: { sort_order: 'desc' },
        select: { sort_order: true },
      })

      let currentSortOrder = existingPlan ? existingPlan.sort_order : -1

      // P検の名称を決定
      const phaseNames: Record<string, string> = {
        'P_EXAM_1': 'P検①',
        'P_EXAM_2': 'P検②',
        'P_EXAM_3': 'P検③',
        'P_EXAM_4': 'P検④'
      }

      // P検TODOを作成
      try {
        await prisma.treatment_plans.create({
          data: {
            clinic_id,
            patient_id,
            treatment_content: phaseNames[examination_phase] || 'P検査',
            staff_type: 'hygienist',
            priority: 2,
            sort_order: currentSortOrder + 1,
            periodontal_phase: examination_phase,
            status: 'completed', // P検データが作成された時点で完了とみなす
            completed_at: new Date(),
            implemented_date: examination_date ? new Date(examination_date) : new Date(),
            is_memo: false
          },
        })
      } catch (planError) {
        console.error('Error creating P検 TODO:', planError)
        // P検TODO作成エラーは致命的ではないので、処理は継続
      }

      currentSortOrder++

      // P検①の場合: 初期治療TODOを自動生成
      if (examination_phase === 'P_EXAM_1') {
        const initialTreatments = [
          { content: 'Sc（スケーリング）', type: 'Sc' },
          { content: 'Poli（研磨）', type: 'Poli' },
          { content: 'TBI（ブラッシング指導）', type: 'TBI' }
        ]

        for (const treatment of initialTreatments) {
          try {
            await prisma.treatment_plans.create({
              data: {
                clinic_id,
                patient_id,
                treatment_content: treatment.content,
                staff_type: 'hygienist',
                priority: 2,
                sort_order: currentSortOrder + 1,
                periodontal_phase: 'INITIAL',
                hygienist_menu_type: treatment.type,
                status: 'planned',
                is_memo: false
              },
            })
          } catch (initialTreatmentError) {
            console.error(`Error creating ${treatment.type} TODO:`, initialTreatmentError)
          }
          currentSortOrder++
        }
      }
    }

    // 歯牙データを作成
    if (tooth_data && tooth_data.length > 0) {
      const toothDataWithExamId = tooth_data.map((tooth: any) => ({
        ...tooth,
        examination_id: exam.id,
      }))

      try {
        const toothDataResult = await Promise.all(
          toothDataWithExamId.map((tooth: any) =>
            prisma.periodontal_tooth_data.create({ data: tooth })
          )
        )

        const examConverted = convertDatesToStrings(exam, ['examination_date', 'created_at', 'updated_at'])
        const toothConverted = toothDataResult.map(t =>
          convertDatesToStrings(t, ['created_at', 'updated_at'])
        )

        return NextResponse.json({
          ...examConverted,
          tooth_data: toothConverted,
        })
      } catch (toothError) {
        console.error('Error creating tooth data:', toothError)
        // エラーが発生した場合、検査レコードも削除
        await prisma.periodontal_examinations.delete({ where: { id: exam.id } })
        return NextResponse.json({ error: String(toothError) }, { status: 500 })
      }
    }

    const examConverted = convertDatesToStrings(exam, ['examination_date', 'created_at', 'updated_at'])
    return NextResponse.json(examConverted)
  } catch (error) {
    console.error('Error in POST /api/periodontal-exams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - 患者の歯周検査一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const exams = await prisma.periodontal_examinations.findMany({
      where: { patient_id: patientId },
      orderBy: { examination_date: 'desc' },
    })

    // 各検査の歯牙データを取得
    const examsWithToothData = await Promise.all(
      exams.map(async (exam) => {
        const toothData = await prisma.periodontal_tooth_data.findMany({
          where: { examination_id: exam.id },
          orderBy: { tooth_number: 'asc' },
        })

        const examConverted = convertDatesToStrings(exam, ['examination_date', 'created_at', 'updated_at'])
        const toothConverted = toothData.map(t =>
          convertDatesToStrings(t, ['created_at', 'updated_at'])
        )

        return {
          ...examConverted,
          tooth_data: toothConverted,
        }
      })
    )

    return NextResponse.json(examsWithToothData)
  } catch (error) {
    console.error('Error in GET /api/periodontal-exams:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
