/**
 * EMR API Functions
 * 電子カルテAPI関数
 */

import { supabase } from '@/lib/supabase'
import { DiseaseCode, TreatmentCode, MedicalRecord } from '@/types/emr'

/**
 * 病名コードを検索
 * Search disease codes by name or code
 */
export async function searchDiseaseCodes(
  query: string,
  limit: number = 20,
  dentalOnly: boolean = false
): Promise<DiseaseCode[]> {
  try {
    // C1/C2/C3などの入力を正式名称に変換
    let searchQuery = query
    const cariesMap: { [key: string]: string } = {
      'c1': 'う蝕第１度',
      'c2': 'う蝕第２度',
      'c3': 'う蝕第３度',
      'c4': 'う蝕第４度',
      'C1': 'う蝕第１度',
      'C2': 'う蝕第２度',
      'C3': 'う蝕第３度',
      'C4': 'う蝕第４度'
    }

    // クエリがC1～C4の場合、正式名称も検索対象に含める
    const expandedQueries: string[] = [query]
    if (cariesMap[query]) {
      expandedQueries.push(cariesMap[query])
    }

    // 複数の検索条件でOR検索
    const orConditions = expandedQueries.flatMap(q => [
      `name.ilike.%${q}%`,
      `kana.ilike.%${q}%`,
      `code.ilike.%${q}%`
    ]).join(',')

    let queryBuilder = supabase
      .from('disease_codes')
      .select('*')
      .or(orConditions)
      .limit(limit)

    // 歯科関連のみフィルタ（オプション）
    if (dentalOnly) {
      queryBuilder = queryBuilder.eq('is_dental', true)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error('病名検索エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('病名検索エラー:', error)
    return []
  }
}

/**
 * 診療行為コードを検索
 * Search treatment codes by name or code
 */
export async function searchTreatmentCodes(
  query: string,
  limit: number = 20
): Promise<TreatmentCode[]> {
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .select('*')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error('診療行為検索エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('診療行為検索エラー:', error)
    return []
  }
}

/**
 * 病名コードをIDで取得
 * Get disease code by ID
 */
export async function getDiseaseCodeById(id: string): Promise<DiseaseCode | null> {
  try {
    const { data, error } = await supabase
      .from('disease_codes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('病名取得エラー:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('病名取得エラー:', error)
    return null
  }
}

/**
 * 診療行為コードをIDで取得
 * Get treatment code by ID
 */
export async function getTreatmentCodeById(id: string): Promise<TreatmentCode | null> {
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('診療行為取得エラー:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('診療行為取得エラー:', error)
    return null
  }
}

/**
 * カルテ記録を保存
 * Save medical record
 */
export async function saveMedicalRecord(
  clinicId: string,
  patientId: string,
  record: Partial<MedicalRecord>
): Promise<MedicalRecord | null> {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        clinic_id: clinicId,
        patient_id: patientId,
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('カルテ保存エラー:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('カルテ保存エラー:', error)
    return null
  }
}

/**
 * カルテ記録を更新
 * Update medical record
 */
export async function updateMedicalRecord(
  recordId: string,
  updates: Partial<MedicalRecord>
): Promise<MedicalRecord | null> {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('カルテ更新エラー:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('カルテ更新エラー:', error)
    return null
  }
}

/**
 * 患者のカルテ記録一覧を取得
 * Get patient's medical records
 */
export async function getPatientMedicalRecords(
  patientId: string,
  limit: number = 50
): Promise<MedicalRecord[]> {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('カルテ記録取得エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('カルテ記録取得エラー:', error)
    return []
  }
}

/**
 * カルテ記録を削除
 * Delete medical record
 */
export async function deleteMedicalRecord(recordId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId)

    if (error) {
      console.error('カルテ削除エラー:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('カルテ削除エラー:', error)
    return false
  }
}

/**
 * 包括ルールをチェック
 * Check inclusion rules for treatments
 */
export async function checkInclusionRules(
  treatmentCodes: string[]
): Promise<{ included: string[], warnings: string[] }> {
  // TODO: Implement inclusion rule checking logic
  // 包括されている診療行為を検出
  return {
    included: [],
    warnings: []
  }
}

/**
 * 背反ルールをチェック
 * Check exclusion rules for treatments
 */
export async function checkExclusionRules(
  treatmentCodes: string[]
): Promise<{ conflicts: string[], warnings: string[] }> {
  // TODO: Implement exclusion rule checking logic
  // 同日・同月・同時算定不可をチェック
  return {
    conflicts: [],
    warnings: []
  }
}

/**
 * 算定回数制限をチェック
 * Check frequency limits for treatments
 */
export async function checkFrequencyLimits(
  patientId: string,
  treatmentCode: string
): Promise<{ exceeded: boolean, warning: string | null }> {
  // TODO: Implement frequency limit checking logic
  // 過去の算定回数をチェック
  return {
    exceeded: false,
    warning: null
  }
}

/**
 * 保険点数を計算
 * Calculate insurance points
 */
export function calculateInsurancePoints(
  treatments: Array<{ code: string, points: number, count?: number }>
): number {
  return treatments.reduce((total, treatment) => {
    const count = treatment.count || 1
    return total + (treatment.points * count)
  }, 0)
}

/**
 * 加算条件を考慮した点数計算
 * Calculate points with addition rules
 */
export interface CalculationContext {
  patientAge?: number
  isHoliday?: boolean
  isOvertime?: boolean
  isMidnight?: boolean
  isHomeVisit?: boolean
  isDifficultPatient?: boolean
  basePoints: number
}

export interface AdditionRule {
  type: string
  rate: number
  description: string
}

export function calculatePointsWithAdditions(
  basePoints: number,
  additionRules: {
    age_based_additions?: AdditionRule[]
    time_based_additions?: AdditionRule[]
    visit_based_additions?: AdditionRule[]
  },
  context: CalculationContext
): { total: number, appliedAdditions: Array<{ type: string, points: number, description: string }> } {
  let total = basePoints
  const appliedAdditions: Array<{ type: string, points: number, description: string }> = []

  // 年齢による加算
  if (additionRules.age_based_additions) {
    for (const rule of additionRules.age_based_additions) {
      if (context.patientAge !== undefined && context.patientAge < 6 && rule.type === 'under_6_infant') {
        const additionPoints = Math.round(basePoints * rule.rate)
        total += additionPoints
        appliedAdditions.push({
          type: '年齢加算(6歳未満)',
          points: additionPoints,
          description: rule.description
        })
        break // 同じカテゴリの加算は1つのみ
      } else if (context.isDifficultPatient && rule.type === 'difficult_patient') {
        const additionPoints = Math.round(basePoints * rule.rate)
        total += additionPoints
        appliedAdditions.push({
          type: '困難患者加算',
          points: additionPoints,
          description: rule.description
        })
        break
      }
    }
  }

  // 時間帯による加算
  if (additionRules.time_based_additions) {
    // 最も高い加算率を適用
    let highestTimeAddition: { rule: AdditionRule, type: string } | null = null

    for (const rule of additionRules.time_based_additions) {
      if (context.isHoliday && rule.type === 'holiday') {
        if (!highestTimeAddition || rule.rate > highestTimeAddition.rule.rate) {
          highestTimeAddition = { rule, type: '休日加算' }
        }
      } else if (context.isOvertime && rule.type === 'overtime') {
        if (!highestTimeAddition || rule.rate > highestTimeAddition.rule.rate) {
          highestTimeAddition = { rule, type: '時間外加算' }
        }
      } else if (context.isMidnight && rule.type === 'midnight') {
        if (!highestTimeAddition || rule.rate > highestTimeAddition.rule.rate) {
          highestTimeAddition = { rule, type: '深夜加算' }
        }
      }
    }

    if (highestTimeAddition) {
      const additionPoints = Math.round(basePoints * highestTimeAddition.rule.rate)
      total += additionPoints
      appliedAdditions.push({
        type: highestTimeAddition.type,
        points: additionPoints,
        description: highestTimeAddition.rule.description
      })
    }
  }

  // 訪問診療による加算
  if (context.isHomeVisit && additionRules.visit_based_additions && additionRules.visit_based_additions.length > 0) {
    const rule = additionRules.visit_based_additions[0]
    const additionPoints = Math.round(basePoints * rule.rate)
    total += additionPoints
    appliedAdditions.push({
      type: '訪問診療加算',
      points: additionPoints,
      description: rule.description
    })
  }

  return {
    total: Math.round(total),
    appliedAdditions
  }
}

/**
 * 診療行為の詳細ルールを取得
 * Get detailed rules for a treatment
 */
export async function getTreatmentDetailedRules(treatmentId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .select('metadata')
      .eq('id', treatmentId)
      .single()

    if (error) {
      console.error('詳細ルール取得エラー:', error)
      return null
    }

    return data?.metadata || null
  } catch (error) {
    console.error('詳細ルール取得エラー:', error)
    return null
  }
}

/**
 * 自費料金を計算
 * Calculate self-pay amount
 */
export function calculateSelfPayAmount(
  items: Array<{ unitPrice: number, quantity: number }>
): number {
  return items.reduce((total, item) => {
    return total + (item.unitPrice * item.quantity)
  }, 0)
}
