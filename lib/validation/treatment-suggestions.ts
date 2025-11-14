/**
 * 診療行為の関連処置提案ロジック
 * Treatment Suggestion Logic - suggests related treatments based on selection
 */

import { TreatmentCode } from '@/types/emr'

/**
 * 診療行為の関連処置マッピング
 * Common treatment associations based on Japanese dental practice
 */
export const TREATMENT_ASSOCIATIONS: Record<string, {
  suggestedTreatments: string[]  // Keywords to suggest
  reason: string                   // Reason for suggestion
}> = {
  // 充填処置関連
  '充填': {
    suggestedTreatments: ['浸潤麻酔', '形成'],
    reason: '充填処置には通常、麻酔と形成が必要です'
  },
  'CR': {
    suggestedTreatments: ['浸潤麻酔', '形成'],
    reason: 'CR充填には通常、麻酔と形成が必要です'
  },
  'レジン充填': {
    suggestedTreatments: ['浸潤麻酔', '形成'],
    reason: 'レジン充填には通常、麻酔と形成が必要です'
  },
  'インレー': {
    suggestedTreatments: ['浸潤麻酔', '形成', '印象採得', '咬合採得'],
    reason: 'インレー処置には形成、印象採得等が必要です'
  },

  // 根管治療関連
  '抜髄': {
    suggestedTreatments: ['浸潤麻酔', '根管長測定', '根管貼薬'],
    reason: '抜髄処置には麻酔と根管処置が必要です'
  },
  '根管治療': {
    suggestedTreatments: ['浸潤麻酔', '根管長測定', '根管貼薬', '根管充填'],
    reason: '根管治療には複数の根管処置が必要です'
  },
  '感染根管処置': {
    suggestedTreatments: ['根管長測定', '根管貼薬', '根管充填'],
    reason: '感染根管処置には根管処置が必要です'
  },

  // 歯周治療関連
  'スケーリング': {
    suggestedTreatments: ['歯科衛生実地指導'],
    reason: 'スケーリングには衛生指導が推奨されます'
  },
  'SRP': {
    suggestedTreatments: ['浸潤麻酔', '歯科衛生実地指導'],
    reason: 'SRPには麻酔と衛生指導が必要です'
  },
  '歯周外科': {
    suggestedTreatments: ['浸潤麻酔', '伝達麻酔'],
    reason: '歯周外科には麻酔が必要です'
  },

  // 抜歯関連
  '抜歯': {
    suggestedTreatments: ['浸潤麻酔', '伝達麻酔'],
    reason: '抜歯には麻酔が必要です'
  },

  // 補綴関連
  'クラウン': {
    suggestedTreatments: ['浸潤麻酔', '形成', '印象採得', '咬合採得', '仮封'],
    reason: 'クラウン処置には形成、印象採得等が必要です'
  },
  'ブリッジ': {
    suggestedTreatments: ['浸潤麻酔', '形成', '印象採得', '咬合採得', '仮封'],
    reason: 'ブリッジ処置には形成、印象採得等が必要です'
  },
  '義歯': {
    suggestedTreatments: ['印象採得', '咬合採得'],
    reason: '義歯作成には印象採得等が必要です'
  },

  // その他
  '嚢胞摘出': {
    suggestedTreatments: ['浸潤麻酔', '伝達麻酔'],
    reason: '外科処置には麻酔が必要です'
  },
  '切開': {
    suggestedTreatments: ['浸潤麻酔'],
    reason: '切開処置には麻酔が必要です'
  }
}

/**
 * 包括される診療行為の定義
 * Treatments that are included (bundled) in other treatments
 */
export const INCLUSION_RULES: Record<string, {
  includedIn: string[]      // Which treatments include this one
  explanation: string       // Explanation of the inclusion
}> = {
  '形成': {
    includedIn: ['充填', 'CR', 'レジン充填', 'インレー', 'クラウン', 'ブリッジ'],
    explanation: '形成は充填・修復処置に包括されています'
  },
  '窩洞形成': {
    includedIn: ['充填', 'CR', 'レジン充填', 'インレー'],
    explanation: '窩洞形成は充填処置に包括されています'
  },
  '根管長測定': {
    includedIn: ['抜髄', '感染根管処置'],
    explanation: '根管長測定は根管治療に包括されています'
  },
  '根管貼薬': {
    includedIn: ['抜髄', '感染根管処置'],
    explanation: '根管貼薬は根管治療に包括されています'
  },
  '仮封': {
    includedIn: ['抜髄', '根管治療', '感染根管処置'],
    explanation: '仮封は根管治療に包括されています'
  }
}

/**
 * 診療行為に対する関連処置を提案
 * Suggest related treatments based on selected treatment
 */
export function getSuggestedTreatments(
  selectedTreatment: TreatmentCode,
  alreadySelectedTreatments: TreatmentCode[]
): {
  suggestions: string[]
  reason: string
} {
  const treatmentName = selectedTreatment.name

  // Already selected treatment names (lowercase for comparison)
  const selectedNames = alreadySelectedTreatments.map(t => t.name.toLowerCase())

  // Find matching association rule
  for (const [keyword, association] of Object.entries(TREATMENT_ASSOCIATIONS)) {
    if (treatmentName.includes(keyword)) {
      // Filter out suggestions that are already selected
      const newSuggestions = association.suggestedTreatments.filter(suggestion =>
        !selectedNames.some(name => name.includes(suggestion.toLowerCase()))
      )

      if (newSuggestions.length > 0) {
        return {
          suggestions: newSuggestions,
          reason: association.reason
        }
      }
    }
  }

  return {
    suggestions: [],
    reason: ''
  }
}

/**
 * 包括チェック - 選択した診療行為が既に他の処置に含まれていないかチェック
 * Check if selected treatment is already included in other selected treatments
 */
export function checkInclusionViolations(
  newTreatment: TreatmentCode,
  alreadySelectedTreatments: TreatmentCode[]
): {
  isIncluded: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  let isIncluded = false

  const treatmentName = newTreatment.name

  // Check if this treatment is included in any already-selected treatment
  for (const [keyword, rule] of Object.entries(INCLUSION_RULES)) {
    if (treatmentName.includes(keyword)) {
      // Check if any selected treatment includes this one
      for (const selected of alreadySelectedTreatments) {
        const matchesIncludedIn = rule.includedIn.some(includingTreatment =>
          selected.name.includes(includingTreatment)
        )

        if (matchesIncludedIn) {
          isIncluded = true
          warnings.push(
            `⚠️ ${rule.explanation}（既に「${selected.name}」が選択されています）`
          )
        }
      }
    }
  }

  // Reverse check: if newly selected treatment includes any already-selected treatment
  for (const selected of alreadySelectedTreatments) {
    for (const [keyword, rule] of Object.entries(INCLUSION_RULES)) {
      if (selected.name.includes(keyword)) {
        const matchesIncludedIn = rule.includedIn.some(includingTreatment =>
          treatmentName.includes(includingTreatment)
        )

        if (matchesIncludedIn) {
          warnings.push(
            `💡 「${selected.name}」は「${newTreatment.name}」に包括されているため、別途算定できません`
          )
        }
      }
    }
  }

  return {
    isIncluded,
    warnings
  }
}

/**
 * 背反チェック - 同時算定できない診療行為のチェック
 * Check for mutually exclusive treatments
 */
export const EXCLUSION_RULES: Record<string, {
  excludes: string[]
  explanation: string
}> = {
  '抜髄': {
    excludes: ['感染根管処置'],
    explanation: '抜髄と感染根管処置は同日算定できません'
  },
  '感染根管処置': {
    excludes: ['抜髄'],
    explanation: '感染根管処置と抜髄は同日算定できません'
  },
  'スケーリング': {
    excludes: ['SRP'],
    explanation: 'スケーリングとSRPは同月算定できません'
  },
  'SRP': {
    excludes: ['スケーリング'],
    explanation: 'SRPとスケーリングは同月算定できません'
  }
}

/**
 * 背反チェック実行
 */
export function checkExclusionViolations(
  newTreatment: TreatmentCode,
  alreadySelectedTreatments: TreatmentCode[]
): {
  hasConflict: boolean
  errors: string[]
} {
  const errors: string[] = []
  let hasConflict = false

  const treatmentName = newTreatment.name

  for (const [keyword, rule] of Object.entries(EXCLUSION_RULES)) {
    if (treatmentName.includes(keyword)) {
      for (const selected of alreadySelectedTreatments) {
        const matchesExclusion = rule.excludes.some(excludedTreatment =>
          selected.name.includes(excludedTreatment)
        )

        if (matchesExclusion) {
          hasConflict = true
          errors.push(
            `❌ ${rule.explanation}（「${selected.name}」が既に選択されています）`
          )
        }
      }
    }
  }

  return {
    hasConflict,
    errors
  }
}

/**
 * 全体的な診療行為バリデーション
 * Comprehensive treatment validation
 */
export function validateTreatmentSelection(
  newTreatment: TreatmentCode,
  alreadySelectedTreatments: TreatmentCode[]
): {
  canAdd: boolean
  suggestions: string[]
  inclusionWarnings: string[]
  exclusionErrors: string[]
  suggestionReason: string
} {
  // Get suggestions for related treatments
  const { suggestions, reason } = getSuggestedTreatments(
    newTreatment,
    alreadySelectedTreatments
  )

  // Check inclusion violations
  const { warnings: inclusionWarnings } = checkInclusionViolations(
    newTreatment,
    alreadySelectedTreatments
  )

  // Check exclusion violations
  const { hasConflict, errors: exclusionErrors } = checkExclusionViolations(
    newTreatment,
    alreadySelectedTreatments
  )

  return {
    canAdd: !hasConflict,  // Can add if no exclusion conflicts
    suggestions,
    inclusionWarnings,
    exclusionErrors,
    suggestionReason: reason
  }
}
