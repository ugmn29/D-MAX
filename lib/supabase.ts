import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// 環境変数の取得とフォールバック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// 環境変数が設定されていない場合の警告
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase環境変数が設定されていません。Vercelで環境変数を設定してください。')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
})

// マルチテナント対応のためのヘルパー関数
export const getClinicId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // ユーザーのメタデータからクリニックIDを取得
  return user.user_metadata?.clinic_id || null
}

// RLS対応のクエリヘルパー
export const createClinicScopedClient = (clinicId: string) => {
  return {
    ...supabase,
    // クリニックIDでスコープされたクエリを提供
    from: (table: string) => {
      return supabase
        .from(table)
        .select('*')
        .eq('clinic_id', clinicId)
    }
  }
}