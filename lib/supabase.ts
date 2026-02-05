import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// 環境切り替え: USE_PRODUCTION=true で本番環境に接続
const useProduction = process.env.USE_PRODUCTION === 'true'

// 環境変数の取得（自動切り替え）
const supabaseUrl = useProduction
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL_PRODUCTION || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co')
  : (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co')

const supabaseAnonKey = useProduction
  ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key')
  : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key')

const supabaseServiceKey = useProduction
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY_PRODUCTION || process.env.SUPABASE_SERVICE_ROLE_KEY)
  : process.env.SUPABASE_SERVICE_ROLE_KEY

// 開発環境のみ: 環境変数の警告と接続先を表示
if (process.env.NODE_ENV !== 'production') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase環境変数が設定されていません。')
  }
  console.log(`🔌 Supabase接続先: ${useProduction ? '本番環境' : 'ローカル環境'}`)
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

// 開発環境用：RLSをバイパスするためのサービスロールクライアント
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null


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