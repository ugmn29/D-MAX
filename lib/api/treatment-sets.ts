/**
 * 処置セットAPI関数
 * Treatment Sets API Functions
 */

import { supabase } from '@/lib/utils/supabase-client'

export interface TreatmentSet {
  id: string
  name: string
  code: string
  description: string | null
  category: string | null
  display_order: number
  is_active: boolean
}

export interface TreatmentSetItem {
  id: string
  set_id: string
  treatment_code: string
  is_required: boolean
  display_order: number
  default_selected: boolean
  notes: string | null
  // 処置情報を含める
  treatment?: {
    code: string
    name: string
    points: number
  }
}

export interface TreatmentRequiredField {
  id: string
  treatment_code: string
  field_name: string
  field_type: 'text' | 'number' | 'select' | 'checkbox'
  field_options: any
  is_required: boolean
  placeholder: string | null
  validation_rule: string | null
  help_text: string | null
  display_order: number
}

/**
 * 全ての処置セットを取得
 */
export async function getTreatmentSets(): Promise<TreatmentSet[]> {
  try {
    const { data, error } = await supabase
      .from('treatment_sets')
      .select('*')
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('処置セット取得エラー:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('処置セット取得エラー:', error)
    return []
  }
}

/**
 * 処置セットの構成要素を取得（処置情報を含む）
 */
export async function getTreatmentSetItems(setId: string): Promise<TreatmentSetItem[]> {
  try {
    const { data, error } = await supabase
      .from('treatment_set_items')
      .select('*')
      .eq('set_id', setId)
      .order('display_order')

    if (error) {
      console.error('処置セット構成要素取得エラー:', error)
      return []
    }

    if (!data || data.length === 0) return []

    // 各アイテムの処置情報を取得
    const itemsWithTreatments = await Promise.all(
      data.map(async (item) => {
        const { data: treatment } = await supabase
          .from('treatment_codes')
          .select('code, name, points')
          .eq('code', item.treatment_code)
          .single()

        return {
          ...item,
          treatment: treatment || undefined
        }
      })
    )

    return itemsWithTreatments
  } catch (error) {
    console.error('処置セット構成要素取得エラー:', error)
    return []
  }
}

/**
 * 病名から推奨される処置セットを取得
 */
export async function getSuggestedTreatmentSets(diseaseCode: string): Promise<TreatmentSet[]> {
  try {
    const { data, error } = await supabase
      .from('disease_treatment_set_mapping')
      .select(`
        priority,
        treatment_sets (*)
      `)
      .eq('disease_code', diseaseCode)
      .order('priority', { ascending: false })

    if (error) {
      console.error('推奨処置セット取得エラー:', error)
      return []
    }

    if (!data || data.length === 0) return []

    return data.map((d: any) => d.treatment_sets).filter(Boolean)
  } catch (error) {
    console.error('推奨処置セット取得エラー:', error)
    return []
  }
}

/**
 * 病名から推奨される処置セットを取得（病名名でも検索）
 */
export async function getSuggestedTreatmentSetsByDiseaseName(
  diseaseName: string
): Promise<TreatmentSet[]> {
  try {
    // 病名名からパターンマッチングで処置セットを推奨
    const setCode = identifyTreatmentSetByDiseaseName(diseaseName)

    if (!setCode) return []

    const { data, error } = await supabase
      .from('treatment_sets')
      .select('*')
      .eq('code', setCode)
      .eq('is_active', true)
      .single()

    if (error || !data) return []

    return [data]
  } catch (error) {
    console.error('推奨処置セット取得エラー:', error)
    return []
  }
}

/**
 * 病名から処置セットコードを推定
 */
function identifyTreatmentSetByDiseaseName(diseaseName: string): string | null {
  // う蝕第3度、歯髄炎 → 抜髄セット
  if (
    diseaseName.includes('う蝕第３度') ||
    diseaseName.includes('C3') ||
    diseaseName.includes('歯髄炎')
  ) {
    return 'SET_PULPECTOMY'
  }

  // 根尖性歯周炎 → 感染根管セット
  if (diseaseName.includes('根尖') || diseaseName.includes('Per')) {
    return 'SET_INFECTED_ROOT_CANAL'
  }

  // う蝕第2度 → 充填セット
  if (diseaseName.includes('う蝕第２度') || diseaseName.includes('C2')) {
    return 'SET_FILLING'
  }

  // う蝕第1度 → 充填セット（予防的充填）
  if (diseaseName.includes('う蝕第１度') || diseaseName.includes('C1')) {
    return 'SET_FILLING'
  }

  // 残根、埋伏歯 → 抜歯セット
  if (diseaseName.includes('残根') || diseaseName.includes('埋伏')) {
    return 'SET_EXTRACTION'
  }

  // 歯周病 → スケーリングセット
  if (diseaseName.includes('歯周') || diseaseName.includes('歯肉炎')) {
    return 'SET_SCALING'
  }

  return null
}

/**
 * 処置の必須記載項目を取得
 */
export async function getTreatmentRequiredFields(
  treatmentCode: string
): Promise<TreatmentRequiredField[]> {
  try {
    const { data, error } = await supabase
      .from('treatment_required_fields')
      .select('*')
      .eq('treatment_code', treatmentCode)
      .order('display_order')

    if (error) {
      console.error('必須記載項目取得エラー:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('必須記載項目取得エラー:', error)
    return []
  }
}

/**
 * セットコードから処置セットを取得
 */
export async function getTreatmentSetByCode(code: string): Promise<TreatmentSet | null> {
  try {
    const { data, error } = await supabase
      .from('treatment_sets')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    console.error('処置セット取得エラー:', error)
    return null
  }
}
