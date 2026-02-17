// Migrated to Prisma API Routes

/**
 * 病名と診療行為のマッピング
 * Disease-Treatment Mapping (Dentis/Julea style)
 *
 * 病名を選択すると、その病名に対応する適切な処置を提案
 */

import type { TreatmentSuggestion } from './treatment-suggestions'

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * キーワードで処置コードを検索するヘルパー
 */
async function fetchTreatmentsByKeyword(keyword: string, limit: number = 3): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      keyword,
      limit: String(limit),
    })
    const response = await fetch(`${baseUrl}/api/emr/treatment-codes?${params}`)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

/**
 * 病名コードから推奨される診療行為を提案
 */
export async function suggestTreatmentsByDisease(
  diseaseCode: string,
  diseaseName: string,
  toothNumber?: string
): Promise<TreatmentSuggestion[]> {
  const suggestions: TreatmentSuggestion[] = []

  // 病名から治療パターンを判定
  const treatmentPattern = identifyTreatmentPattern(diseaseName)

  if (!treatmentPattern) return []

  // パターンに基づいて処置を検索
  for (const keyword of treatmentPattern.keywords) {
    const treatments = await fetchTreatmentsByKeyword(keyword, 3)

    if (treatments) {
      for (const t of treatments) {
        // 除外キーワードチェック
        const shouldExclude = treatmentPattern.excludeKeywords?.some(ex =>
          t.name.includes(ex)
        )

        if (!shouldExclude) {
          suggestions.push({
            code: t.code,
            name: t.name,
            points: t.points,
            reason: treatmentPattern.reason,
            type: 'related',
            priority: 5, // 病名ベースの提案は最優先
            autoAdd: false
          })
        }
      }
    }
  }

  return suggestions
}

/**
 * 病名から治療パターンを識別（純粋関数）
 */
interface TreatmentPattern {
  keywords: string[]
  reason: string
  excludeKeywords?: string[]
}

export function identifyTreatmentPattern(diseaseName: string): TreatmentPattern | null {
  // う蝕（虫歯）関連
  if (diseaseName.includes('う蝕') || diseaseName.includes('齲') || diseaseName.includes('C')) {
    // う蝕の程度を判定
    if (diseaseName.includes('第３度') || diseaseName.includes('C3') || diseaseName.includes('歯髄炎')) {
      return {
        keywords: ['抜髄', '根管'],
        reason: 'C3には抜髄処置が必要です',
        excludeKeywords: ['加算', '抜歯']
      }
    } else if (diseaseName.includes('第２度') || diseaseName.includes('C2')) {
      return {
        keywords: ['充填', 'う蝕'],
        reason: 'C2には充填処置が適しています',
        excludeKeywords: ['根管', '抜髄', '加算']
      }
    } else if (diseaseName.includes('第１度') || diseaseName.includes('C1')) {
      return {
        keywords: ['う蝕', 'エナメル質'],
        reason: 'C1には予防処置が適しています',
        excludeKeywords: ['充填', '根管', '抜髄']
      }
    } else {
      // 一般的なう蝕
      return {
        keywords: ['充填', 'う蝕'],
        reason: 'う蝕には充填処置が基本です',
        excludeKeywords: ['根管', '抜髄', '加算']
      }
    }
  }

  // 歯髄炎関連
  if (diseaseName.includes('歯髄炎') || diseaseName.includes('歯髄壊死')) {
    return {
      keywords: ['抜髄', '根管'],
      reason: '歯髄炎には抜髄処置が必要です',
      excludeKeywords: ['加算', '抜歯']
    }
  }

  // 根尖性歯周炎関連
  if (diseaseName.includes('根尖') || diseaseName.includes('根周') || diseaseName.includes('Per')) {
    return {
      keywords: ['感染根管', '根管', '根充'],
      reason: '根尖性歯周炎には感染根管処置が必要です',
      excludeKeywords: ['加算', '抜歯']
    }
  }

  // 歯周病関連
  if (diseaseName.includes('歯周') || diseaseName.includes('歯肉炎') || diseaseName.includes('P')) {
    if (diseaseName.includes('重度') || diseaseName.includes('P3') || diseaseName.includes('P4')) {
      return {
        keywords: ['歯周', 'スケーリング', 'ルートプレーニング', 'フラップ'],
        reason: '重度歯周病には歯周外科処置が必要です',
        excludeKeywords: ['加算']
      }
    } else {
      return {
        keywords: ['スケーリング', 'ルートプレーニング', '歯周'],
        reason: '歯周病には歯周基本治療が必要です',
        excludeKeywords: ['加算', 'フラップ', '手術']
      }
    }
  }

  // 歯肉炎
  if (diseaseName.includes('歯肉炎')) {
    return {
      keywords: ['スケーリング', '歯肉'],
      reason: '歯肉炎にはスケーリングが効果的です',
      excludeKeywords: ['加算', 'ルートプレーニング']
    }
  }

  // 知覚過敏
  if (diseaseName.includes('知覚過敏')) {
    return {
      keywords: ['知覚過敏'],
      reason: '知覚過敏には知覚過敏抑制処置を行います',
      excludeKeywords: []
    }
  }

  // 残根
  if (diseaseName.includes('残根')) {
    return {
      keywords: ['抜歯', '残根'],
      reason: '残根は抜歯が必要です',
      excludeKeywords: []
    }
  }

  // 埋伏歯
  if (diseaseName.includes('埋伏')) {
    return {
      keywords: ['抜歯', '埋伏'],
      reason: '埋伏歯は抜歯が必要です',
      excludeKeywords: []
    }
  }

  // 智歯周囲炎
  if (diseaseName.includes('智歯') || diseaseName.includes('周囲炎')) {
    return {
      keywords: ['消炎', '抜歯'],
      reason: '智歯周囲炎には消炎処置または抜歯を行います',
      excludeKeywords: ['悪性', '腫瘍']
    }
  }

  // デフォルト（該当なし）
  return null
}

/**
 * 複数の病名から総合的に処置を提案
 */
export async function suggestTreatmentsByMultipleDiseases(
  diseases: Array<{ code: string, name: string, tooth?: string }>
): Promise<TreatmentSuggestion[]> {
  const allSuggestions: TreatmentSuggestion[] = []
  const suggestedCodes = new Set<string>()

  // 各病名から提案を生成
  for (const disease of diseases) {
    const suggestions = await suggestTreatmentsByDisease(
      disease.code,
      disease.name,
      disease.tooth
    )

    suggestions.forEach(s => {
      if (!suggestedCodes.has(s.code)) {
        allSuggestions.push(s)
        suggestedCodes.add(s.code)
      }
    })
  }

  // 優先度順にソート
  return allSuggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 10) // 最大10件
}

/**
 * 病名・歯式・処置の組み合わせをバリデーション（純粋関数）
 */
export function validateDiseaseToothTreatment(
  diseaseName: string,
  toothNumber: string,
  treatmentName: string
): {
  valid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  let valid = true

  // 乳歯・永久歯のチェック
  const toothNum = parseInt(toothNumber)
  const isPrimaryTooth = toothNumber.includes('A') || toothNumber.includes('B') ||
                         toothNumber.includes('C') || toothNumber.includes('D') ||
                         toothNumber.includes('E')

  // 乳歯に対する抜髄の警告
  if (isPrimaryTooth && treatmentName.includes('抜髄')) {
    warnings.push('乳歯の抜髄は慎重に判断してください（乳歯抜髄の適応を確認）')
  }

  // 智歯以外への智歯周囲炎診断
  if (diseaseName.includes('智歯') && toothNum < 18 && toothNum > 48) {
    warnings.push('智歯（18, 28, 38, 48）以外に智歯周囲炎の診断がされています')
    valid = false
  }

  return { valid, warnings }
}
