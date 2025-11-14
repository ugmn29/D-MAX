/**
 * 病名と診療行為の整合性チェック
 * Disease-Treatment Validation Logic
 */

import { DiseaseCode, TreatmentCode } from '@/types/emr'

/**
 * ICD10カテゴリと診療行為カテゴリの対応表
 */
const DISEASE_TREATMENT_COMPATIBILITY = {
  // う蝕関連 (K02)
  'K02': {
    compatible: ['充填', 'インレー', '抜髄', '根管治療', 'CR', 'レジン', '麻酔'],
    incompatible: ['抜歯'],
    warning: []
  },

  // 歯髄疾患 (K04)
  'K04': {
    compatible: ['抜髄', '根管治療', '根管充填', '麻酔', '感染根管処置'],
    incompatible: ['充填', 'CR'],
    warning: ['抜歯']
  },

  // 歯肉・歯周疾患 (K05, K06)
  'K05': {
    compatible: ['スケーリング', 'SRP', '歯周基本治療', '歯科衛生実地指導', 'P処'],
    incompatible: ['充填', 'CR', '根管治療'],
    warning: []
  },
  'K06': {
    compatible: ['スケーリング', 'SRP', '歯周基本治療', '歯科衛生実地指導', '歯周外科', 'Fop'],
    incompatible: ['充填', 'CR'],
    warning: []
  },

  // 欠損歯 (K08)
  'K08': {
    compatible: ['ブリッジ', '義歯', 'インプラント', '抜歯'],
    incompatible: ['充填', 'CR', '根管治療'],
    warning: []
  },

  // その他の歯・歯周組織の疾患 (K00-K14)
  'K00': {
    compatible: [],
    incompatible: [],
    warning: []
  },
  'K01': {
    compatible: ['抜歯', '開窓'],
    incompatible: ['充填', 'CR'],
    warning: []
  },
  'K03': {
    compatible: ['充填', 'CR', 'コーティング'],
    incompatible: [],
    warning: []
  },
  'K07': {
    compatible: ['矯正', '咬合調整'],
    incompatible: [],
    warning: []
  },
  'K09': {
    compatible: ['嚢胞摘出', '抜歯'],
    incompatible: [],
    warning: []
  },
  'K10': {
    compatible: ['切開', '排膿'],
    incompatible: [],
    warning: []
  },
  'K11': {
    compatible: [],
    incompatible: [],
    warning: []
  },
  'K12': {
    compatible: ['含嗽', '軟膏塗布'],
    incompatible: [],
    warning: []
  },
  'K13': {
    compatible: ['切除', '生検'],
    incompatible: [],
    warning: []
  },
  'K14': {
    compatible: [],
    incompatible: [],
    warning: []
  }
}

/**
 * 検証結果の型定義
 */
export interface ValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
}

/**
 * 病名と診療行為の整合性をチェック
 */
export function validateDiseaseTreatmentCompatibility(
  diseases: Array<{ code: string; name: string; icd10Code: string }>,
  treatments: Array<{ code: string; name: string }>
): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  const suggestions: string[] = []

  if (diseases.length === 0) {
    warnings.push('病名が選択されていません')
    return { isValid: true, warnings, errors, suggestions }
  }

  if (treatments.length === 0) {
    warnings.push('診療行為が選択されていません')
    return { isValid: true, warnings, errors, suggestions }
  }

  // 各病名に対して診療行為をチェック
  for (const disease of diseases) {
    const icd10Category = disease.icd10Code.substring(0, 3) // K02, K05など
    const compatibility = DISEASE_TREATMENT_COMPATIBILITY[icd10Category]

    if (!compatibility) {
      // 未定義のカテゴリはスキップ
      continue
    }

    for (const treatment of treatments) {
      // 不適合チェック
      const isIncompatible = compatibility.incompatible.some(keyword =>
        treatment.name.includes(keyword)
      )

      if (isIncompatible) {
        errors.push(
          `⚠️ 「${disease.name}」に対して「${treatment.name}」は通常適用されません`
        )
      }

      // 警告チェック
      const hasWarning = compatibility.warning.some(keyword =>
        treatment.name.includes(keyword)
      )

      if (hasWarning) {
        warnings.push(
          `注意: 「${disease.name}」に対して「${treatment.name}」は慎重な判断が必要です`
        )
      }
    }

    // 推奨処置の提案
    if (compatibility.compatible.length > 0) {
      const hasCompatibleTreatment = treatments.some(treatment =>
        compatibility.compatible.some(keyword =>
          treatment.name.includes(keyword)
        )
      )

      if (!hasCompatibleTreatment && treatments.length > 0) {
        suggestions.push(
          `「${disease.name}」には通常、${compatibility.compatible.slice(0, 3).join('、')}などが適用されます`
        )
      }
    }
  }

  const isValid = errors.length === 0

  return { isValid, warnings, errors, suggestions }
}

/**
 * 病名のICD10カテゴリを取得
 */
export function getICD10Category(icd10Code: string): string {
  if (!icd10Code) return ''
  return icd10Code.substring(0, 3)
}

/**
 * 診療行為のカテゴリを取得（コードから推定）
 */
export function getTreatmentCategory(treatmentCode: string, treatmentName: string): string {
  // 診療行為コードや名称から大まかなカテゴリを推定
  if (treatmentName.includes('充填') || treatmentName.includes('CR')) return '充填'
  if (treatmentName.includes('抜髄') || treatmentName.includes('根管')) return '根管治療'
  if (treatmentName.includes('スケーリング') || treatmentName.includes('SRP')) return '歯周治療'
  if (treatmentName.includes('抜歯')) return '抜歯'
  if (treatmentName.includes('義歯') || treatmentName.includes('ブリッジ')) return '補綴'

  return 'その他'
}

/**
 * よく使われる病名と処置の組み合わせテンプレート
 */
export const COMMON_DISEASE_TREATMENT_TEMPLATES = [
  {
    id: 'c2-caries',
    name: 'C2う蝕の充填処置',
    diseases: [
      { code: '8407', name: 'う蝕第２度', icd10Code: 'K02' }
    ],
    treatments: [
      { code: '141000110', name: 'う蝕歯即時充填形成（単純なもの）', points: 52 },
      { code: '140000110', name: '浸潤麻酔', points: 40 }
    ]
  },
  {
    id: 'periodontitis-basic',
    name: '歯肉炎の基本治療',
    diseases: [
      { code: '8405', name: '慢性歯肉炎', icd10Code: 'K05' }
    ],
    treatments: [
      { code: '110018010', name: '歯周基本治療（スケーリング）', points: 68 },
      { code: '113001410', name: '歯科衛生実地指導料', points: 80 }
    ]
  },
  {
    id: 'pulpitis-rct',
    name: '歯髄炎の根管治療',
    diseases: [
      { code: '5209009', name: '急性歯髄炎', icd10Code: 'K04' }
    ],
    treatments: [
      { code: '140000110', name: '浸潤麻酔', points: 40 },
      { code: '142009410', name: '抜髄（前歯）', points: 240 }
    ]
  },
  {
    id: 'periodontitis-advanced',
    name: '歯周炎のSRP',
    diseases: [
      { code: '5243002', name: '慢性歯周炎', icd10Code: 'K05' }
    ],
    treatments: [
      { code: '140000110', name: '浸潤麻酔', points: 40 },
      { code: '110019410', name: 'SRP（１ブロック）', points: 200 }
    ]
  },
  {
    id: 'extraction',
    name: '抜歯',
    diseases: [
      { code: '5213006', name: '残根', icd10Code: 'K08' }
    ],
    treatments: [
      { code: '140000110', name: '浸潤麻酔', points: 40 },
      { code: '150000110', name: '抜歯（乳歯・前歯）', points: 130 }
    ]
  }
]
