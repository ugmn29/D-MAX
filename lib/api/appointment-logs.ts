// Migrated to Prisma API Routes

export interface AppointmentLog {
  id: string
  appointment_id: string
  action: '作成' | '変更' | 'キャンセル' | '削除'
  before_data?: Record<string, any>
  after_data?: Record<string, any>
  reason: string
  operator_id: string
  ip_address?: string
  created_at: string
  // 関連データ
  operator?: {
    id: string
    name: string
  }
  appointment?: {
    id: string
    appointment_date?: string
    start_time: string
    end_time: string
    status: string
    treatment_menu_id?: string
    staff_id?: string
  }
}

export interface CreateAppointmentLogParams {
  appointment_id: string
  action: '作成' | '変更' | 'キャンセル' | '削除'
  before_data?: Record<string, any>
  after_data?: Record<string, any>
  reason: string
  operator_id: string | null
  ip_address?: string
}

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * 患者の予約操作ログを取得
 */
export async function getAppointmentLogs(patientId: string): Promise<AppointmentLog[]> {
  try {
    const response = await fetch(`${baseUrl}/api/appointment-logs?patient_id=${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '予約操作ログの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('予約操作ログの取得に失敗:', error)
    return []
  }
}

/**
 * 予約操作ログを作成
 */
export async function createAppointmentLog(params: CreateAppointmentLogParams): Promise<AppointmentLog> {
  try {
    const response = await fetch(`${baseUrl}/api/appointment-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...params,
        operator_id: params.operator_id || null
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('予約操作ログの作成エラー詳細:', errorData)
      throw new Error(errorData.error || '予約操作ログの作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('予約操作ログの作成に失敗:', error)
    throw error
  }
}

/**
 * 予約の変更を検出してログを作成
 */
export async function logAppointmentChange(
  appointmentId: string,
  patientId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  changedBy?: string,
  reason?: string
): Promise<void> {
  try {
    // 変更されたフィールドを特定
    const changedFields: string[] = []
    const beforeData: Record<string, any> = {}
    const afterData: Record<string, any> = {}

    // 比較対象のフィールド
    const fieldsToCompare = [
      'start_time',
      'end_time',
      'staff1_id',
      'menu1_id',
      'status',
      'memo'
    ]

    fieldsToCompare.forEach(field => {
      if (oldData[field] !== newData[field]) {
        changedFields.push(field)
        beforeData[field] = oldData[field]
        afterData[field] = newData[field]
      }
    })

    // 変更があった場合のみログを作成
    if (changedFields.length > 0) {
      let action: '変更' | 'キャンセル' | '削除' = '変更'

      // ステータス変更の場合は特別なアクションを設定
      if (changedFields.includes('status')) {
        switch (newData.status) {
          case 'キャンセル':
            action = 'キャンセル'
            break
        }
      }

      await createAppointmentLog({
        appointment_id: appointmentId,
        action: action,
        before_data: beforeData,
        after_data: afterData,
        reason: reason || '予約情報を更新しました',
        operator_id: changedBy || null
      })
    }
  } catch (error) {
    console.error('予約変更ログの作成に失敗:', error)
    // ログ作成の失敗は予約操作を止めないようにする
  }
}

/**
 * 新しい予約作成時のログを作成
 */
export async function logAppointmentCreation(
  appointmentId: string,
  patientId: string,
  appointmentData: Record<string, any>,
  createdBy?: string
): Promise<void> {
  try {
    await createAppointmentLog({
      appointment_id: appointmentId,
      action: '作成',
      after_data: appointmentData,
      reason: '新規予約作成',
      operator_id: createdBy || null
    })
  } catch (error) {
    console.error('予約作成ログの作成に失敗:', error)
  }
}
