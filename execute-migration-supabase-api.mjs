/**
 * Supabase Management APIを使ってSQLを実行
 */

import fs from 'fs'

// .env.localファイルから環境変数を読み込む
const envContent = fs.readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    envVars[key] = value
  }
})

const PROJECT_REF = 'obdfmwpdkwraqqqyjgwu'
const SUPABASE_ACCESS_TOKEN = envVars.SUPABASE_ACCESS_TOKEN || envVars.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN または SUPABASE_SERVICE_ROLE_KEY が設定されていません')
  console.error('')
  console.error('Supabase Personal Access Tokenを取得してください:')
  console.error('https://supabase.com/dashboard/account/tokens')
  console.error('')
  console.error('.env.localに以下を追加:')
  console.error('SUPABASE_ACCESS_TOKEN=your_token_here')
  process.exit(1)
}

console.log('🔧 Supabase Management API使用')
console.log(`  Project: ${PROJECT_REF}`)
console.log('')

const sql = `
ALTER TABLE questionnaire_responses
DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;

ALTER TABLE questionnaire_responses
ADD CONSTRAINT questionnaire_responses_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES patients(id)
ON DELETE SET NULL;
`

console.log('実行するSQL:')
console.log(sql)
console.log('')

async function executeSql() {
  try {
    console.log('🚀 SQL実行中...')

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          query: sql
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API呼び出しエラー:', response.status, response.statusText)
      console.error('詳細:', errorText)
      console.error('')
      console.error('⚠️  Management APIでの実行に失敗しました')
      console.error('')
      console.error('代替方法: Supabase SQL Editorを使用')
      console.error('  https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql/new')
      console.error('')
      console.error('上記のSQLをコピペして実行してください')
      process.exit(1)
    }

    const result = await response.json()
    console.log('✅ SQL実行成功!')
    console.log('')
    console.log('結果:', result)

  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message)
    console.error('')
    console.error('代替方法: Supabase SQL Editorを使用')
    console.error('  https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql/new')
    process.exit(1)
  }
}

executeSql()
