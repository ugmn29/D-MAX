import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // セキュリティ: 本番環境では認証必須
    const { password } = await request.json()

    if (password !== 'run-migration-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // マイグレーションファイルを読み込み
    const migration023Path = path.join(process.cwd(), 'supabase/migrations/023_add_training_system.sql')
    const migration024Path = path.join(process.cwd(), 'supabase/migrations/024_create_training_storage.sql')

    const migration023 = fs.readFileSync(migration023Path, 'utf-8')
    const migration024 = fs.readFileSync(migration024Path, 'utf-8')

    // マイグレーション実行
    console.log('Executing migration 023...')
    const { error: error023 } = await supabaseAdmin.rpc('exec_sql', {
      sql: migration023
    })

    if (error023) {
      console.error('Migration 023 error:', error023)
      // エラーでも続行（テーブルが既に存在する場合など）
    }

    console.log('Executing migration 024...')
    const { error: error024 } = await supabaseAdmin.rpc('exec_sql', {
      sql: migration024
    })

    if (error024) {
      console.error('Migration 024 error:', error024)
    }

    // 確認クエリ
    const { data: tables } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%training%')

    const { data: trainings, count } = await supabaseAdmin
      .from('trainings')
      .select('*', { count: 'exact' })
      .eq('is_default', true)

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results: {
        tablesCreated: tables?.map(t => t.table_name) || [],
        defaultTrainingsCount: count,
        errors: {
          migration023: error023?.message,
          migration024: error024?.message
        }
      }
    })

  } catch (error: any) {
    console.error('Migration execution error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
