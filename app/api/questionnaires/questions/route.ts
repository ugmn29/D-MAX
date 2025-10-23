import { NextRequest, NextResponse } from 'next/server'
import { updateQuestionnaireQuestions, type QuestionnaireQuestion } from '@/lib/api/questionnaires'

// PUT: 問診表の質問を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { questionnaire_id, questions } = body as {
      questionnaire_id: string
      questions: QuestionnaireQuestion[]
    }

    if (!questionnaire_id) {
      return NextResponse.json({ error: 'questionnaire_id is required' }, { status: 400 })
    }

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: 'questions must be an array' }, { status: 400 })
    }

    console.log('問診表の質問を更新します:', { questionnaire_id, questionsCount: questions.length })

    // 質問を更新
    await updateQuestionnaireQuestions(questionnaire_id, questions)

    console.log('問診表の質問更新が完了しました')

    return NextResponse.json({ success: true, questionsCount: questions.length })
  } catch (error) {
    console.error('問診表の質問更新APIエラー:', error)
    return NextResponse.json(
      { error: 'Failed to update questionnaire questions', details: (error as Error).message },
      { status: 500 }
    )
  }
}
