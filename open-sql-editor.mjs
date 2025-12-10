/**
 * Supabase SQL Editorを開いてSQLを自動でコピー
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const SQL = `-- 外部キー制約を追加
ALTER TABLE questionnaire_responses
DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;

ALTER TABLE questionnaire_responses
ADD CONSTRAINT questionnaire_responses_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES patients(id)
ON DELETE SET NULL;

-- 確認
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'questionnaire_responses'
  AND tc.constraint_type = 'FOREIGN KEY';`

const PROJECT_REF = 'obdfmwpdkwraqqqyjgwu'
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`

console.log('🚀 Supabase SQL Editorを開きます...')
console.log('')
console.log('URL:', SQL_EDITOR_URL)
console.log('')
console.log('以下のSQLがクリップボードにコピーされました:')
console.log('─'.repeat(60))
console.log(SQL)
console.log('─'.repeat(60))
console.log('')
console.log('手順:')
console.log('1. ブラウザでSQL Editorが開きます')
console.log('2. 貼り付け（Cmd+V または Ctrl+V）')
console.log('3. 「RUN」ボタンをクリック')
console.log('')

// クリップボードにコピー
try {
  if (process.platform === 'darwin') {
    // macOS
    await execAsync(`echo "${SQL.replace(/"/g, '\\"')}" | pbcopy`)
    console.log('✅ クリップボードにコピーしました（macOS）')
  } else if (process.platform === 'win32') {
    // Windows
    await execAsync(`echo ${SQL} | clip`)
    console.log('✅ クリップボードにコピーしました（Windows）')
  } else {
    // Linux
    await execAsync(`echo "${SQL.replace(/"/g, '\\"')}" | xclip -selection clipboard`)
    console.log('✅ クリップボードにコピーしました（Linux）')
  }
} catch (error) {
  console.log('⚠️  クリップボードへのコピーに失敗しました')
  console.log('手動でSQLをコピーしてください')
}

// ブラウザを開く
try {
  if (process.platform === 'darwin') {
    await execAsync(`open "${SQL_EDITOR_URL}"`)
  } else if (process.platform === 'win32') {
    await execAsync(`start "${SQL_EDITOR_URL}"`)
  } else {
    await execAsync(`xdg-open "${SQL_EDITOR_URL}"`)
  }
  console.log('✅ ブラウザを開きました')
} catch (error) {
  console.error('❌ ブラウザを開けませんでした')
  console.log('')
  console.log('手動で以下のURLにアクセスしてください:')
  console.log(SQL_EDITOR_URL)
}
