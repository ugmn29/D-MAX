/**
 * 診療行為の関連提案システム
 * Treatment Suggestion System
 *
 * 選択された診療行為に基づいて、関連する処置や加算を自動提案
 */

import { supabase } from '@/lib/utils/supabase-client'
import { TreatmentCode } from '@/types/emr'

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

  const suggestions: TreatmentSuggestion[] = []
  const suggestedCodes = new Set<string>()

  // 直近に追加された処置のみを対象（最後の1件）
  const latestCode = selectedTreatmentCodes[selectedTreatmentCodes.length - 1]

  const { data: treatment, error } = await supabase
    .from('treatment_codes')
    .select('*')
    .eq('code', latestCode)
    .single()

  if (error || !treatment) return []

  // 1. メタデータから加算ルールを抽出
  const additionSuggestions = extractAdditionSuggestions(
    treatment,
    patientAge,
    visitContext
  )
  additionSuggestions.forEach(s => {
    if (!suggestedCodes.has(s.code)) {
      suggestions.push(s)
      suggestedCodes.add(s.code)
    }
  })

  // 2. 前後処置の提案（優先度高）
  const sequentialSuggestions = await findSequentialTreatments(treatment)
  sequentialSuggestions.forEach(s => {
    if (!suggestedCodes.has(s.code) && !selectedTreatmentCodes.includes(s.code)) {
      suggestions.push(s)
      suggestedCodes.add(s.code)
    }
  })

  // 3. 同じカテゴリで併用される処置を検索
  const relatedSuggestions = await findRelatedTreatments(treatment)
  relatedSuggestions.forEach(s => {
    if (!suggestedCodes.has(s.code) && !selectedTreatmentCodes.includes(s.code)) {
      suggestions.push(s)
      suggestedCodes.add(s.code)
    }
  })

  // 優先度順にソート、重複削除
  const uniqueSuggestions = Array.from(
    new Map(suggestions.map(s => [s.code, s])).values()
  )

  return uniqueSuggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8) // 最大8件まで
}

/**
 * メタデータから加算ルールを抽出
 */
function extractAdditionSuggestions(
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
 * 同じカテゴリで併用される処置を検索
 */
async function findRelatedTreatments(treatment: any): Promise<TreatmentSuggestion[]> {
  const suggestions: TreatmentSuggestion[] = []

  // 処置名からキーワードを抽出して関連処置を検索
  const treatmentKeywords = extractTreatmentKeywords(treatment.name)

  // カテゴリベースの関連処置マッピング（改善版）
  const relatedPatterns: { [key: string]: Array<{ keywords: string[], reason: string, excludeKeywords?: string[] }> } = {
    '309': [ // 歯内療法（抜髄・根管治療）
      {
        keywords: ['根管貼薬', '根管拡大', '根管洗浄'],
        reason: '根管治療の基本処置',
        excludeKeywords: ['加算', '顕微鏡']
      },
      {
        keywords: ['感染根管', '根充'],
        reason: '根管治療の後続処置',
        excludeKeywords: ['加算']
      }
    ],
    '310': [ // 抜歯
      {
        keywords: ['消炎', '口腔内'],
        reason: '抜歯に伴う処置',
        excludeKeywords: ['悪性', '腫瘍', '手術']
      },
      {
        keywords: ['難抜歯', '埋伏'],
        reason: '難症例の抜歯加算',
        excludeKeywords: []
      }
    ],
    '313': [ // 充填
      {
        keywords: ['う蝕'],
        reason: '充填前のう蝕処置',
        excludeKeywords: ['歯髄', '根管']
      },
      {
        keywords: ['知覚過敏', 'ＳＣ'],
        reason: '充填前後の処置',
        excludeKeywords: []
      }
    ],
    '316': [ // 歯冠修復
      {
        keywords: ['支台歯形成', '形成加算'],
        reason: '歯冠修復の形成',
        excludeKeywords: []
      },
      {
        keywords: ['印象採得', '咬合採得'],
        reason: '歯冠修復の印象・咬合記録',
        excludeKeywords: []
      }
    ]
  }

  const category = treatment.code.substring(0, 3)
  const patterns = relatedPatterns[category]

  if (!patterns) return suggestions

  // 各パターンで関連処置を検索
  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      let query = supabase
        .from('treatment_codes')
        .select('code, name, points')
        .ilike('name', `%${keyword}%`)
        .neq('code', treatment.code) // 自分自身を除外
        .limit(3)

      const { data: relatedTreatments, error } = await query

      if (!error && relatedTreatments) {
        for (const t of relatedTreatments) {
          // 除外キーワードチェック
          const shouldExclude = pattern.excludeKeywords?.some(ex =>
            t.name.includes(ex)
          )

          if (!shouldExclude) {
            suggestions.push({
              code: t.code,
              name: t.name,
              points: t.points,
              reason: pattern.reason,
              type: 'related',
              priority: 3,
              autoAdd: false
            })
          }
        }
      }
    }
  }

  return suggestions
}

/**
 * 処置名からキーワードを抽出
 */
function extractTreatmentKeywords(name: string): string[] {
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
 * 前後処置の提案（治療の流れに基づく）
 */
async function findSequentialTreatments(treatment: any): Promise<TreatmentSuggestion[]> {
  const suggestions: TreatmentSuggestion[] = []

  // 処置名から次のステップを判定（より詳細なパターンマッチング）
  const sequentialPatterns = [
    {
      trigger: /抜髄/,
      next: [
        { keyword: '根管貼薬', excludeKeywords: ['加算', '抜歯前提'], reason: '抜髄後の基本処置' },
        { keyword: '感染根管', excludeKeywords: ['加算'], reason: '感染している場合の処置' }
      ]
    },
    {
      trigger: /根管貼薬/,
      next: [
        { keyword: '根管充填', excludeKeywords: ['加算'], reason: '根管治療の最終ステップ' },
        { keyword: '感染根管', excludeKeywords: ['加算'], reason: '追加の根管治療' }
      ]
    },
    {
      trigger: /抜歯/,
      next: [
        { keyword: '難抜歯', excludeKeywords: [], reason: '難症例の場合の加算' },
        { keyword: '埋伏', excludeKeywords: [], reason: '埋伏歯の場合の加算' }
      ]
    },
    {
      trigger: /充填/,
      next: [
        { keyword: 'う蝕', excludeKeywords: ['歯髄', '根管'], reason: '充填前のう蝕除去' },
        { keyword: '知覚過敏', excludeKeywords: [], reason: '充填後の知覚過敏処置' },
        { keyword: 'ＳＣ', excludeKeywords: [], reason: '知覚過敏抑制処置' }
      ]
    },
    {
      trigger: /形成/,
      next: [
        { keyword: '印象', excludeKeywords: ['形成'], reason: '形成後の印象採得' },
        { keyword: '仮封', excludeKeywords: [], reason: '形成後の仮封' },
        { keyword: '咬合採得', excludeKeywords: [], reason: '形成後の咬合記録' }
      ]
    },
    {
      trigger: /印象採得/,
      next: [
        { keyword: '咬合採得', excludeKeywords: [], reason: '印象採得と併せて行う処置' },
        { keyword: '仮着', excludeKeywords: [], reason: '印象採得後の仮着' }
      ]
    }
  ]

  for (const pattern of sequentialPatterns) {
    if (pattern.trigger.test(treatment.name)) {
      for (const nextItem of pattern.next) {
        const { data: nextTreatments, error } = await supabase
          .from('treatment_codes')
          .select('code, name, points')
          .ilike('name', `%${nextItem.keyword}%`)
          .neq('code', treatment.code)
          .limit(2)

        if (!error && nextTreatments) {
          for (const t of nextTreatments) {
            // 除外キーワードチェック
            const shouldExclude = nextItem.excludeKeywords?.some(ex =>
              t.name.includes(ex)
            )

            if (!shouldExclude) {
              suggestions.push({
                code: t.code,
                name: t.name,
                points: t.points,
                reason: nextItem.reason,
                type: 'commonly_used',
                priority: 4,
                autoAdd: false
              })
            }
          }
        }
      }
      break // 最初にマッチしたパターンのみ
    }
  }

  return suggestions
}

/**
 * 診療行為の追加が可能かバリデーション
 */
export async function validateTreatmentAddition(
  newTreatmentCode: string,
  existingTreatmentCodes: string[]
): Promise<ValidationResult> {
  const result: ValidationResult = {
    canAdd: true,
    errors: [],
    warnings: [],
    inclusionConflicts: [],
    exclusionConflicts: []
  }

  // 新規処置の情報を取得
  const { data: newTreatment, error } = await supabase
    .from('treatment_codes')
    .select('*')
    .eq('code', newTreatmentCode)
    .single()

  if (error || !newTreatment) {
    result.canAdd = false
    result.errors.push('診療行為が見つかりません')
    return result
  }

  // 既存処置との包括・背反チェック
  for (const existingCode of existingTreatmentCodes) {
    const { data: existingTreatment } = await supabase
      .from('treatment_codes')
      .select('*')
      .eq('code', existingCode)
      .single()

    if (!existingTreatment) continue

    // 包括チェック（新規処置が既存処置に包括される）
    if (existingTreatment.inclusion_rules?.includes(newTreatmentCode)) {
      result.inclusionConflicts.push(
        `${newTreatment.name}は${existingTreatment.name}に包括されるため、別途算定できません`
      )
      result.canAdd = false
    }

    // 包括チェック（既存処置が新規処置に包括される）
    if (newTreatment.inclusion_rules?.includes(existingCode)) {
      result.warnings.push(
        `${existingTreatment.name}は${newTreatment.name}に包括されるため、削除を検討してください`
      )
    }

    // 背反チェック
    const exclusionRules = newTreatment.exclusion_rules || {}

    if (exclusionRules.simultaneous?.includes(existingCode)) {
      result.exclusionConflicts.push(
        `${newTreatment.name}と${existingTreatment.name}は同時算定できません`
      )
      result.canAdd = false
    }

    if (exclusionRules.same_day?.includes(existingCode)) {
      result.exclusionConflicts.push(
        `${newTreatment.name}と${existingTreatment.name}は同日算定できません`
      )
      result.canAdd = false
    }

    if (exclusionRules.same_month?.includes(existingCode)) {
      result.warnings.push(
        `${newTreatment.name}と${existingTreatment.name}は同月算定の制限があります`
      )
    }
  }

  return result
}

/**
 * 手動で関連処置を検索（ユーザーが明示的に検索する場合）
 */
export async function searchRelatedTreatmentsByKeyword(
  keyword: string,
  category?: string
): Promise<TreatmentCode[]> {
  let query = supabase
    .from('treatment_codes')
    .select('*')
    .or(`name.ilike.%${keyword}%,code.ilike.%${keyword}%`)

  if (category) {
    query = query.ilike('code', `${category}%`)
  }

  const { data, error } = await query.limit(20)

  if (error) {
    console.error('関連処置検索エラー:', error)
    return []
  }

  return data || []
}
