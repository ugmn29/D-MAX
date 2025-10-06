import { getSupabaseClient } from '@/lib/utils/supabase-client'
import {
  NotificationTemplate,
  NotificationTemplateInsert,
  NotificationTemplateUpdate
} from '@/types/notification'

/**
 * 通知テンプレート一覧を取得
 */
export async function getNotificationTemplates(clinicId: string): Promise<NotificationTemplate[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('notification_templates')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('通知テンプレート取得エラー:', error)
    throw new Error('通知テンプレートの取得に失敗しました')
  }

  return data || []
}

/**
 * 通知テンプレートをIDで取得
 */
export async function getNotificationTemplate(id: string): Promise<NotificationTemplate | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('notification_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('通知テンプレート取得エラー:', error)
    throw new Error('通知テンプレートの取得に失敗しました')
  }

  return data
}

/**
 * 通知タイプ別にテンプレートを取得
 */
export async function getNotificationTemplatesByType(
  clinicId: string,
  notificationType: string
): Promise<NotificationTemplate[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('notification_templates')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('notification_type', notificationType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('通知テンプレート取得エラー:', error)
    throw new Error('通知テンプレートの取得に失敗しました')
  }

  return data || []
}

/**
 * 通知テンプレートを作成
 */
export async function createNotificationTemplate(
  template: NotificationTemplateInsert
): Promise<NotificationTemplate> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('notification_templates')
    .insert({
      ...template,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('通知テンプレート作成エラー:', error)
    throw new Error('通知テンプレートの作成に失敗しました')
  }

  return data
}

/**
 * 通知テンプレートを更新
 */
export async function updateNotificationTemplate(
  id: string,
  updates: NotificationTemplateUpdate
): Promise<NotificationTemplate> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('notification_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('通知テンプレート更新エラー:', error)
    throw new Error('通知テンプレートの更新に失敗しました')
  }

  return data
}

/**
 * 通知テンプレートを削除
 */
export async function deleteNotificationTemplate(id: string): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client
    .from('notification_templates')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('通知テンプレート削除エラー:', error)
    throw new Error('通知テンプレートの削除に失敗しました')
  }
}

/**
 * メッセージテンプレートの変数を置換
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`
    result = result.replace(new RegExp(placeholder, 'g'), value)
  }

  return result
}

/**
 * テンプレートで使用可能な変数一覧を取得
 */
export function getAvailableVariables(): Array<{ key: string; label: string; description: string }> {
  return [
    { key: 'patient_name', label: '患者名', description: '患者様のお名前' },
    { key: 'clinic_name', label: '医院名', description: 'クリニック名' },
    { key: 'clinic_phone', label: '医院電話番号', description: 'クリニックの電話番号' },
    { key: 'datetime', label: '予約日時', description: '予約の日時' },
    { key: 'date', label: '予約日', description: '予約の日付' },
    { key: 'time', label: '予約時刻', description: '予約の時刻' },
    { key: 'menu_name', label: 'メニュー名', description: '治療メニュー名' },
    { key: 'staff_name', label: '担当者名', description: '担当スタッフ名' },
    { key: 'treatment_name', label: '治療名', description: '治療内容' },
    { key: 'last_visit_date', label: '最終来院日', description: '最後にご来院いただいた日' },
    { key: 'web_booking_link', label: 'Web予約リンク', description: 'Web予約ページのURL' },
    { key: 'recommended_date', label: '推奨日', description: '次回推奨日' }
  ]
}
