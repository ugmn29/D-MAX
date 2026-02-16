/**
 * Prisma Client シングルトン
 * メインのPrismaクライアント（lib/prisma-client.ts）を再エクスポート
 * 接続プールを共有して接続数を抑える
 */

export { prisma, getPrismaClient } from '@/lib/prisma-client'
