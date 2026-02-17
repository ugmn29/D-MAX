import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * Fix missing linked_field values in existing questionnaires
 *
 * This route copies linked_field values from system_questionnaire_template_questions
 * to questionnaire_questions based on question_text matching.
 */
export async function POST(req: NextRequest) {
  const prisma = getPrismaClient()

  try {
    console.log('問診票のlinked_field修正を開始します...')

    // 1. Get all questionnaires with their template_id
    const questionnaires = await prisma.questionnaires.findMany({
      select: { id: true, template_id: true, name: true, clinic_id: true },
    })

    if (!questionnaires || questionnaires.length === 0) {
      return NextResponse.json({ success: true, message: '問診票が見つかりませんでした', fixed: 0 })
    }

    console.log(`${questionnaires.length}件の問診票を取得しました`)

    let totalFixed = 0
    const errors: string[] = []

    // 2. Process each questionnaire
    for (const questionnaire of questionnaires) {
      const { template_id } = questionnaire

      if (!template_id) {
        console.log(`問診票 "${questionnaire.name}" はテンプレートIDがありません - スキップ`)
        continue
      }

      console.log(`\n処理中: ${questionnaire.name} (template: ${template_id})`)

      // 3. Get template questions with linked_field
      const templateQuestions = await prisma.system_questionnaire_template_questions.findMany({
        where: {
          template_id,
          linked_field: { not: null },
        },
        select: { question_text: true, linked_field: true, section_name: true },
      })

      if (!templateQuestions || templateQuestions.length === 0) {
        console.log(`  テンプレートにlinked_fieldが設定された質問がありません`)
        continue
      }

      console.log(`  テンプレートから ${templateQuestions.length}件のlinked_field設定を取得`)

      // 4. Get questionnaire questions
      const questions = await prisma.questionnaire_questions.findMany({
        where: { questionnaire_id: questionnaire.id },
        select: { id: true, question_text: true, section_name: true, linked_field: true },
      })

      if (!questions || questions.length === 0) {
        console.log(`  質問がありません`)
        continue
      }

      // 5. Match and update questions
      let fixed = 0
      for (const question of questions) {
        // Skip if already has linked_field
        if (question.linked_field) {
          continue
        }

        // Find matching template question by question_text and section_name
        const match = templateQuestions.find(
          tq => tq.question_text === question.question_text && tq.section_name === question.section_name
        )

        if (match && match.linked_field) {
          // Update linked_field
          try {
            await prisma.questionnaire_questions.update({
              where: { id: question.id },
              data: { linked_field: match.linked_field },
            })
            console.log(`    "${question.question_text}" -> linked_field: ${match.linked_field}`)
            fixed++
          } catch (updateError: any) {
            console.error(`    更新エラー (${question.question_text}):`, updateError)
            errors.push(`${questionnaire.name} - ${question.question_text}: 更新失敗`)
          }
        }
      }

      if (fixed > 0) {
        console.log(`  ${fixed}件のlinked_fieldを修正しました`)
        totalFixed += fixed
      } else {
        console.log(`  修正対象の質問がありませんでした`)
      }
    }

    console.log(`\n完了: 合計 ${totalFixed}件のlinked_fieldを修正しました`)

    return NextResponse.json({
      success: true,
      message: `${totalFixed}件のlinked_fieldを修正しました`,
      fixed: totalFixed,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('予期しないエラー:', error)
    return NextResponse.json(
      { success: false, error: error.message || '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
