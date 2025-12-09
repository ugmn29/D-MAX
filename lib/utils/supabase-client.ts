import { supabase, supabaseAdmin } from '@/lib/supabase'

// 開発環境用の認証バイパス
const isDevelopment = process.env.NODE_ENV === 'development'

// RLSをバイパスするためのクライアントを選択
export const getSupabaseClient = () => {
  console.log('getSupabaseClient呼び出し:', {
    isDevelopment,
    hasSupabaseAdmin: !!supabaseAdmin,
    hasSupabase: !!supabase
  })

  if (isDevelopment && supabaseAdmin) {
    console.log('サービスロールクライアントを使用')
    return supabaseAdmin
  } else {
    console.log('通常のクライアントを使用')
    return supabase
  }
}

// Re-export for backward compatibility
export { supabase, supabaseAdmin }
