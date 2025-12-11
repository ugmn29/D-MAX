/**
 * Supabase APIを使ってoriginal_patient_dataカラムを追加
 *
 * 実行方法:
 * source .env.local && node add-column-via-api.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 環境変数が設定されていません')
  console.error('使い方: source .env.local && node add-column-via-api.mjs')
  process.exit(1)
}

console.log('🔧 Supabaseに接続中...')
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: 'public' }
})

console.log('✅ 接続成功')
console.log('')

// まず現在のスキーマを確認
console.log('🔍 現在のテーブルスキーマを確認中...')
const { data: existingData, error: checkError } = await supabase
  .from('questionnaire_responses')
  .select('*')
  .limit(1)

if (checkError) {
  console.error('❌ テーブルアクセスエラー:', checkError.message)
  process.exit(1)
}

console.log('✅ テーブルにアクセスできました')
console.log('')

// カラムが既に存在するかチェック
if (existingData && existingData.length > 0) {
  const firstRow = existingData[0]
  if ('original_patient_data' in firstRow) {
    console.log('✅ original_patient_dataカラムは既に存在します')
    process.exit(0)
  }
}

console.log('⚠️  original_patient_dataカラムが見つかりません')
console.log('')
console.log('このカラムを追加するには、以下のいずれかの方法を使用してください:')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('方法1: Supabaseダッシュボード（推奨）')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('1. https://supabase.com/dashboard にアクセス')
console.log('2. プロジェクト obdfmwpdkwraqqqyjgwu を選択')
console.log('3. 左メニュー > SQL Editor をクリック')
console.log('4. 以下のSQLを実行:')
console.log('')
console.log('   ALTER TABLE questionnaire_responses')
console.log('   ADD COLUMN IF NOT EXISTS original_patient_data jsonb;')
console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('方法2: Supabase CLIを使用')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('マイグレーションファイルは既に存在します:')
console.log('supabase/migrations/20251210000004_add_original_patient_data_to_questionnaire_responses.sql')
console.log('')
console.log('以下のコマンドでプッシュできます:')
console.log('npx supabase db push')
console.log('')
