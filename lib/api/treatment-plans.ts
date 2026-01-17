import { supabase } from '@/lib/supabase'

export interface TreatmentPlan {
  id: string
  clinic_id: string
  patient_id: string
  treatment_content: string
  treatment_menu_id?: string
  staff_type: 'doctor' | 'hygienist'
  tooth_number?: string
  tooth_position?: string
  priority: 1 | 2 | 3  // 1:高, 2:中, 3:低
  sort_order: number
  hygienist_menu_type?: 'TBI' | 'SRP' | 'PMT' | 'SPT' | 'P_JUBO' | 'OTHER'
  hygienist_menu_detail?: string
  periodontal_phase?: 'P_EXAM_1' | 'INITIAL' | 'P_EXAM_2' | 'SRP' | 'SRP_2' | 'SRP_3' | 'P_HEAVY_PREVENTION' | 'SURGERY' | 'SURGERY_2' | 'P_EXAM_3' | 'P_EXAM_4' | 'P_EXAM_5' | 'MAINTENANCE'
  periodontal_phase_detail?: any
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  completed_at?: string
  implemented_date?: string
  implemented_by?: string
  memo?: string
  subkarte_id?: string
  is_memo: boolean  // メモ・所見フラグ
  created_at: string
  updated_at: string
}

export interface CreateTreatmentPlanInput {
  treatment_content: string
  treatment_menu_id?: string
  staff_type: 'doctor' | 'hygienist'
  tooth_number?: string
  tooth_position?: string
  priority?: 1 | 2 | 3
  sort_order?: number
  hygienist_menu_type?: 'TBI' | 'SRP' | 'PMT' | 'SPT' | 'P_JUBO' | 'OTHER'
  hygienist_menu_detail?: string
  periodontal_phase?: 'P_EXAM_1' | 'INITIAL' | 'P_EXAM_2' | 'SRP' | 'SRP_2' | 'SRP_3' | 'P_HEAVY_PREVENTION' | 'SURGERY' | 'SURGERY_2' | 'P_EXAM_3' | 'P_EXAM_4' | 'P_EXAM_5' | 'MAINTENANCE'
  periodontal_phase_detail?: any
  memo?: string
  is_memo?: boolean  // メモ・所見フラグ
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
}

export interface UpdateTreatmentPlanInput {
  treatment_content?: string
  tooth_number?: string
  tooth_position?: string
  priority?: 1 | 2 | 3
  sort_order?: number
  hygienist_menu_type?: 'TBI' | 'SRP' | 'PMT' | 'SPT' | 'P_JUBO' | 'OTHER'
  hygienist_menu_detail?: string
  periodontal_phase?: 'P_EXAM_1' | 'INITIAL' | 'P_EXAM_2' | 'SRP' | 'SRP_2' | 'SRP_3' | 'P_HEAVY_PREVENTION' | 'SURGERY' | 'SURGERY_2' | 'P_EXAM_3' | 'P_EXAM_4' | 'P_EXAM_5' | 'MAINTENANCE'
  periodontal_phase_detail?: any
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  completed_at?: string | null
  implemented_date?: string
  implemented_by?: string
  memo?: string
  subkarte_id?: string
  is_memo?: boolean  // メモ・所見フラグ
}

/**
 * 患者の治療計画一覧を取得
 */
export async function getTreatmentPlans(
  clinicId: string,
  patientId: string
): Promise<TreatmentPlan[]> {
  try {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('治療計画取得エラー:', error)
    throw new Error('治療計画の取得に失敗しました')
  }
}

/**
 * 未完了の治療計画を取得（サブカルテTODO用）
 */
export async function getPendingTreatmentPlans(
  clinicId: string,
  patientId: string
): Promise<TreatmentPlan[]> {
  try {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .in('status', ['planned', 'in_progress'])
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('未完了治療計画取得エラー:', error)
    throw new Error('未完了治療計画の取得に失敗しました')
  }
}

/**
 * 治療計画を作成
 */
export async function createTreatmentPlan(
  clinicId: string,
  patientId: string,
  input: CreateTreatmentPlanInput
): Promise<TreatmentPlan> {
  try {
    // 現在の最大sort_orderを取得
    const { data: existingPlans } = await supabase
      .from('treatment_plans')
      .select('sort_order')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxSortOrder = existingPlans && existingPlans.length > 0
      ? existingPlans[0].sort_order
      : -1

    const { data, error } = await supabase
      .from('treatment_plans')
      .insert([{
        clinic_id: clinicId,
        patient_id: patientId,
        ...input,
        sort_order: input.sort_order ?? (maxSortOrder + 1),
        priority: input.priority ?? 2,
        status: 'planned'
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('治療計画作成エラー:', error)
    throw new Error('治療計画の作成に失敗しました')
  }
}

/**
 * 治療計画を更新
 */
export async function updateTreatmentPlan(
  clinicId: string,
  planId: string,
  input: UpdateTreatmentPlanInput
): Promise<TreatmentPlan> {
  try {
    const { data, error } = await supabase
      .from('treatment_plans')
      .update(input)
      .eq('id', planId)
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('治療計画更新エラー:', error)
    throw new Error('治療計画の更新に失敗しました')
  }
}

/**
 * 治療計画を削除
 */
export async function deleteTreatmentPlan(
  clinicId: string,
  planId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('treatment_plans')
      .delete()
      .eq('id', planId)
      .eq('clinic_id', clinicId)

    if (error) throw error
  } catch (error) {
    console.error('治療計画削除エラー:', error)
    throw new Error('治療計画の削除に失敗しました')
  }
}

/**
 * 治療計画を完了にする
 */
export async function completeTreatmentPlan(
  clinicId: string,
  planId: string,
  implementedBy?: string,
  memo?: string
): Promise<TreatmentPlan> {
  try {
    const { data, error} = await supabase
      .from('treatment_plans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        implemented_date: new Date().toISOString().split('T')[0],
        implemented_by: implementedBy,
        memo: memo
      })
      .eq('id', planId)
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('治療計画完了エラー:', error)
    throw new Error('治療計画の完了処理に失敗しました')
  }
}

/**
 * 治療計画の順序を更新
 */
export async function reorderTreatmentPlans(
  clinicId: string,
  patientId: string,
  planIds: string[]
): Promise<void> {
  try {
    // 各プランのsort_orderを更新
    const updates = planIds.map((planId, index) =>
      supabase
        .from('treatment_plans')
        .update({ sort_order: index })
        .eq('id', planId)
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)
    )

    await Promise.all(updates)
  } catch (error) {
    console.error('治療計画順序更新エラー:', error)
    throw new Error('治療計画の順序更新に失敗しました')
  }
}
