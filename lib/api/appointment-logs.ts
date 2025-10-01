import { supabase } from '@/lib/supabase'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

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
  operator_id: string
  ip_address?: string
}

/**
 * 患者の予約操作ログを取得
 */
export async function getAppointmentLogs(patientId: string): Promise<AppointmentLog[]> {
  // モックモードの場合は空の配列を返す
  if (MOCK_MODE) {
    console.log('モックモード: 予約操作ログは記録されません')
    return []
  }

  try {
    // まず患者の予約を取得
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', patientId)

    if (appointmentsError) {
      console.error('患者の予約取得エラー:', appointmentsError)
      throw appointmentsError
    }

    if (!appointments || appointments.length === 0) {
      return []
    }

    const appointmentIds = appointments.map(apt => apt.id)

    const { data, error } = await supabase
      .from('appointment_logs')
      .select(`
        *,
        operator:staff!appointment_logs_operator_id_fkey(id, name),
        appointment:appointments!appointment_logs_appointment_id_fkey(
          id,
          start_time,
          end_time,
          status,
          menu1_id,
          staff1_id
        )
      `)
      .in('appointment_id', appointmentIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('予約操作ログの取得エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('予約操作ログの取得に失敗:', error)
    throw error
  }
}

/**
 * 予約操作ログを作成
 */
export async function createAppointmentLog(params: CreateAppointmentLogParams): Promise<AppointmentLog> {
  // モックモードの場合はログを作成せず、ダミーデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: 予約操作ログを作成します（localStorageには保存しません）', params)
    return {
      id: `mock-log-${Date.now()}`,
      ...params,
      created_at: new Date().toISOString()
    } as AppointmentLog
  }

  try {
    const { data, error } = await supabase
      .from('appointment_logs')
      .insert([params])
      .select(`
        *,
        operator:staff!appointment_logs_operator_id_fkey(id, name),
        appointment:appointments!appointment_logs_appointment_id_fkey(
          id,
          start_time,
          end_time,
          status,
          menu1_id,
          staff1_id
        )
      `)
      .single()

    if (error) {
      console.error('予約操作ログの作成エラー:', error)
      throw error
    }

    return data
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
        operator_id: changedBy || 'system'
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
      operator_id: createdBy || 'system'
    })
  } catch (error) {
    console.error('予約作成ログの作成に失敗:', error)
  }
}
