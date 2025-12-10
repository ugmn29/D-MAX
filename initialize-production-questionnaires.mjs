/**
 * Production環境に3つのデフォルト問診表を初期化するスクリプト
 */

const PRODUCTION_URL = 'https://dmax-mu.vercel.app'
const CLINIC_ID = '11111111-1111-1111-1111-111111111111'

async function initializeQuestionnaires() {
  try {
    console.log('📋 本番環境の問診表を初期化中...')
    console.log('URL:', PRODUCTION_URL)
    console.log('Clinic ID:', CLINIC_ID)
    console.log('')

    const response = await fetch(`${PRODUCTION_URL}/api/clinic/initialize-questionnaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clinicId: CLINIC_ID
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      console.log('✅ 問診表の初期化が成功しました！')
      console.log('')
      console.log('📊 初期化されたマスタデータ:')
      console.log(`  - 問診表: ${data.details.questionnaires}件`)
      console.log(`  - スタッフ役職: ${data.details.staffPositions}件`)
      console.log(`  - キャンセル理由: ${data.details.cancelReasons}件`)
      console.log(`  - 通知テンプレート: ${data.details.notificationTemplates}件`)
      console.log('')
      console.log('🎉 問診表一覧:')
      console.log('  1. 標準問診表')
      console.log('  2. 習慣チェック表')
      console.log('  3. 簡易問診表')
      console.log('')
      console.log('これで本番環境でも問診表が使えるようになりました！')
    } else {
      console.error('❌ エラーが発生しました:')
      console.error('ステータス:', response.status)
      console.error('レスポンス:', JSON.stringify(data, null, 2))

      if (data.errors && data.errors.length > 0) {
        console.error('')
        console.error('エラー詳細:')
        data.errors.forEach((error, index) => {
          console.error(`  ${index + 1}. ${error}`)
        })
      }

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
initializeQuestionnaires()
