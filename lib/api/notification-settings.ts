// Migrated to Prisma API Routes

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
    liff_id_initial_link?: string
    liff_id_qr_code?: string
    liff_id_family_register?: string
    liff_id_appointments?: string
    liff_id_web_booking?: string
  }
}

/**
 * 通知設定を取得
 */
export async function getNotificationSettings(clinicId: string): Promise<NotificationSettings | null> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/notification-settings?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '通知設定の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('通知設定取得エラー:', error)
    return null
  }
}

/**
 * 通知設定を保存
 */
export async function saveNotificationSettings(
  clinicId: string,
  settings: NotificationSettings
): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/notification-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clinic_id: clinicId,
        settings
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '通知設定の保存に失敗しました')
    }
  } catch (error) {
    console.error('saveNotificationSettings error:', error)
    throw error
  }
}
