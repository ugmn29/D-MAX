import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // セキュリティ: 本番環境では認証必須
    const { password } = await request.json()

    if (password !== 'run-migration-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = getPrismaClient()

    // マイグレーションファイルを読み込み
    const migration023Path = path.join(process.cwd(), 'supabase/migrations/023_add_training_system.sql')
    const migration024Path = path.join(process.cwd(), 'supabase/migrations/024_create_training_storage.sql')

    const migration023 = fs.readFileSync(migration023Path, 'utf-8')
    const migration024 = fs.readFileSync(migration024Path, 'utf-8')

    // マイグレーション実行
    let error023Message: string | undefined
    let error024Message: string | undefined

    console.log('Executing migration 023...')
    try {
      await prisma.$executeRawUnsafe(migration023)
    } catch (err: any) {
      console.error('Migration 023 error:', err)
      error023Message = err.message
      // エラーでも続行（テーブルが既に存在する場合など）
    }

    console.log('Executing migration 024...')
    try {
      await prisma.$executeRawUnsafe(migration024)
    } catch (err: any) {
      console.error('Migration 024 error:', err)
      error024Message = err.message
    }

    // 確認クエリ
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE '%training%'
    `

    const trainings = await prisma.trainings.findMany({
      where: { is_default: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results: {
        tablesCreated: tables?.map(t => t.table_name) || [],
        defaultTrainingsCount: trainings.length,
        errors: {
          migration023: error023Message,
          migration024: error024Message
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
