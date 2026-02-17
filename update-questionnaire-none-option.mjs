/**
 * 本番環境の問診表に「何も該当しない」選択肢を追加するスクリプト
 */

const PRODUCTION_URL = 'https://shikabot-mu.vercel.app'

async function updateQuestionnaireNoneOption() {
  try {
    console.log('📝 問診表を更新中...')
    console.log('URL:', PRODUCTION_URL)
    console.log('')
    console.log('「該当する項目」に「何も該当しない」選択肢を追加します...')
    console.log('')

    const response = await fetch(`${PRODUCTION_URL}/api/questionnaires/add-none-option`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()

    if (response.ok && data.success) {
      console.log('✅ 更新が成功しました！')
      console.log('')
      console.log('📊 更新結果:')
      console.log(`  - システムテンプレート更新: ${data.systemTemplateUpdated ? '成功' : '失敗'}`)
      console.log(`  - 検索された問診表数: ${data.questionnairesFound}件`)
      console.log('')

      if (data.updateResults && data.updateResults.length > 0) {
        console.log('📋 クリニック問診表の更新結果:')
        data.updateResults.forEach((result, index) => {
          if (result.success) {
            console.log(`  ${index + 1}. ✅ ${result.questionnaireName}: ${result.updatedCount}件の質問を更新`)
          } else {
            console.log(`  ${index + 1}. ❌ ${result.questionnaireName}: 更新失敗`)
          }
        })
      }

      console.log('')
      console.log('🎉 「該当する項目」に以下の選択肢が追加されました:')
      console.log('  - 舌や歯茎に触れると吐き気が出やすい')
      console.log('  - むせやすい')
      console.log('  - 口を長時間開けていられない')
      console.log('  - 口を大きく開けられない')
      console.log('  - 椅子を倒すのがツラい')
      console.log('  - 宗教・思想的観点から使用できない医療製品がある')
      console.log('  - 小児や障がいをお持ちの方で、安全のため身体を抑制する必要がある')
      console.log('  - 何も該当しない ← NEW!')

    } else {
      console.error('❌ エラーが発生しました:')
      console.error('ステータス:', response.status)
      console.error('レスポンス:', JSON.stringify(data, null, 2))
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ 予期しないエラーが発生しました:', error.message)
    console.error('')
    console.error('詳細:', error)
    process.exit(1)
  }
}

// 実行
updateQuestionnaireNoneOption()
