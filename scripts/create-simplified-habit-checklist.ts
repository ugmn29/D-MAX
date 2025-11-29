/**
 * 習慣チェック表から、C分類にマッピングされている質問だけを抽出して
 * 「習慣チェック表 簡潔」という新しい問診票を作成するスクリプト
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CLINIC_ID = '11111111-1111-1111-1111-111111111111'

async function createSimplifiedHabitChecklist() {
  console.log('習慣チェック表 簡潔を作成します...')

  try {
    // 1. 元の「習慣チェック表」を取得
    const { data: originalQuestionnaire, error: qError } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('clinic_id', CLINIC_ID)
      .eq('name', '習慣チェック表')
      .single()

    if (qError || !originalQuestionnaire) {
      throw new Error('習慣チェック表が見つかりません')
    }

    console.log('元の習慣チェック表を取得しました:', originalQuestionnaire.id)

    // 2. 元の習慣チェック表の質問を取得
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questionnaire_questions')
      .select('*')
      .eq('questionnaire_id', originalQuestionnaire.id)
      .order('sort_order')

    if (questionsError || !allQuestions) {
      throw new Error('質問の取得に失敗しました')
    }

    console.log(`全質問数: ${allQuestions.length}`)

    // 3. C分類マッピング情報を取得
    const { data: mappings, error: mappingError } = await supabase
      .from('c_classification_question_mapping')
      .select('section_name, question_text, c_classification_item')

    if (mappingError || !mappings) {
      throw new Error('C分類マッピングの取得に失敗しました')
    }

    console.log(`C分類マッピング数: ${mappings.length}`)

    // 4. マッピングされている質問を特定
    const mappedQuestionKeys = new Set(
      mappings.map(m => `${m.section_name}::${m.question_text}`)
    )

    const filteredQuestions = allQuestions.filter(q => {
      const key = `${q.section_name}::${q.question_text}`
      return mappedQuestionKeys.has(key)
    })

    console.log(`C分類にマッピングされている質問数: ${filteredQuestions.length}`)

    // 5. 「習慣チェック表 簡潔」が既に存在するか確認
    const { data: existingSimplified } = await supabase
      .from('questionnaires')
      .select('id')
      .eq('clinic_id', CLINIC_ID)
      .eq('name', '習慣チェック表 簡潔')
      .single()

    let newQuestionnaireId: string

    if (existingSimplified) {
      console.log('既存の「習慣チェック表 簡潔」を削除します...')

      // 既存の質問を削除
      await supabase
        .from('questionnaire_questions')
        .delete()
        .eq('questionnaire_id', existingSimplified.id)

      // 既存の問診票を削除
      await supabase
        .from('questionnaires')
        .delete()
        .eq('id', existingSimplified.id)
    }

    // 6. 新しい問診票を作成
    const { data: newQuestionnaire, error: createError } = await supabase
      .from('questionnaires')
      .insert({
        clinic_id: CLINIC_ID,
        name: '習慣チェック表 簡潔',
        description: '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError || !newQuestionnaire) {
      throw new Error('新しい問診票の作成に失敗しました: ' + createError?.message)
    }

    newQuestionnaireId = newQuestionnaire.id
    console.log('新しい問診票を作成しました:', newQuestionnaireId)

    // 7. フィルタリングした質問を新しい問診票にコピー
    const questionsToInsert = filteredQuestions.map((q, index) => ({
      questionnaire_id: newQuestionnaireId,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      is_required: q.is_required,
      section_name: q.section_name,
      sort_order: index + 1,
      conditional_logic: q.conditional_logic,
      linked_field: (q as any).linked_field,
      is_hidden: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('questionnaire_questions')
      .insert(questionsToInsert)

    if (insertError) {
      throw new Error('質問の挿入に失敗しました: ' + insertError.message)
    }

    console.log(`${questionsToInsert.length}個の質問を挿入しました`)

    // 8. セクションごとの質問数を表示
    const sectionCounts = filteredQuestions.reduce((acc, q) => {
      acc[q.section_name] = (acc[q.section_name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\nセクション別質問数:')
    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`  ${section}: ${count}問`)
    })

    console.log('\n✅ 習慣チェック表 簡潔の作成が完了しました！')
    console.log(`   問診票ID: ${newQuestionnaireId}`)
    console.log(`   質問数: ${filteredQuestions.length}問`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  }
}

// スクリプト実行
createSimplifiedHabitChecklist()
  .then(() => {
    console.log('\n処理が完了しました')
    process.exit(0)
  })
  .catch((error) => {
    console.error('処理が失敗しました:', error)
    process.exit(1)
  })
