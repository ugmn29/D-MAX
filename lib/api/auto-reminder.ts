import { getSupabaseClient } from '@/lib/utils/supabase-client'
import {
  AutoReminderRule,
  AutoReminderRuleInsert,
  AutoReminderRuleUpdate
} from '@/types/notification'

/**
 * クリニックの自動リマインドルールを取得
 */
export async function getAutoReminderRule(clinicId: string): Promise<AutoReminderRule | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('auto_reminder_rules')
    .select('*')
    .eq('clinic_id', clinicId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('自動リマインドルール取得エラー:', error)
    throw new Error('自動リマインドルールの取得に失敗しました')
  }

  return data
}

/**
 * 自動リマインドルールを作成
 */
export async function createAutoReminderRule(
  rule: AutoReminderRuleInsert
): Promise<AutoReminderRule> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('auto_reminder_rules')
    .insert({
      ...rule,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('自動リマインドルール作成エラー:', error)
    throw new Error('自動リマインドルールの作成に失敗しました')
  }

  return data
}

/**
 * 自動リマインドルールを更新（または作成）
 */
export async function upsertAutoReminderRule(
  clinicId: string,
  rule: AutoReminderRuleUpdate
): Promise<AutoReminderRule> {
  const client = getSupabaseClient()

  // 既存のルールを取得
  const existing = await getAutoReminderRule(clinicId)

  if (existing) {
    // 更新
    const { data, error } = await client
      .from('auto_reminder_rules')
      .update({
        ...rule,
        updated_at: new Date().toISOString()
      })
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (error) {
      console.error('自動リマインドルール更新エラー:', error)
      throw new Error('自動リマインドルールの更新に失敗しました')
    }

    return data
  } else {
    // 作成
    return await createAutoReminderRule({
      clinic_id: clinicId,
      ...rule,
      intervals: rule.intervals || []
    } as AutoReminderRuleInsert)
  }
}

/**
 * 自動リマインドルールを削除
 */
export async function deleteAutoReminderRule(clinicId: string): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client
    .from('auto_reminder_rules')
    .delete()
    .eq('clinic_id', clinicId)

  if (error) {
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
  const client = getSupabaseClient()

  // 自動リマインドルールを取得
  const rule = await getAutoReminderRule(clinicId)
  if (!rule || !rule.enabled || rule.intervals.length === 0) {
    return []
  }

  const candidates: Array<{ patient_id: string; last_appointment_date: string; interval_sequence: number }> = []

  // 各段階について対象患者を検出
  for (const interval of rule.intervals) {
    // 最終予約日から指定期間経過した患者を検出
    const periodMonths = calculateMonths(interval.value, interval.unit)
    const targetDate = new Date()
    targetDate.setMonth(targetDate.getMonth() - periodMonths)

    // SQLクエリで患者を検出（簡易版）
    // 実際の実装では、以下の条件を満たす患者を抽出する必要があります：
    // 1. 最終予約日が targetDate 付近
    // 2. 現在予約がない
    // 3. 自動リマインドが有効
    // 4. 既にこの段階の通知を送信していない

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
      return value / 30 // 概算
    case 'weeks':
      return value / 4 // 概算
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
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('patient_notification_schedules')
    .select('auto_reminder_sequence, sent_at, status')
    .eq('patient_id', patientId)
    .eq('is_auto_reminder', true)
    .order('auto_reminder_sequence', { ascending: true })

  if (error) {
    console.error('自動リマインド履歴取得エラー:', error)
    return []
  }

  return data.map(d => ({
    sequence: d.auto_reminder_sequence || 0,
    sent_at: d.sent_at || '',
    status: d.status
  }))
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
  const client = getSupabaseClient()

  // 既存の予定されている自動リマインドをキャンセル
  await client
    .from('patient_notification_schedules')
    .update({ status: 'cancelled' })
    .eq('patient_id', patientId)
    .eq('is_auto_reminder', true)
    .eq('status', 'scheduled')
}
