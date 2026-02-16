// Migrated to Prisma API Routes
import {
  NotificationTemplate,
  NotificationTemplateInsert,
  NotificationTemplateUpdate
} from '@/types/notification'

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * 通知テンプレート一覧を取得
 */
export async function getNotificationTemplates(clinicId: string): Promise<NotificationTemplate[]> {
  try {
    const response = await fetch(`${baseUrl}/api/notification-templates?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '通知テンプレートの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('通知テンプレート取得エラー:', error)
    throw error instanceof Error ? error : new Error('通知テンプレートの取得に失敗しました')
  }
}

/**
 * 通知テンプレートをIDで取得
 */
export async function getNotificationTemplate(id: string): Promise<NotificationTemplate | null> {
  try {
    const response = await fetch(`${baseUrl}/api/notification-templates/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '通知テンプレートの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('通知テンプレート取得エラー:', error)
    throw error instanceof Error ? error : new Error('通知テンプレートの取得に失敗しました')
  }
}

/**
 * 通知タイプ別にテンプレートを取得
 */
export async function getNotificationTemplatesByType(
  clinicId: string,
  notificationType: string
): Promise<NotificationTemplate[]> {
  try {
    const params = new URLSearchParams({
      clinic_id: clinicId,
      notification_type: notificationType
    })

    const response = await fetch(`${baseUrl}/api/notification-templates?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '通知テンプレートの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('通知テンプレート取得エラー:', error)
    throw error instanceof Error ? error : new Error('通知テンプレートの取得に失敗しました')
  }
}

/**
 * 通知テンプレートを作成
 */
export async function createNotificationTemplate(
  template: NotificationTemplateInsert
): Promise<NotificationTemplate> {
  try {
    const response = await fetch(`${baseUrl}/api/notification-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(template)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '通知テンプレートの作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('通知テンプレート作成エラー:', error)
    throw error instanceof Error ? error : new Error('通知テンプレートの作成に失敗しました')
  }
}

/**
 * 通知テンプレートを更新
 */
export async function updateNotificationTemplate(
  id: string,
  updates: NotificationTemplateUpdate
): Promise<NotificationTemplate> {
  try {
    const response = await fetch(`${baseUrl}/api/notification-templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '通知テンプレートの更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('通知テンプレート更新エラー:', error)
    throw error instanceof Error ? error : new Error('通知テンプレートの更新に失敗しました')
  }
}

/**
 * 通知テンプレートを削除
 */
export async function deleteNotificationTemplate(id: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/notification-templates/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '通知テンプレートの削除に失敗しました')
    }
  } catch (error) {
    console.error('通知テンプレート削除エラー:', error)
    throw error instanceof Error ? error : new Error('通知テンプレートの削除に失敗しました')
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
    { key: 'web_booking_link', label: 'Web予約リンク（通常）', description: 'Web予約ページのURL' },
    { key: 'booking_url', label: 'Web予約リンク（トークン付き）', description: 'メニュー・担当者が事前設定されたWeb予約URL' },
    { key: 'recommended_date', label: '推奨日', description: '次回推奨日' }
  ]
}
