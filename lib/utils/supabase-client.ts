import { supabase, supabaseAdmin } from '@/lib/supabase'

// 開発環境用の認証バイパス
const isDevelopment = process.env.NODE_ENV === 'development'

// RLSをバイパスするためのクライアントを選択
export const getSupabaseClient = () => {
  if (isDevelopment && supabaseAdmin) {
    return supabaseAdmin
  }
  return supabase
}

// Re-export for backward compatibility
export { supabase, supabaseAdmin }
