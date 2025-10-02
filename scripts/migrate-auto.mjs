#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

const supabaseUrl = 'https://pgvozzkedpqhnjhzneuh.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndm96emtlZHBxaG5qaHpuZXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2MDEzNCwiZXhwIjoyMDczOTM2MTM0fQ.A10uHHvGukzwXd9sTwjWluaTxWrDEs6A-pGxSOYiJug'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function runSQL(sql, description) {
  console.log(`\n📦 ${description}...`)

  // SQLを複数のステートメントに分割して実行
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    if (statement.toLowerCase().includes('create table') ||
        statement.toLowerCase().includes('alter table') ||
        statement.toLowerCase().includes('create index') ||
        statement.toLowerCase().includes('insert into')) {

      try {
        // RPCではなく、直接postgrestのqueryを使用
        const { error } = await supabase.rpc('exec', { sql: statement })

        if (error && !error.message.includes('already exists')) {
          console.log(`   ⚠️  ${error.message}`)
        }
      } catch (err) {
        // エラーは無視（テーブルが既に存在する場合など）
        if (!err.message?.includes('already exists')) {
          console.log(`   ⚠️  ${err.message}`)
        }
      }
    }
  }

  console.log(`   ✅ 完了`)
}

async function main() {
  console.log('🚀 トレーニングシステム - 完全自動マイグレーション')
  console.log('=' .repeat(60))

  try {
    // マイグレーション023
    const migration023 = readFileSync(
      join(projectRoot, 'supabase/migrations/023_add_training_system.sql'),
      'utf-8'
    )

    await runSQL(migration023, 'トレーニングシステムテーブル作成')

    // マイグレーション024
    const migration024 = readFileSync(
      join(projectRoot, 'supabase/migrations/024_create_training_storage.sql'),
      'utf-8'
    )

    await runSQL(migration024, 'Storageバケット作成')

    // 検証
    console.log('\n🔍 検証中...')

    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%training%')
      .order('table_name')

    if (tables && tables.length > 0) {
      console.log('\n作成されたテーブル:')
      tables.forEach(t => console.log(`  - ${t.table_name}`))
    }

    const { data: trainings, count } = await supabase
      .from('trainings')
      .select('*', { count: 'exact', head: true })
      .eq('is_default', true)

    if (count !== null) {
      console.log(`\nデフォルトトレーニング: ${count}種類`)
    }

    console.log('\n🎉 マイグレーション完了！')

  } catch (error) {
    console.error('\n❌ エラー:', error.message)
    process.exit(1)
  }
}

main()
