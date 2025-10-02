import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = 'https://pgvozzkedpqhnjhzneuh.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndm96emtlZHBxaG5qaHpuZXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM2MDEzNCwiZXhwIjoyMDczOTM2MTM0fQ.A10uHHvGukzwXd9sTwjWluaTxWrDEs6A-pGxSOYiJug'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function runMigration() {
  console.log('🚀 トレーニングシステムマイグレーション開始...\n')

  try {
    // マイグレーション023を読み込み
    const migration023Path = join(process.cwd(), 'supabase/migrations/023_add_training_system.sql')
    const migration023 = readFileSync(migration023Path, 'utf-8')

    console.log('📦 ステップ1: トレーニングシステムテーブル作成...')

    // SQLを実行（RPCではなく、直接クエリ）
    // まず、テーブルが存在するか確認
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'trainings')
      .single()

    if (existingTables) {
      console.log('⚠️  trainingsテーブルは既に存在します')
    } else {
      console.log('📝 マイグレーション023を実行します...')
      console.log('⚠️  注意: Supabase JS Clientでは複雑なSQLを直接実行できません')
      console.log('📋 以下のSQLをSupabase DashboardのSQL Editorで実行してください：\n')
      console.log('ファイルパス:', migration023Path)
      console.log('\nまたは、以下のコマンドでマイグレーション内容を表示：')
      console.log('cat', migration023Path)
    }

    // マイグレーション024
    const migration024Path = join(process.cwd(), 'supabase/migrations/024_create_training_storage.sql')
    console.log('\n📦 ステップ2: Storageバケット作成...')
    console.log('ファイルパス:', migration024Path)

    console.log('\n' + '='.repeat(60))
    console.log('📋 マイグレーション実行方法（CLI経由）')
    console.log('='.repeat(60))
    console.log('\n以下のコマンドを実行してください：\n')
    console.log('export PGPASSWORD="your-database-password"')
    console.log('psql "postgresql://postgres.pgvozzkedpqhnjhzneuh@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" \\')
    console.log('  -f supabase/migrations/023_add_training_system.sql\n')
    console.log('psql "postgresql://postgres.pgvozzkedpqhnjhzneuh@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" \\')
    console.log('  -f supabase/migrations/024_create_training_storage.sql\n')

  } catch (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }
}

runMigration()
