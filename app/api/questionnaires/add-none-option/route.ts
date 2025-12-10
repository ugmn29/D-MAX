import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function POST() {
  try {
    const supabase = getSupabaseClient()

    console.log('📝 マイグレーション実行中: 「該当する項目」に「何も該当しない」を追加')

    // 1. system_questionnaire_template_questionsテーブルを更新
    console.log('1️⃣ システムテンプレートを更新中...')
    const { data: systemUpdate, error: systemError } = await supabase
      .from('system_questionnaire_template_questions')
      .update({
        options: [
          "舌や歯茎に触れると吐き気が出やすい",
          "むせやすい",
          "口を長時間開けていられない",
          "口を大きく開けられない",
          "椅子を倒すのがツラい",
          "宗教・思想的観点から使用できない医療製品がある",
          "小児や障がいをお持ちの方で、安全のため身体を抑制する必要がある",
          "何も該当しない"
        ]
      })
      .eq('template_id', '00000000-0000-0000-0000-000000000001')
      .eq('section_name', '治療の希望')
      .eq('question_text', '該当する項目（複数選択可）')
      .eq('sort_order', 305)
      .select()

    if (systemError) {
      console.error('❌ システムテンプレート更新エラー:', systemError)
      return NextResponse.json({
        success: false,
        error: 'システムテンプレート更新失敗',
        details: systemError
      }, { status: 500 })
    }

    console.log('✅ システムテンプレート更新成功:', systemUpdate)

    // 2. 標準問診表テンプレートを使用している全クリニックの問診表を取得
    console.log('2️⃣ 標準問診表を使用しているクリニックを検索中...')
    const { data: questionnaires, error: questionnaireError } = await supabase
      .from('questionnaires')
      .select('id, clinic_id, name')
      .eq('template_id', '00000000-0000-0000-0000-000000000001')

    if (questionnaireError) {
      console.error('❌ 問診表検索エラー:', questionnaireError)
      return NextResponse.json({
        success: false,
        error: '問診表検索失敗',
        details: questionnaireError
      }, { status: 500 })
    }

    console.log(`✅ ${questionnaires?.length || 0}件の問診表が見つかりました`)

    const updateResults = []

    if (questionnaires && questionnaires.length > 0) {
      // 3. 各問診表の質問を更新
      console.log('3️⃣ クリニック問診表の質問を更新中...')

      for (const questionnaire of questionnaires) {
        console.log(`  📋 問診表「${questionnaire.name}」(ID: ${questionnaire.id})を更新中...`)

        const { data: updateResult, error: updateError } = await supabase
          .from('questionnaire_questions')
          .update({
            options: [
              "舌や歯茎に触れると吐き気が出やすい",
              "むせやすい",
              "口を長時間開けていられない",
              "口を大きく開けられない",
              "椅子を倒すのがツラい",
              "宗教・思想的観点から使用できない医療製品がある",
              "小児や障がいをお持ちの方で、安全のため身体を抑制する必要がある",
              "何も該当しない"
            ]
          })
          .eq('questionnaire_id', questionnaire.id)
          .eq('section_name', '治療の希望')
          .eq('question_text', '該当する項目（複数選択可）')
          .select()

        if (updateError) {
          console.error(`  ❌ 更新エラー (問診表ID: ${questionnaire.id}):`, updateError)
          updateResults.push({
            questionnaireId: questionnaire.id,
            questionnaireName: questionnaire.name,
            success: false,
            error: updateError
          })
        } else {
          console.log(`  ✅ 更新成功 (${updateResult?.length || 0}件の質問を更新)`)
          updateResults.push({
            questionnaireId: questionnaire.id,
            questionnaireName: questionnaire.name,
            success: true,
            updatedCount: updateResult?.length || 0
          })
        }
      }
    }

    console.log('🎉 マイグレーション完了！')

    return NextResponse.json({
      success: true,
      message: '「該当する項目」に「何も該当しない」が追加されました',
      systemTemplateUpdated: !!systemUpdate,
      questionnairesFound: questionnaires?.length || 0,
      updateResults
    })

  } catch (error: any) {
    console.error('❌ マイグレーション実行エラー:', error)
    return NextResponse.json({
      success: false,
      error: 'マイグレーション実行エラー',
      details: error.message
    }, { status: 500 })
  }
}
