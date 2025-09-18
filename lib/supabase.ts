import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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