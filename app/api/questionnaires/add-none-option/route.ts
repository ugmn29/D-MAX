import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function POST() {
  try {
    const prisma = getPrismaClient()

    console.log('📝 マイグレーション実行中: 「該当する項目」に「何も該当しない」を追加')

    const newOptions = [
      "舌や歯茎に触れると吐き気が出やすい",
      "むせやすい",
      "口を長時間開けていられない",
      "口を大きく開けられない",
      "椅子を倒すのがツラい",
      "宗教・思想的観点から使用できない医療製品がある",
      "小児や障がいをお持ちの方で、安全のため身体を抑制する必要がある",
      "何も該当しない"
    ]

    // 1. system_questionnaire_template_questionsテーブルを更新
    console.log('1️⃣ システムテンプレートを更新中...')
    const systemUpdate = await prisma.system_questionnaire_template_questions.updateMany({
      where: {
        template_id: '00000000-0000-0000-0000-000000000001',
        section_name: '治療の希望',
        question_text: '該当する項目（複数選択可）',
        sort_order: 305
      },
      data: {
        options: newOptions
      }
    })

    console.log('✅ システムテンプレート更新成功:', systemUpdate)

    // 2. 標準問診表テンプレートを使用している全クリニックの問診表を取得
    console.log('2️⃣ 標準問診表を使用しているクリニックを検索中...')
    const questionnaires = await prisma.questionnaires.findMany({
      where: {
        template_id: '00000000-0000-0000-0000-000000000001'
      },
      select: { id: true, clinic_id: true, name: true }
    })

    console.log(`✅ ${questionnaires?.length || 0}件の問診表が見つかりました`)

    const updateResults: any[] = []

    if (questionnaires && questionnaires.length > 0) {
      // 3. 各問診表の質問を更新
      console.log('3️⃣ クリニック問診表の質問を更新中...')

      for (const questionnaire of questionnaires) {
        console.log(`  📋 問診表「${questionnaire.name}」(ID: ${questionnaire.id})を更新中...`)

        try {
          const updateResult = await prisma.questionnaire_questions.updateMany({
            where: {
              questionnaire_id: questionnaire.id,
              section_name: '治療の希望',
              question_text: '該当する項目（複数選択可）'
            },
            data: {
              options: newOptions
            }
          })

          console.log(`  ✅ 更新成功 (${updateResult?.count || 0}件の質問を更新)`)
          updateResults.push({
            questionnaireId: questionnaire.id,
            questionnaireName: questionnaire.name,
            success: true,
            updatedCount: updateResult?.count || 0
          })
        } catch (updateError: any) {
          console.error(`  ❌ 更新エラー (問診表ID: ${questionnaire.id}):`, updateError)
          updateResults.push({
            questionnaireId: questionnaire.id,
            questionnaireName: questionnaire.name,
            success: false,
            error: updateError.message
          })
        }
      }
    }

    console.log('🎉 マイグレーション完了！')

    return NextResponse.json({
      success: true,
      message: '「該当する項目」に「何も該当しない」が追加されました',
      systemTemplateUpdated: systemUpdate.count > 0,
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
