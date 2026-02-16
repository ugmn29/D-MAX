// Migrated to Prisma API Routes

/**
 * 診療行為の関連提案システム
 * Treatment Suggestion System
 *
 * 選択された診療行為に基づいて、関連する処置や加算を自動提案
 */

import { TreatmentCode } from '@/types/emr'

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

export interface TreatmentSuggestion {
  code: string
  name: string
  points: number
  reason: string // 提案理由
  type: 'addition' | 'related' | 'commonly_used' // 加算 | 関連処置 | 併用処置
  priority: number // 優先度 (1-5)
  autoAdd?: boolean // 自動追加すべきか
}

export interface ValidationResult {
  canAdd: boolean
  errors: string[]
  warnings: string[]
  inclusionConflicts: string[] // 包括されるため追加不要
  exclusionConflicts: string[] // 背反のため追加不可
}

/**
 * 選択された診療行為に基づいて関連処置を提案
 */
export async function suggestRelatedTreatments(
  selectedTreatmentCodes: string[],
  patientAge?: number,
  visitContext?: {
    isHoliday?: boolean
    isOvertime?: boolean
    isMidnight?: boolean
    isHomeVisit?: boolean
  }
): Promise<TreatmentSuggestion[]> {
  if (selectedTreatmentCodes.length === 0) {
    return []
  }

  try {
    const response = await fetch(`${baseUrl}/api/emr/treatment-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedTreatmentCodes,
        patientAge,
        visitContext,
      }),
    })

    if (!response.ok) {
      console.error('治療提案エラー:', response.statusText)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('治療提案エラー:', error)
    return []
  }
}

/**
 * メタデータから加算ルールを抽出（純粋関数 - クライアントサイドで使用可能）
 */
export function extractAdditionSuggestions(
  treatment: any,
  patientAge?: number,
  visitContext?: any
): TreatmentSuggestion[] {
  const suggestions: TreatmentSuggestion[] = []
  const metadata = treatment.metadata || {}
  const additionRules = metadata.addition_rules || {}

  // 年齢加算
  if (additionRules.age_based_additions && patientAge !== undefined) {
    additionRules.age_based_additions.forEach((rule: any) => {
      if (patientAge < 6 && rule.type === 'under_6_infant') {
        suggestions.push({
          code: treatment.code + '_age_add',
          name: `${treatment.name} - 6歳未満乳幼児加算`,
          points: Math.round(treatment.points * rule.rate),
          reason: `患者が${patientAge}歳のため、6歳未満乳幼児加算(+${Math.round(rule.rate * 100)}%)が適用できます`,
          type: 'addition',
          priority: 5,
          autoAdd: true
        })
      }
    })
  }

  // 時間帯加算
  if (additionRules.time_based_additions && visitContext) {
    additionRules.time_based_additions.forEach((rule: any) => {
      if (visitContext.isHoliday && rule.type === 'holiday') {
        suggestions.push({
          code: treatment.code + '_holiday_add',
          name: `${treatment.name} - 休日加算`,
          points: Math.round(treatment.points * rule.rate),
          reason: `休日診療のため、休日加算(+${Math.round(rule.rate * 100)}%)が適用できます`,
          type: 'addition',
          priority: 5,
          autoAdd: false
        })
      }
      if (visitContext.isOvertime && rule.type === 'overtime') {
        suggestions.push({
          code: treatment.code + '_overtime_add',
          name: `${treatment.name} - 時間外加算`,
          points: Math.round(treatment.points * rule.rate),
          reason: `時間外診療のため、時間外加算(+${Math.round(rule.rate * 100)}%)が適用できます`,
          type: 'addition',
          priority: 5,
          autoAdd: false
        })
      }
      if (visitContext.isMidnight && rule.type === 'midnight') {
        suggestions.push({
          code: treatment.code + '_midnight_add',
          name: `${treatment.name} - 深夜加算`,
          points: Math.round(treatment.points * rule.rate),
          reason: `深夜診療のため、深夜加算(+${Math.round(rule.rate * 100)}%)が適用できます`,
          type: 'addition',
          priority: 5,
          autoAdd: false
        })
      }
    })
  }

  return suggestions
}

/**
 * 処置名からキーワードを抽出（純粋関数）
 */
export function extractTreatmentKeywords(name: string): string[] {
  const keywords: string[] = []

  // 一般的な処置キーワード
  const commonKeywords = [
    '抜髄', '根管', '根充', '抜歯', '充填', '形成', '印象', '装着',
    '歯周', '歯肉', 'スケーリング', 'ルートプレーニング',
    'う蝕', '知覚過敏', '消炎'
  ]

  for (const keyword of commonKeywords) {
    if (name.includes(keyword)) {
      keywords.push(keyword)
    }
  }

  return keywords
}

/**
 * 診療行為の追加が可能かバリデーション
 */
export async function validateTreatmentAddition(
  newTreatmentCode: string,
  existingTreatmentCodes: string[]
): Promise<ValidationResult> {
  try {
    const response = await fetch(`${baseUrl}/api/emr/treatment-suggestions/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newTreatmentCode,
        existingTreatmentCodes,
      }),
    })

    if (!response.ok) {
      console.error('バリデーションエラー:', response.statusText)
      return {
        canAdd: true,
        errors: [],
        warnings: ['バリデーションの実行に失敗しました'],
        inclusionConflicts: [],
        exclusionConflicts: [],
      }
    }

    return await response.json()
  } catch (error) {
    console.error('バリデーションエラー:', error)
    return {
      canAdd: true,
      errors: [],
      warnings: ['バリデーションの実行に失敗しました'],
      inclusionConflicts: [],
      exclusionConflicts: [],
    }
  }
}

/**
 * 手動で関連処置を検索（ユーザーが明示的に検索する場合）
 */
export async function searchRelatedTreatmentsByKeyword(
  keyword: string,
  category?: string
): Promise<TreatmentCode[]> {
  try {
    const params = new URLSearchParams({
      q: keyword,
      limit: '20',
    })
    if (category) {
      params.set('category', category)
    }

    const response = await fetch(`${baseUrl}/api/emr/treatment-suggestions/search?${params}`)
    if (!response.ok) {
      console.error('関連処置検索エラー:', response.statusText)
      return []
    }
    return await response.json()
  } catch (error) {
    console.error('関連処置検索エラー:', error)
    return []
  }
}
