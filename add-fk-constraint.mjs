/**
 * questionnaire_responsesテーブルに外部キー制約を追加
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// .env.localファイルから環境変数を読み込む
const envContent = fs.readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    // 引用符を削除
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    envVars[key] = value
  }
})

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'OK' : 'MISSING')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'OK' : 'MISSING')
  process.exit(1)
}

console.log('🔧 Supabase接続情報:')
console.log('  URL:', SUPABASE_URL)
console.log('')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function addForeignKey() {
  try {
    console.log('🚀 外部キー制約を追加中...')
    console.log('')

    // SQL実行用のエンドポイントを使用
    const sql = `
-- 既存の制約を削除（存在する場合）
ALTER TABLE questionnaire_responses
DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;

-- 外部キー制約を追加
ALTER TABLE questionnaire_responses
ADD CONSTRAINT questionnaire_responses_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES patients(id)
ON DELETE SET NULL;
`

    console.log('実行するSQL:')
    console.log(sql)
    console.log('')

    // REST APIを使って直接実行
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ API呼び出しエラー:', response.status, error)

      // 代替方法: マイグレーションファイルをVercelにデプロイして自動実行
      console.log('')
      console.log('📝 代替方法: マイグレーションファイルを作成してコミット')
      console.log('   GitHubにプッシュすることで、次回デプロイ時に自動実行されます')

      return false
    }

    const data = await response.json()
    console.log('✅ 外部キー制約の追加に成功しました!')
    console.log('')
    console.log('結果:', data)

    return true

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    return false
  }
}

// 実行
const success = await addForeignKey()

if (!success) {
  console.log('')
  console.log('⚠️  自動実行に失敗したため、マイグレーションファイルをGitにコミットします')
  console.log('   これにより、Vercelの次回デプロイ時に自動実行されます')
}

process.exit(success ? 0 : 1)
