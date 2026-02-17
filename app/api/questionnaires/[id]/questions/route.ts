import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * PUT /api/questionnaires/[id]/questions
 * 問診表の質問を一括更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionnaireId } = await params
    const prisma = getPrismaClient()
    const body = await request.json()
    const { questions } = body

    if (!Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'questions must be an array' },
        { status: 400 }
      )
    }

    // トランザクションで既存の質問を削除 + 新規質問を挿入
    await prisma.$transaction(async (tx) => {
      // 既存の質問を削除
      await tx.questionnaire_questions.deleteMany({
        where: {
          questionnaire_id: questionnaireId
        }
      })

      // 新しい質問を挿入
      if (questions.length > 0) {
        const questionsToInsert = questions.map((q: any) => {
          const questionData: any = {
            questionnaire_id: questionnaireId,
            section_name: q.section_name,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options || [],
            is_required: q.is_required,
            conditional_logic: q.conditional_logic,
            sort_order: q.sort_order,
            linked_field: q.linked_field || null,
            is_hidden: q.is_hidden || false
          }

          // temp-で始まるIDまたはIDがない場合は、DBに自動生成させる
          if (q.id && !q.id.toString().startsWith('temp-')) {
            questionData.id = q.id
          }

          return questionData
        })

        await tx.questionnaire_questions.createMany({
          data: questionsToInsert
        })
      }
    })

    return NextResponse.json({ success: true, count: questions.length })
  } catch (error) {
    console.error('質問更新エラー:', error)
    return NextResponse.json(
      { error: '質問の更新に失敗しました' },
      { status: 500 }
    )
  }
}
