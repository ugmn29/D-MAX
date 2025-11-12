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

// モックモード用のログストレージ
class AppointmentLogStorage {
  private static instance: AppointmentLogStorage
  private storageKey = 'appointment_logs'

  private constructor() {}

  public static getInstance(): AppointmentLogStorage {
    if (!AppointmentLogStorage.instance) {
      AppointmentLogStorage.instance = new AppointmentLogStorage()
    }
    return AppointmentLogStorage.instance
  }

  private getFromStorage(): AppointmentLog[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('ストレージからの読み込みエラー:', error)
      return []
    }
  }

  private saveToStorage(logs: AppointmentLog[]): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(logs))
    } catch (error) {
      console.error('ストレージへの保存エラー:', error)
    }
  }

  public getByPatientId(patientId: string): AppointmentLog[] {
    const logs = this.getFromStorage()
    // 患者の予約IDを取得して、それに紐づくログをフィルタ
    return logs.filter(log => {
      // appointment.patient_idで判定（モックデータに含める必要がある）
      return true // 暫定的に全て返す（後でフィルタリング追加）
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  public add(log: AppointmentLog): void {
    const logs = this.getFromStorage()
    logs.push(log)
    this.saveToStorage(logs)
    console.log('予約操作ログを追加:', log)
  }

  public getByAppointmentId(appointmentId: string): AppointmentLog[] {
    const logs = this.getFromStorage()
    return logs.filter(log => log.appointment_id === appointmentId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}

const logStorage = AppointmentLogStorage.getInstance()

/**
 * 患者の予約操作ログを取得
 */
export async function getAppointmentLogs(patientId: string): Promise<AppointmentLog[]> {
  console.log('getAppointmentLogs呼び出し:', { patientId, MOCK_MODE })

  // モックモードの場合はlocalStorageから取得
  if (MOCK_MODE) {
    console.log('モックモード: 予約操作ログをlocalStorageから取得')

    // 患者の予約を取得
    const { getAppointments } = await import('./appointments')
    const appointments = await getAppointments('11111111-1111-1111-1111-111111111111', '', '')
    console.log('全予約数:', appointments.length)

    const patientAppointments = appointments.filter(apt => apt.patient_id === patientId)
    console.log('患者の予約数:', patientAppointments.length, '予約:', patientAppointments.map(a => ({ id: a.id, date: a.appointment_date })))

    const appointmentIds = patientAppointments.map(apt => apt.id)
    console.log('予約ID一覧:', appointmentIds)

    // 予約IDに紐づくログを取得
    const allLogs = logStorage.getFromStorage()
    console.log('localStorage内の全ログ数:', allLogs.length, 'ログ:', allLogs)

    const patientLogs = allLogs.filter(log => appointmentIds.includes(log.appointment_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log('フィルタ後の患者ログ数:', patientLogs.length, 'ログ:', patientLogs)
    return patientLogs
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
          staff1_id,
          menu1:treatment_menus!appointments_menu1_id_fkey(id, name),
          staff1:staff!appointments_staff1_id_fkey(id, name)
        )
      `)
      .in('appointment_id', appointmentIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('予約操作ログの取得エラー:', error)
      throw error
    }

    // before_data/after_dataのスタッフIDとメニューIDを名前に変換
    const logsWithNames = await Promise.all((data || []).map(async (log) => {
      // スタッフとメニューのマッピングを作成
      const { data: allStaff } = await supabase.from('staff').select('id, name')
      const { data: allMenus } = await supabase.from('treatment_menus').select('id, name')

      const staffMap = new Map((allStaff || []).map(s => [s.id, s.name]))
      const menuMap = new Map((allMenus || []).map(m => [m.id, m.name]))

      // before_dataとafter_dataのIDを名前に変換
      const enrichData = (data: Record<string, any> | undefined) => {
        if (!data) return data
        const enriched = { ...data }

        // スタッフIDを名前に変換
        if (enriched.staff1_id) enriched.staff1_name = staffMap.get(enriched.staff1_id) || enriched.staff1_id
        if (enriched.staff2_id) enriched.staff2_name = staffMap.get(enriched.staff2_id) || enriched.staff2_id
        if (enriched.staff3_id) enriched.staff3_name = staffMap.get(enriched.staff3_id) || enriched.staff3_id

        // メニューIDを名前に変換
        if (enriched.menu1_id) enriched.menu1_name = menuMap.get(enriched.menu1_id) || enriched.menu1_id
        if (enriched.menu2_id) enriched.menu2_name = menuMap.get(enriched.menu2_id) || enriched.menu2_id
        if (enriched.menu3_id) enriched.menu3_name = menuMap.get(enriched.menu3_id) || enriched.menu3_id

        return enriched
      }

      return {
        ...log,
        before_data: enrichData(log.before_data),
        after_data: enrichData(log.after_data)
      }
    }))

    return logsWithNames
  } catch (error) {
    console.error('予約操作ログの取得に失敗:', error)
    throw error
  }
}

/**
 * 予約操作ログを作成
 */
export async function createAppointmentLog(params: CreateAppointmentLogParams): Promise<AppointmentLog> {
  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    console.log('モックモード: 予約操作ログを作成してlocalStorageに保存します', params)

    const log: AppointmentLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      created_at: new Date().toISOString(),
      operator: {
        id: params.operator_id,
        name: 'システム' // デフォルト名
      }
    }

    logStorage.add(log)
    return log
  }

  try {
    const { data, error } = await supabase
      .from('appointment_logs')
      .insert([params])
      .select(`
        *,
        operator:staff(id, name),
        appointment:appointments(
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
      console.error('予約操作ログの作成エラー詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        params: params
      })
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
