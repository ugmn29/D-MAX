import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Service Role Keyを使用（データベース操作に必要）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { migrationFile } = await request.json()

    if (!migrationFile) {
      return NextResponse.json({
        success: false,
        error: 'Migration file name is required'
      }, { status: 400 })
    }

    console.log('🚀 マイグレーション実行開始:', migrationFile)

    // マイグレーションファイルを読み込む
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({
        success: false,
        error: `Migration file not found: ${migrationFile}`
      }, { status: 404 })
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 SQLファイル読み込み完了')
    console.log('SQL内容:', sql.substring(0, 200) + '...')

    // Supabase Clientを作成（Service Role Keyで）
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // PostgreSQL接続情報
    const dbPassword = process.env.SUPABASE_DB_PASSWORD
    if (!dbPassword) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_DB_PASSWORD is not set'
      }, { status: 500 })
    }

    // SQL文を分割して実行（セミコロンで分割）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 ${statements.length}個のSQL文を実行します`)

    const results = []
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // コメントのみの行をスキップ
      if (statement.match(/^--/)) {
        continue
      }

      console.log(`実行中 (${i + 1}/${statements.length}):`, statement.substring(0, 100) + '...')

      try {
        // rpcを使ってSQLを実行
        const { data, error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        }).catch(async () => {
          // exec_sql関数が存在しない場合は、REST APIを直接使用
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ query: statement + ';' })
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          return { data: await response.json(), error: null }
        })

        if (error) {
          console.error(`❌ SQL実行エラー (${i + 1}/${statements.length}):`, error)
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: false,
            error: error.message || error
          })
        } else {
          console.log(`✅ 成功 (${i + 1}/${statements.length})`)
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: true,
            data
          })
        }
      } catch (err: any) {
        console.error(`❌ 予期しないエラー (${i + 1}/${statements.length}):`, err)
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: false,
          error: err.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`\n📊 実行結果: 成功 ${successCount}件, 失敗 ${failureCount}件`)

    return NextResponse.json({
      success: failureCount === 0,
      message: `マイグレーション実行完了: 成功 ${successCount}件, 失敗 ${failureCount}件`,
      results,
      successCount,
      failureCount
    })

  } catch (error: any) {
    console.error('❌ マイグレーション実行エラー:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
