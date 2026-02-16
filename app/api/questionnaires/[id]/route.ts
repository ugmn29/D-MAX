import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/questionnaires/[id]
 * 問診表をIDで直接取得（公開ページ用 - clinic_id不要）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionnaireId } = await params
    const prisma = getPrismaClient()

    const questionnaire = await prisma.questionnaires.findUnique({
      where: { id: questionnaireId },
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
      }
    })

    if (!questionnaire) {
      return NextResponse.json(
        { error: '問診表が見つかりません' },
        { status: 404 }
      )
    }

    const result = {
      ...convertDatesToStrings(questionnaire, ['created_at', 'updated_at']),
      questions: questionnaire.questionnaire_questions || []
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('問診表取得エラー:', error)
    return NextResponse.json(
      { error: '問診表の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/questionnaires/[id]
 * 問診表を更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionnaireId } = await params
    const prisma = getPrismaClient()
    const body = await request.json()

    const updateData: any = {
      updated_at: new Date()
    }

    if (body.name) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const questionnaire = await prisma.questionnaires.update({
      where: {
        id: questionnaireId
      },
      data: updateData
    })

    const questionnaireWithStringDates = convertDatesToStrings(questionnaire, ['created_at', 'updated_at'])

    return NextResponse.json(questionnaireWithStringDates)
  } catch (error) {
    console.error('問診表更新エラー:', error)
    return NextResponse.json(
      { error: '問診表の更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/questionnaires/[id]
 * 問診表を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionnaireId } = await params
    const prisma = getPrismaClient()

    await prisma.questionnaires.delete({
      where: {
        id: questionnaireId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('問診表削除エラー:', error)
    return NextResponse.json(
      { error: '問診表の削除に失敗しました' },
      { status: 500 }
    )
  }
}
