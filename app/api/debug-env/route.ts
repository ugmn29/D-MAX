import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasPassword = !!process.env.SUPABASE_DB_PASSWORD

  // プロジェクトIDを抽出
  const projectId = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

  // 接続文字列を構築（パスワード部分は隠す）
  const connectionString = projectId
    ? `postgresql://postgres.${projectId}:***@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
    : 'Could not build connection string'

  return NextResponse.json({
    supabaseUrl,
    projectId,
    hasPassword,
    connectionString,
    env: process.env.NODE_ENV
  })
}
