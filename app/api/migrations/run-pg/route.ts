import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

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

    // PostgreSQL接続情報
    const dbPassword = process.env.SUPABASE_DB_PASSWORD
    if (!dbPassword) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_DB_PASSWORD is not set'
      }, { status: 500 })
    }

    // SUPABASE_URLからプロジェクトIDを抽出
    const projectId = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract project ID from SUPABASE_URL'
      }, { status: 500 })
    }

    // Vercelのサーバーレス環境ではTransaction poolerを使用
    const connectionString = `postgresql://postgres.${projectId}:${dbPassword}@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres`

    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      // Vercelのサーバーレス環境用の設定
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
      statement_timeout: 10000,
    })

    try {
      await client.connect()
      console.log('✅ PostgreSQL接続成功')

      // SQLをそのまま実行（pgライブラリは複数文を処理できる）
      const result = await client.query(sql)

      console.log('✅ マイグレーション実行成功')

      return NextResponse.json({
        success: true,
        message: 'マイグレーション実行完了',
        result: {
          rowCount: result.rowCount,
          command: result.command
        }
      })

    } catch (error: any) {
      console.error('❌ SQL実行エラー:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        detail: error.detail
      }, { status: 500 })
    } finally {
      await client.end()
      console.log('接続を終了しました')
    }

  } catch (error: any) {
    console.error('❌ マイグレーション実行エラー:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
