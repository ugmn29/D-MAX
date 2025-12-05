import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 環境変数 (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) が設定されていません。')
}

// サービスロールキーがあれば優先的に使い、なければ anon でフォールバック
const singletonClient =
  supabaseServiceRoleKey && supabaseUrl
    ? createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    : supabaseUrl && supabaseAnonKey
      ? createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
      : null

export const createClient = async () => {
  if (!singletonClient) {
    throw new Error('Supabase クライアントを初期化できませんでした。環境変数を確認してください。')
  }
  return singletonClient
}

