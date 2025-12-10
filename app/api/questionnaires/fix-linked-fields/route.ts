import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

/**
 * Fix missing linked_field values in existing questionnaires
 *
 * This route copies linked_field values from system_questionnaire_template_questions
 * to questionnaire_questions based on question_text matching.
 */
export async function POST(req: NextRequest) {
  const client = getSupabaseClient()

  try {
    console.log('🔧 問診票のlinked_field修正を開始します...')

    // 1. Get all questionnaires with their template_id
    const { data: questionnaires, error: qError } = await client
      .from('questionnaires')
      .select('id, template_id, name, clinic_id')

    if (qError) {
      console.error('❌ 問診票取得エラー:', qError)
      return NextResponse.json({ success: false, error: qError.message }, { status: 500 })
    }

    if (!questionnaires || questionnaires.length === 0) {
      return NextResponse.json({ success: true, message: '問診票が見つかりませんでした', fixed: 0 })
    }

    console.log(`✅ ${questionnaires.length}件の問診票を取得しました`)

    let totalFixed = 0
    const errors: string[] = []

    // 2. Process each questionnaire
    for (const questionnaire of questionnaires) {
      const { template_id } = questionnaire

      if (!template_id) {
        console.log(`⚠️  問診票 "${questionnaire.name}" はテンプレートIDがありません - スキップ`)
        continue
      }

      console.log(`\n処理中: ${questionnaire.name} (template: ${template_id})`)

      // 3. Get template questions with linked_field
      const { data: templateQuestions, error: tqError } = await client
        .from('system_questionnaire_template_questions')
        .select('question_text, linked_field, section_name')
        .eq('template_id', template_id)
        .not('linked_field', 'is', null)

      if (tqError) {
        console.error(`❌ テンプレート質問取得エラー (${template_id}):`, tqError)
        errors.push(`${questionnaire.name}: テンプレート質問取得失敗`)
        continue
      }

      if (!templateQuestions || templateQuestions.length === 0) {
        console.log(`  テンプレートにlinked_fieldが設定された質問がありません`)
        continue
      }

      console.log(`  テンプレートから ${templateQuestions.length}件のlinked_field設定を取得`)

      // 4. Get questionnaire questions
      const { data: questions, error: qsError } = await client
        .from('questionnaire_questions')
        .select('id, question_text, section_name, linked_field')
        .eq('questionnaire_id', questionnaire.id)

      if (qsError) {
        console.error(`❌ 質問取得エラー:`, qsError)
        errors.push(`${questionnaire.name}: 質問取得失敗`)
        continue
      }

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
          const { error: updateError } = await client
            .from('questionnaire_questions')
            .update({ linked_field: match.linked_field })
            .eq('id', question.id)

          if (updateError) {
            console.error(`    ❌ 更新エラー (${question.question_text}):`, updateError)
            errors.push(`${questionnaire.name} - ${question.question_text}: 更新失敗`)
          } else {
            console.log(`    ✓ "${question.question_text}" → linked_field: ${match.linked_field}`)
            fixed++
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

    console.log(`\n✅ 完了: 合計 ${totalFixed}件のlinked_fieldを修正しました`)

    return NextResponse.json({
      success: true,
      message: `${totalFixed}件のlinked_fieldを修正しました`,
      fixed: totalFixed,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('❌ 予期しないエラー:', error)
    return NextResponse.json(
      { success: false, error: error.message || '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
