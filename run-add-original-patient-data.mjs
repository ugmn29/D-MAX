/**
 * APIエンドポイント経由でoriginal_patient_dataカラム追加マイグレーションを実行
 */

const PRODUCTION_URL = 'https://shikabot-mu.vercel.app'
const MIGRATION_FILE = '20251210000004_add_original_patient_data_to_questionnaire_responses.sql'

async function runMigration() {
  try {
    console.log('🚀 マイグレーション実行開始')
    console.log(`環境: ${PRODUCTION_URL}`)
    console.log(`ファイル: ${MIGRATION_FILE}`)
    console.log('')

    const response = await fetch(`${PRODUCTION_URL}/api/migrations/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        migrationFile: MIGRATION_FILE
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ マイグレーション実行成功!')
      console.log('')
      console.log(`成功: ${result.successCount}件`)
      console.log(`失敗: ${result.failureCount}件`)
      console.log('')

      if (result.results && result.results.length > 0) {
        console.log('📝 実行結果詳細:')
        result.results.forEach((r, i) => {
          const status = r.success ? '✅' : '❌'
          console.log(`  ${i + 1}. ${status} ${r.statement}`)
          if (r.error) {
            console.log(`     エラー: ${r.error}`)
          }
        })
      }

      console.log('')
      console.log('🎉 original_patient_dataカラムが正常に追加されました!')
      console.log('')
      console.log('次のステップ:')
      console.log('1. 新しい予約を作成してテストしてください')
      console.log('2. 問診票を連携して、その後連携解除してみてください')
      console.log('3. 患者名が元の予約時の名前に戻ることを確認してください')
    } else {
      console.error('❌ マイグレーション実行失敗')
      console.error('')
      console.error('エラー:', result.error || result.message)
      console.error('')

      if (result.results) {
        console.error('詳細:')
        result.results.forEach((r, i) => {
          if (!r.success) {
            console.error(`  ${i + 1}. ${r.statement}`)
            console.error(`     エラー: ${r.error}`)
          }
        })
      }

      process.exit(1)
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message)
    console.error('')
    console.error('詳細:', error)
    process.exit(1)
  }
}

runMigration()
