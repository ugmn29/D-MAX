import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { migrationFile } = await request.json()

    if (!migrationFile) {
      return NextResponse.json({
        success: false,
        error: 'Migration file name is required'
      }, { status: 400 })
    }

    console.log('マイグレーション実行開始:', migrationFile)

    // マイグレーションファイルを読み込む
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({
        success: false,
        error: `Migration file not found: ${migrationFile}`
      }, { status: 404 })
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('SQLファイル読み込み完了')
    console.log('SQL内容:', sql.substring(0, 200) + '...')

    const prisma = getPrismaClient()

    // SQL文を分割して実行（セミコロンで分割）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`${statements.length}個のSQL文を実行します`)

    const results = []
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // コメントのみの行をスキップ
      if (statement.match(/^--/)) {
        continue
      }

      console.log(`実行中 (${i + 1}/${statements.length}):`, statement.substring(0, 100) + '...')

      try {
        await prisma.$executeRawUnsafe(statement)

        console.log(`成功 (${i + 1}/${statements.length})`)
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: true
        })
      } catch (err: any) {
        console.error(`エラー (${i + 1}/${statements.length}):`, err)
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: false,
          error: err.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`\n実行結果: 成功 ${successCount}件, 失敗 ${failureCount}件`)

    return NextResponse.json({
      success: failureCount === 0,
      message: `マイグレーション実行完了: 成功 ${successCount}件, 失敗 ${failureCount}件`,
      results,
      successCount,
      failureCount
    })

  } catch (error: any) {
    console.error('マイグレーション実行エラー:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
