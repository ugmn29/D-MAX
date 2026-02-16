// Migrated to Prisma API Routes
import {
  AutoReminderRule,
  AutoReminderRuleInsert,
  AutoReminderRuleUpdate
} from '@/types/notification'

/**
 * クリニックの自動リマインドルールを取得
 */
export async function getAutoReminderRule(clinicId: string): Promise<AutoReminderRule | null> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/auto-reminder-rules?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '自動リマインドルールの取得に失敗しました')
    }

    const data = await response.json()
    // IDがない場合はデフォルト値が返されている（レコードなし）
    if (!data.id) {
      return null
    }
    return data
  } catch (error) {
    console.error('自動リマインドルール取得エラー:', error)
    throw new Error('自動リマインドルールの取得に失敗しました')
  }
}

/**
 * 自動リマインドルールを作成
 */
export async function createAutoReminderRule(
  rule: AutoReminderRuleInsert
): Promise<AutoReminderRule> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/auto-reminder-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '自動リマインドルールの作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('自動リマインドルール作成エラー:', error)
    throw new Error('自動リマインドルールの作成に失敗しました')
  }
}

/**
 * 自動リマインドルールを更新（または作成）
 */
export async function upsertAutoReminderRule(
  clinicId: string,
  rule: AutoReminderRuleUpdate
): Promise<AutoReminderRule> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/auto-reminder-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinicId,
        ...rule
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '自動リマインドルールの更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('自動リマインドルール更新エラー:', error)
    throw new Error('自動リマインドルールの更新に失敗しました')
  }
}

/**
 * 自動リマインドルールを削除
 */
export async function deleteAutoReminderRule(clinicId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/auto-reminder-rules?clinic_id=${clinicId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '自動リマインドルールの削除に失敗しました')
    }
  } catch (error) {
    console.error('自動リマインドルール削除エラー:', error)
    throw new Error('自動リマインドルールの削除に失敗しました')
  }
}

/**
 * 自動リマインド対象患者を検出
 */
export async function detectAutoReminderCandidates(
  clinicId: string
): Promise<Array<{ patient_id: string; last_appointment_date: string; interval_sequence: number }>> {
  // 自動リマインドルールを取得
  const rule = await getAutoReminderRule(clinicId)
  if (!rule || !rule.enabled || rule.intervals.length === 0) {
    return []
  }

  const candidates: Array<{ patient_id: string; last_appointment_date: string; interval_sequence: number }> = []

  // 各段階について対象患者を検出
  for (const interval of rule.intervals) {
    const periodMonths = calculateMonths(interval.value, interval.unit)
    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() - periodMonths)

    // TODO: 実際のクエリ実装
  }

  return candidates
}

/**
 * ヘルパー: 期間を月数に変換
 */
function calculateMonths(value: number, unit: string): number {
  switch (unit) {
    case 'days':
      return value / 30
    case 'weeks':
      return value / 4
    case 'months':
      return value
    default:
      return value
  }
}

/**
 * 患者の自動リマインド履歴を取得
 */
export async function getPatientAutoReminderHistory(
  patientId: string
): Promise<Array<{ sequence: number; sent_at: string; status: string }>> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({
      patient_id: patientId,
      is_auto_reminder: 'true'
    })
    const response = await fetch(`${baseUrl}/api/notification-schedules?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      console.error('自動リマインド履歴取得エラー')
      return []
    }

    const data = await response.json()
    return data.map((d: any) => ({
      sequence: d.auto_reminder_sequence || 0,
      sent_at: d.sent_at || '',
      status: d.status
    }))
  } catch (error) {
    console.error('自動リマインド履歴取得エラー:', error)
    return []
  }
}

/**
 * 次回の自動リマインドシーケンス番号を取得
 */
export async function getNextAutoReminderSequence(patientId: string): Promise<number> {
  const history = await getPatientAutoReminderHistory(patientId)
  if (history.length === 0) {
    return 1
  }

  const maxSequence = Math.max(...history.map(h => h.sequence))
  return maxSequence + 1
}

/**
 * 自動リマインドをリセット（新しいサイクル開始）
 */
export async function resetPatientAutoReminder(patientId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/notification-schedules/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        is_auto_reminder: true
      })
    })

    if (!response.ok) {
      console.error('自動リマインドリセットエラー')
    }
  } catch (error) {
    console.error('自動リマインドリセットエラー:', error)
  }
}
