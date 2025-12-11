import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { supabaseAdmin } from '@/lib/supabase'

const supabase = getSupabaseClient()

export interface NotificationSettings {
  email: {
    enabled: boolean
    smtp_host: string
    smtp_port: number
    smtp_user: string
    smtp_password: string
    from_address: string
    from_name: string
  }
  sms: {
    enabled: boolean
    provider: string
    api_key: string
    api_secret: string
    sender_number: string
  }
  line: {
    enabled: boolean
    channel_id: string
    channel_secret: string
    channel_access_token: string
    webhook_url: string
  }
}

/**
 * 通知設定を取得
 */
export async function getNotificationSettings(clinicId: string): Promise<NotificationSettings | null> {
  const { data, error } = await supabase
    .from('clinic_settings')
    .select('setting_value')
    .eq('clinic_id', clinicId)
    .eq('setting_key', 'notification_settings')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // データが存在しない場合はデフォルト値を返す
      return {
        email: {
          enabled: false,
          smtp_host: '',
          smtp_port: 587,
          smtp_user: '',
          smtp_password: '',
          from_address: '',
          from_name: ''
        },
        sms: {
          enabled: false,
          provider: 'twilio',
          api_key: '',
          api_secret: '',
          sender_number: ''
        },
        line: {
          enabled: false,
          channel_id: '',
          channel_secret: '',
          channel_access_token: '',
          webhook_url: ''
        }
      }
    }
    throw error
  }

  return data.setting_value as NotificationSettings
}

/**
 * 通知設定を保存
 */
export async function saveNotificationSettings(
  clinicId: string,
  settings: NotificationSettings
): Promise<void> {
  try {
    // 既存の設定を確認
    const { data: existing, error: selectError } = await supabase
      .from('clinic_settings')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('setting_key', 'notification_settings')
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      throw new Error(`設定の確認に失敗: ${selectError.message} (code: ${selectError.code})`)
    }

    if (existing) {
      // 更新
      const { error } = await supabase
        .from('clinic_settings')
        .update({
          setting_value: settings,
          updated_at: new Date().toISOString()
        })
        .eq('clinic_id', clinicId)
        .eq('setting_key', 'notification_settings')

      if (error) throw new Error(`設定の更新に失敗: ${error.message} (code: ${error.code})`)
    } else {
      // 新規作成
      const { error } = await supabase
        .from('clinic_settings')
        .insert({
          clinic_id: clinicId,
          setting_key: 'notification_settings',
          setting_value: settings
        })

      if (error) throw new Error(`設定の作成に失敗: ${error.message} (code: ${error.code})`)
    }

    // LINE設定が有効な場合、line キーにも同期保存（getLineSettings関数用）
    if (settings.line.enabled && settings.line.channel_access_token && settings.line.channel_secret) {
      console.log('🔄 LINE基本設定を同期中...')

      // Service Role Keyを使用してRLSをバイパス
      const adminClient = supabaseAdmin || supabase

      const { error: lineError } = await adminClient
        .from('clinic_settings')
        .upsert({
          clinic_id: clinicId,
          setting_key: 'line',
          setting_value: {
            channel_access_token: settings.line.channel_access_token,
            channel_secret: settings.line.channel_secret,
            channel_id: settings.line.channel_id || undefined,
            webhook_url: settings.line.webhook_url || 'https://d-max-lemon.vercel.app/api/line/webhook'
          }
        }, {
          onConflict: 'clinic_id,setting_key'
        })

      if (lineError) {
        console.error('⚠️ LINE基本設定の同期に失敗:', lineError)
        // エラーでも通知設定は保存されているので継続
      } else {
        console.log('✅ LINE基本設定を同期しました')
      }
    }
  } catch (error) {
    console.error('saveNotificationSettings error:', error)
    throw error
  }
}
