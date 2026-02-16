import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * 問診票の実際のデータ構造を確認するためのデバッグエンドポイント
 * 使い方: /api/debug/questionnaire-data?response_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const responseId = searchParams.get('response_id') || '623ab580-0afd-42cf-8a4e-feaf4c680174'

    const prisma = getPrismaClient()

    // 1. 問診票回答データを取得
    const response = await prisma.questionnaire_responses.findUnique({
      where: { id: responseId }
    })

    if (!response) {
      return NextResponse.json({
        success: false,
        error: '問診票回答の取得に失敗',
        details: '指定されたIDの問診票回答が見つかりません'
      }, { status: 404 })
    }

    // 2. 問診票の質問定義を取得
    const questions = await prisma.questionnaire_questions.findMany({
      where: { questionnaire_id: response.questionnaire_id },
      orderBy: { sort_order: 'asc' }
    })

    if (!questions || questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: '質問定義の取得に失敗',
        details: '質問定義が見つかりません'
      }, { status: 500 })
    }

    // 3. 患者情報を取得
    let patient: any = null
    if (response.patient_id) {
      patient = await prisma.patients.findUnique({
        where: { id: response.patient_id }
      })
    }

    const responseData = response.response_data as any

    // 4. response_dataのキーと質問IDのマッピングを分析
    const responseDataKeys = Object.keys(responseData || {})
    const questionIds = questions?.map(q => q.id) || []

    // キーの形式を分析
    const keyAnalysis = {
      total_keys: responseDataKeys.length,
      sample_keys: responseDataKeys.slice(0, 10),
      is_uuid_format: responseDataKeys.some(key => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)),
      is_q_format: responseDataKeys.some(key => /^q\d+-\d+$/.test(key)),
      is_section_format: responseDataKeys.some(key => /^section\d+_q\d+$/.test(key))
    }

    // 質問とresponse_dataのマッピング状況
    const mappingAnalysis = questions?.map(q => {
      const uuidAnswer = responseData?.[q.id]
      const legacyAnswer = responseData?.[`q${Math.floor((q.sort_order || 0) / 10) + 1}-${(q.sort_order || 0) % 10 || 10}`]

      return {
        question_id: q.id,
        sort_order: q.sort_order,
        question_text: q.question_text.substring(0, 50) + '...',
        linked_field: q.linked_field,
        answer_by_uuid: uuidAnswer !== undefined ? uuidAnswer : 'NOT_FOUND',
        answer_by_legacy: legacyAnswer !== undefined ? legacyAnswer : 'NOT_FOUND',
        has_answer: !!(uuidAnswer || legacyAnswer)
      }
    })

    return NextResponse.json({
      success: true,
      response: {
        id: response.id,
        questionnaire_id: response.questionnaire_id,
        patient_id: response.patient_id,
        response_data: responseData
      },
      questions: questions?.map(q => ({
        id: q.id,
        sort_order: q.sort_order,
        section_name: q.section_name,
        question_text: q.question_text,
        linked_field: q.linked_field
      })),
      patient: patient ? {
        id: patient.id,
        name: `${patient.last_name} ${patient.first_name}`,
        birth_date: patient.birth_date,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        allergies: patient.allergies,
        medical_history: patient.medical_history,
        medications: patient.medications,
        is_registered: patient.is_registered
      } : null,
      analysis: {
        key_analysis: keyAnalysis,
        mapping_analysis: mappingAnalysis,
        questions_with_linked_field: questions?.filter(q => q.linked_field).length || 0,
        total_questions: questions?.length || 0
      }
    })

  } catch (error: any) {
    console.error('デバッグAPIエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'デバッグAPIエラー',
      details: error.message
    }, { status: 500 })
  }
}
