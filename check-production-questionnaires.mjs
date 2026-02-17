/**
 * 本番環境の問診票データを確認するスクリプト
 */

const PRODUCTION_URL = 'https://shikabot-mu.vercel.app'

async function checkQuestionnaireData() {
  try {
    console.log('🔍 本番環境の問診票データを確認中...')
    console.log('URL:', PRODUCTION_URL)
    console.log('')

    const response = await fetch(`${PRODUCTION_URL}/api/questionnaires/debug`)
    const data = await response.json()

    if (response.ok && data.success) {
      console.log('✅ データ取得成功')
      console.log('')
      console.log('📊 サマリー:')
      console.log(`  - 全問診票回答数: ${data.summary.total_responses}件`)
      console.log(`  - 未連携問診票: ${data.summary.unlinked_responses}件`)
      console.log(`  - 仮登録患者の問診票: ${data.summary.temp_patient_responses}件`)
      console.log('')

      if (data.recent_responses && data.recent_responses.length > 0) {
        console.log('📋 最新の問診票回答 (最大10件):')
        data.recent_responses.forEach((r, index) => {
          console.log(`  ${index + 1}. ID: ${r.id}`)
          console.log(`     問診票ID: ${r.questionnaire_id}`)
          console.log(`     患者ID: ${r.patient_id}`)
          console.log(`     完了日時: ${r.completed_at}`)
          console.log(`     作成日時: ${r.created_at}`)
          console.log(`     回答データあり: ${r.has_response_data ? 'はい' : 'いいえ'}`)
          console.log(`     回答キー数: ${r.response_data_keys}`)
          console.log('')
        })
      }

      if (data.unlinked_responses_detail && data.unlinked_responses_detail.length > 0) {
        console.log('🔗 未連携問診票の詳細:')
        data.unlinked_responses_detail.forEach((r, index) => {
          console.log(`  ${index + 1}. ID: ${r.id}`)
          console.log(`     患者名: ${r.patient_name}`)
          console.log(`     電話番号: ${r.patient_phone}`)
          console.log(`     完了日時: ${r.completed_at}`)
          console.log('')
        })
      }

      if (data.temp_patient_responses_detail && data.temp_patient_responses_detail.length > 0) {
        console.log('👤 仮登録患者の問診票:')
        data.temp_patient_responses_detail.forEach((r, index) => {
          console.log(`  ${index + 1}. ID: ${r.id}`)
          console.log(`     患者名: ${r.patient_name}`)
          console.log(`     患者ID: ${r.patient_id}`)
          console.log(`     本登録済み: ${r.is_registered ? 'はい' : 'いいえ'}`)
          console.log(`     完了日時: ${r.completed_at}`)
          console.log('')
        })
      }

      if (data.summary.total_responses === 0) {
        console.log('⚠️  問診票データが1件も見つかりませんでした。')
        console.log('')
        console.log('考えられる原因:')
        console.log('  1. まだ問診票が送信されていない')
        console.log('  2. 問診票の送信処理でエラーが発生している')
        console.log('  3. データベースへの保存に失敗している')
        console.log('')
        console.log('次のステップ:')
        console.log('  - ブラウザで問診票を開いて送信してみる')
        console.log('  - ブラウザのコンソールログでエラーを確認')
        console.log('  - ネットワークタブで送信リクエストを確認')
      }

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
checkQuestionnaireData()
