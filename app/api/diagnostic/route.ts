import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    // 環境変数チェック
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
      isMockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
    }

    // データベース接続チェック
    const { data: settings, error: settingsError } = await supabase
      .from('clinic_settings')
      .select('setting_key, setting_value')
      .eq('clinic_id', '11111111-1111-1111-1111-111111111111')
      .eq('setting_key', 'web_reservation')
      .single()

    const dbCheck = {
      canConnect: !settingsError || settingsError.code === 'PGRST116',
      hasWebReservationSettings: !!settings,
      isEnabled: settings?.setting_value?.isEnabled,
      error: settingsError ? {
        code: settingsError.code,
        message: settingsError.message
      } : null
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        ...envCheck
      },
      database: {
        ...dbCheck,
        webReservationSettings: settings?.setting_value
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}
