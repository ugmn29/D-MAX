import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/questionnaires?clinic_id=xxx
 * 問診表一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const questionnaires = await prisma.questionnaires.findMany({
      where: {
        clinic_id: clinicId
      },
      include: {
        questionnaire_questions: {
          select: {
            id: true,
            questionnaire_id: true,
            section_name: true,
            question_text: true,
            question_type: true,
            options: true,
            is_required: true,
            conditional_logic: true,
            sort_order: true,
            linked_field: true,
            is_hidden: true
          },
          orderBy: {
            sort_order: 'asc'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // questionnaire_questions を questions にマッピング
    const mappedData = questionnaires.map(q => ({
      ...convertDatesToStrings(q, ['created_at', 'updated_at']),
      questions: q.questionnaire_questions || []
    }))

    return NextResponse.json(mappedData)
  } catch (error) {
    console.error('問診表取得エラー:', error)
    return NextResponse.json(
      { error: '問診表の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/questionnaires?clinic_id=xxx
 * 問診表を作成
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, is_active } = body

    if (!name) {
      return NextResponse.json(
        { error: '問診表名は必須です' },
        { status: 400 }
      )
    }

    const questionnaire = await prisma.questionnaires.create({
      data: {
        clinic_id: clinicId,
        name,
        description: description || '',
        is_active: is_active !== undefined ? is_active : true
      }
    })

    const questionnaireWithStringDates = convertDatesToStrings(questionnaire, ['created_at', 'updated_at'])

    return NextResponse.json(questionnaireWithStringDates)
  } catch (error) {
    console.error('問診表作成エラー:', error)
    return NextResponse.json(
      { error: '問診表の作成に失敗しました' },
      { status: 500 }
    )
  }
}
