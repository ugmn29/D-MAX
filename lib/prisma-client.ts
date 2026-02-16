/**
 * Prismaデータベースクライアント
 *
 * シングルトンパターンでPrisma Clientを管理
 * Supabaseクライアントの代替として使用
 */

import { PrismaClient } from '@/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// グローバル型定義（開発環境でのホットリロード対策）
declare global {
  var prisma: PrismaClient | undefined
  var pgPool: Pool | undefined
}

/**
 * PostgreSQL接続プールを作成
 */
function createPgPool(): Pool {
  if (global.pgPool) {
    return global.pgPool
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 15, // 最大接続数
    idleTimeoutMillis: 60000, // アイドル接続のタイムアウト（60秒）
    connectionTimeoutMillis: 10000, // 接続タイムアウト（10秒）
  })

  if (process.env.NODE_ENV !== 'production') {
    global.pgPool = pool
  }

  return pool
}

/**
 * Prisma Clientのシングルトンインスタンスを作成
 */
function createPrismaClient(): PrismaClient {
  if (global.prisma) {
    return global.prisma
  }

  // PostgreSQL接続プールを作成
  const pool = createPgPool()
  const adapter = new PrismaPg(pool)

  // Prisma Clientを初期化
  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn'] // 開発環境では警告とエラーのみ
      : ['error'], // 本番環境ではエラーのみ
  })

  // 開発環境ではグローバルに保存（ホットリロード対策）
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
  }

  return prisma
}

/**
 * Prisma Clientのシングルトンインスタンス
 */
export const prisma = createPrismaClient()

/**
 * Prisma Clientを取得する関数
 * 既存のgetSupabaseClient()パターンと互換性を持たせる
 */
export function getPrismaClient(): PrismaClient {
  return prisma
}

/**
 * データベース接続をクローズ
 * アプリケーション終了時に呼び出す
 */
export async function closeDatabaseConnection() {
  await prisma.$disconnect()
  if (global.pgPool) {
    await global.pgPool.end()
    global.pgPool = undefined
  }
}

/**
 * データベース接続テスト
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('データベース接続エラー:', error)
    return false
  }
}

// Next.jsのホットリロード時にクリーンアップ
if (process.env.NODE_ENV !== 'production') {
  if (typeof window === 'undefined') {
    // サーバーサイドのみ
    process.on('SIGTERM', closeDatabaseConnection)
    process.on('SIGINT', closeDatabaseConnection)
  }
}
