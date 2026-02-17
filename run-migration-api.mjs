/**
 * APIエンドポイント経由でマイグレーションを実行
 */

const PRODUCTION_URL = 'https://shikabot-mu.vercel.app'
const MIGRATION_FILE = '20251210000001_add_questionnaire_patient_fk.sql'

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
