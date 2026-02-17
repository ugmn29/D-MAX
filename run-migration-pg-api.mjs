/**
 * pgライブラリを使うAPIエンドポイント経由でマイグレーションを実行
 */

const PRODUCTION_URL = 'https://shikabot-mu.vercel.app'
const MIGRATION_FILE = '20251210000004_add_original_patient_data_to_questionnaire_responses.sql'

async function runMigration() {
  try {
    console.log('🚀 マイグレーション実行開始')
    console.log(`環境: ${PRODUCTION_URL}`)
    console.log(`ファイル: ${MIGRATION_FILE}`)
    console.log(`エンドポイント: /api/migrations/run-pg (pgライブラリ使用)`)
    console.log('')

    const response = await fetch(`${PRODUCTION_URL}/api/migrations/run-pg`, {
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
      console.log('メッセージ:', result.message)
      if (result.result) {
        console.log('実行結果:')
        console.log(`  コマンド: ${result.result.command}`)
        console.log(`  影響行数: ${result.result.rowCount}`)
      }
      console.log('')
      console.log('🎉 original_patient_dataカラムが正常に追加されました!')
      console.log('')
      console.log('次のステップ:')
      console.log('1. 確認: source .env.local && node check-original-data.mjs')
      console.log('2. 新しい予約を作成してテストしてください')
      console.log('3. 問診票を連携して、その後連携解除してみてください')
      console.log('4. 患者名が元の予約時の名前に戻ることを確認してください')
    } else {
      console.error('❌ マイグレーション実行失敗')
      console.error('')
      console.error('エラー:', result.error)
      if (result.detail) {
        console.error('詳細:', result.detail)
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
