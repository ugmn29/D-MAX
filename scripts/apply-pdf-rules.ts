/**
 * PDFルールを診療行為マスターに適用
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('📋 PDFルールを適用中...\n')

  try {
    // SQLファイルを読み込み
    const sqlPath = path.join(process.cwd(), 'supabase/migrations/2025-11-12_add_pdf_detailed_rules.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // BEGIN/COMMITを除去して、各UPDATE文を実行
    const statements = sql
      .replace(/BEGIN;/g, '')
      .replace(/COMMIT;/g, '')
      .replace(/-- .*$/gm, '') // コメント削除
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.startsWith('UPDATE'))

    console.log(`${statements.length}個のUPDATE文を実行します...\n`)

    let successCount = 0
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })

      if (!error) {
        successCount++
      }
    }

    console.log(`\n✅ PDFルール適用完了！(${successCount}/${statements.length}件成功)\n`)

    // 確認クエリ
    const { data, error } = await supabase
      .from('treatment_codes')
      .select('code, name, points, metadata')
      .not('metadata->addition_rules', 'is', null)
      .limit(5)

    if (!error && data) {
      console.log('📊 適用されたルールのサンプル:')
      data.forEach(row => {
        console.log(`  ${row.code} - ${row.name} (${row.points}点)`)
      })
    }

  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    process.exit(1)
  }
}

main()
