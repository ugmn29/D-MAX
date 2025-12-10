/**
 * 外部キー制約を追加するマイグレーションスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 環境変数から取得
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 環境変数が設定されていません')
  console.error('必要な環境変数: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔧 Supabase接続情報:')
console.log('  URL:', SUPABASE_URL)
console.log('')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function runMigration() {
  try {
    console.log('📋 マイグレーションファイルを読み込み中...')

    const migrationPath = join(__dirname, 'supabase/migrations/20251210000001_add_questionnaire_patient_fk.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('✅ マイグレーションファイル読み込み完了')
    console.log('')
    console.log('🚀 マイグレーション実行中...')
    console.log('')

    // SQLを実行（複数のステートメントを含む場合があるため、rpcを使用）
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async (err) => {
      // exec_sql関数が存在しない場合は、直接PostgreSQL経由で実行
      console.log('⚠️  rpc経由での実行に失敗、直接実行を試みます...')

      // psql経由で実行する方法を表示
      console.log('')
      console.log('以下のコマンドを実行してください:')
      console.log('')
      console.log('PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \\')
      console.log(`  "postgresql://postgres.obdfmwpdkwraqqqyjgwu:$SUPABASE_DB_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres" \\`)
      console.log(`  -f supabase/migrations/20251210000001_add_questionnaire_patient_fk.sql`)
      console.log('')

      return { data: null, error: err }
    })

    if (error) {
      console.error('❌ マイグレーション実行エラー:', error)
      console.log('')
      console.log('📝 手動実行手順:')
      console.log('1. .env.localファイルでSUPABASE_DB_PASSWORDを確認')
      console.log('2. 以下のコマンドを実行:')
      console.log('')
      console.log('source .env.local')
      console.log('PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \\')
      console.log(`  "postgresql://postgres.obdfmwpdkwraqqqyjgwu:$SUPABASE_DB_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres" \\`)
      console.log(`  -f supabase/migrations/20251210000001_add_questionnaire_patient_fk.sql`)
      process.exit(1)
    }

    console.log('✅ マイグレーション実行成功!')
    console.log('')

    if (data) {
      console.log('📊 実行結果:', data)
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
    process.exit(1)
  }
}

runMigration()
