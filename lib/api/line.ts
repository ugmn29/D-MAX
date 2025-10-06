import { getSupabaseClient } from '@/lib/utils/supabase-client'
import {
  LineUserLink,
  LineUserLinkInsert,
  LineUserLinkUpdate,
  LineConversationState,
  LineConversationStateInsert,
  LineConversationStateUpdate,
  LineLinkRequest,
  PatientRelationship
} from '@/types/notification'

/**
 * LINE User IDで連携を取得
 */
export async function getLineUserLinks(lineUserId: string, clinicId?: string): Promise<LineUserLink[]> {
  const client = getSupabaseClient()
  let query = client
    .from('line_user_links')
    .select('*')
    .eq('line_user_id', lineUserId)

  if (clinicId) {
    query = query.eq('clinic_id', clinicId)
  }

  const { data, error } = await query
    .order('is_primary', { ascending: false })
    .order('linked_at', { ascending: true })

  if (error) {
    console.error('LINE連携取得エラー:', error)
    throw new Error('LINE連携の取得に失敗しました')
  }

  return data || []
}

/**
 * 患者IDでLINE連携を取得
 */
export async function getPatientLineLinks(patientId: string): Promise<LineUserLink[]> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('line_user_links')
    .select('*')
    .eq('patient_id', patientId)

  if (error) {
    console.error('患者LINE連携取得エラー:', error)
    throw new Error('患者のLINE連携の取得に失敗しました')
  }

  return data || []
}

/**
 * プライマリ患者を取得
 */
export async function getPrimaryPatient(lineUserId: string): Promise<LineUserLink | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('line_user_links')
    .select('*')
    .eq('line_user_id', lineUserId)
    .eq('is_primary', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // プライマリがない場合、最初に連携した患者を返す
      const links = await getLineUserLinks(lineUserId)
      return links.length > 0 ? links[0] : null
    }
    console.error('プライマリ患者取得エラー:', error)
    return null
  }

  return data
}

/**
 * LINE User IDと患者を紐付け
 */
export async function linkLineUserToPatient(
  request: LineLinkRequest
): Promise<LineUserLink> {
  const client = getSupabaseClient()

  // 患者番号と生年月日で患者を検索
  const { data: patients, error: searchError } = await client
    .from('patients')
    .select('id, name, name_kana, birthdate')
    .eq('clinic_id', request.clinic_id)
    .eq('patient_number', request.patient_number)

  if (searchError) {
    console.error('患者検索エラー:', searchError)
    throw new Error('患者の検索に失敗しました')
  }

  if (!patients || patients.length === 0) {
    throw new Error('該当する患者が見つかりません')
  }

  // 生年月日の照合（8桁数字で照合）
  const patient = patients.find(p => {
    if (!p.birthdate) return false
    const birthdate = new Date(p.birthdate)
    const birthdateStr = `${birthdate.getFullYear()}${String(birthdate.getMonth() + 1).padStart(2, '0')}${String(birthdate.getDate()).padStart(2, '0')}`
    return birthdateStr === request.birthdate
  })

  if (!patient) {
    throw new Error('生年月日が一致しません')
  }

  // 既に連携されているかチェック
  const { data: existing } = await client
    .from('line_user_links')
    .select('*')
    .eq('line_user_id', request.line_user_id)
    .eq('patient_id', patient.id)
    .single()

  if (existing) {
    throw new Error('既に連携されています')
  }

  // 現在の連携数を確認
  const existingLinks = await getLineUserLinks(request.line_user_id)
  const isPrimary = existingLinks.length === 0 // 最初の連携はプライマリ

  // 連携を作成
  const linkData: LineUserLinkInsert = {
    clinic_id: request.clinic_id,
    line_user_id: request.line_user_id,
    patient_id: patient.id,
    relationship: request.relationship || (isPrimary ? 'self' : null),
    nickname: patient.name,
    is_primary: isPrimary,
    linked_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data: link, error: linkError } = await client
    .from('line_user_links')
    .insert(linkData)
    .select()
    .single()

  if (linkError) {
    console.error('LINE連携作成エラー:', linkError)
    throw new Error('LINE連携の作成に失敗しました')
  }

  // 患者名を追加して返す
  return {
    ...link,
    patient_name: patient.name
  }
}

/**
 * 患者切り替え
 */
export async function switchPatient(
  lineUserId: string,
  patientId: string
): Promise<void> {
  const client = getSupabaseClient()

  // 該当の連携を検索
  const { data: link, error } = await client
    .from('line_user_links')
    .select('*')
    .eq('line_user_id', lineUserId)
    .eq('patient_id', patientId)
    .single()

  if (error || !link) {
    throw new Error('該当の連携が見つかりません')
  }

  // last_selected_at を更新
  await client
    .from('line_user_links')
    .update({
      last_selected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', link.id)

  // 対話状態のコンテキストを更新
  await updateConversationContext(lineUserId, { selectedPatientId: patientId })
}

/**
 * LINE連携を削除
 */
export async function unlinkLineUser(lineUserId: string, patientId: string): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client
    .from('line_user_links')
    .delete()
    .eq('line_user_id', lineUserId)
    .eq('patient_id', patientId)

  if (error) {
    console.error('LINE連携削除エラー:', error)
    throw new Error('LINE連携の削除に失敗しました')
  }
}

// ========================================
// 対話状態管理
// ========================================

/**
 * 対話状態を取得
 */
export async function getConversationState(lineUserId: string): Promise<LineConversationState | null> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('line_conversation_states')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('対話状態取得エラー:', error)
    return null
  }

  return data
}

/**
 * 対話状態を作成/更新
 */
export async function upsertConversationState(
  lineUserId: string,
  state: LineConversationStateUpdate
): Promise<LineConversationState> {
  const client = getSupabaseClient()

  const stateData: LineConversationStateInsert = {
    line_user_id: lineUserId,
    ...state,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await client
    .from('line_conversation_states')
    .upsert(stateData, { onConflict: 'line_user_id' })
    .select()
    .single()

  if (error) {
    console.error('対話状態更新エラー:', error)
    throw new Error('対話状態の更新に失敗しました')
  }

  return data
}

/**
 * 対話状態をリセット
 */
export async function resetConversationState(lineUserId: string): Promise<void> {
  await upsertConversationState(lineUserId, {
    state: 'idle',
    context: {},
    expires_at: null
  })
}

/**
 * 対話コンテキストを更新
 */
export async function updateConversationContext(
  lineUserId: string,
  contextUpdate: Record<string, any>
): Promise<void> {
  const current = await getConversationState(lineUserId)
  const currentContext = current?.context || {}

  await upsertConversationState(lineUserId, {
    state: current?.state || 'idle',
    context: { ...currentContext, ...contextUpdate }
  })
}

/**
 * 対話状態を次のステップに進める
 */
export async function advanceConversationState(
  lineUserId: string,
  nextState: string,
  contextUpdate?: Record<string, any>
): Promise<void> {
  const current = await getConversationState(lineUserId)
  const currentContext = current?.context || {}

  // タイムアウト設定（15分後）
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 15)

  await upsertConversationState(lineUserId, {
    state: nextState as any,
    context: { ...currentContext, ...(contextUpdate || {}) },
    expires_at: expiresAt.toISOString()
  })
}

/**
 * ブロック状態を更新
 */
export async function updateBlockStatus(
  lineUserId: string,
  patientId: string,
  isBlocked: boolean
): Promise<void> {
  const client = getSupabaseClient()
  await client
    .from('line_user_links')
    .update({
      is_blocked: isBlocked,
      updated_at: new Date().toISOString()
    })
    .eq('line_user_id', lineUserId)
    .eq('patient_id', patientId)
}

/**
 * 最終やり取り日時を更新
 */
export async function updateLastInteraction(lineUserId: string, patientId: string): Promise<void> {
  const client = getSupabaseClient()
  await client
    .from('line_user_links')
    .update({
      last_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('line_user_id', lineUserId)
    .eq('patient_id', patientId)
}

/**
 * 現在選択中の患者を取得
 */
export async function getCurrentPatient(lineUserId: string): Promise<string | null> {
  const state = await getConversationState(lineUserId)
  if (state?.context?.selectedPatientId) {
    return state.context.selectedPatientId
  }

  // コンテキストにない場合、プライマリ患者を取得
  const primary = await getPrimaryPatient(lineUserId)
  return primary?.patient_id || null
}
