/**
 * Supabase Management APIを使って外部キーを自動追加
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
const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Supabase設定:')
console.log(`  Project: ${PROJECT_REF}`)
console.log(`  URL: ${SUPABASE_URL}`)
console.log('')

const sql = `
-- 外部キー制約を追加
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

async function addForeignKey() {
  try {
    console.log('🚀 外部キー制約を追加中...')
    console.log('')

    // Supabase REST APIのPostgREST経由で実行を試みる
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    })

    if (response.status === 404) {
      console.log('⚠️  rpc/query エンドポイントが見つかりません')
      console.log('')
      console.log('代替方法を試します: pg_net経由でのSQL実行')
      console.log('')

      // 代替: HTTP経由でSQL実行APIを呼び出す
      const altResponse = await fetch(`${SUPABASE_URL.replace('http://127.0.0.1:54321', 'https://shikabot-mu.vercel.app')}/api/migrations/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          migrationFile: '20251210000001_add_questionnaire_patient_fk.sql'
        })
      })

      const result = await altResponse.json()

      if (result.success) {
        console.log('✅ 外部キー制約の追加に成功しました！')
        console.log('')
        console.log('結果:', result)
        return true
      } else {
        console.error('❌ 外部キー制約の追加に失敗しました')
        console.error('エラー:', result.error || result.message)
        return false
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API呼び出しエラー:', response.status, response.statusText)
      console.error('詳細:', errorText)
      console.log('')
      console.log('⚠️  自動実行に失敗しました')
      console.log('')
      console.log('手動で以下のSQLを実行してください:')
      console.log('https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql/new')
      console.log('')
      console.log(sql)
      return false
    }

    const result = await response.json()
    console.log('✅ 外部キー制約の追加に成功しました！')
    console.log('')
    console.log('結果:', result)
    return true

  } catch (error) {
    console.error('❌ 予期しないエラー:', error.message)
    console.log('')
    console.log('最終手段: Supabase SQL Editorで手動実行')
    console.log('https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql/new')
    console.log('')
    console.log(sql)
    return false
  }
}

const success = await addForeignKey()
process.exit(success ? 0 : 1)
