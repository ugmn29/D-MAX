/**
 * PDFから抽出した保険点数ルール（静的データ）
 * データベースマイグレーションなしで使用可能
 */

export interface TreatmentRule {
  treatmentNamePattern: string; // 診療行為名のパターン（部分一致）
  detailed_rules?: {
    unit?: string;
    conditional_points?: Record<string, number>;
    additions?: Record<string, number>;
    conditions?: string[];
    inclusions?: string[];
    note?: string;
  };
  addition_rules: {
    age_based_additions: Array<{
      type: string;
      rate: number;
      description: string;
    }>;
    time_based_additions: Array<{
      type: string;
      rate: number;
      description: string;
    }>;
    visit_based_additions: Array<{
      type: string;
      rate: number;
      description: string;
    }>;
  };
}

/**
 * カテゴリ別の加算ルール定義
 */
export const ADDITION_RULES = {
  // 処置の加算ルール
  treatment: {
    age_based_additions: [
      {
        type: 'under_6_infant',
        rate: 0.5,
        description: '６歳未満の乳幼児に対する処置（+50%）'
      },
      {
        type: 'difficult_patient',
        rate: 0.5,
        description: '著しく歯科診療が困難な者に対する処置（+50%）'
      }
    ],
    time_based_additions: [
      {
        type: 'holiday',
        rate: 1.6,
        description: '休日加算１（1,000点以上、+160%）'
      },
      {
        type: 'holiday',
        rate: 0.8,
        description: '休日加算２（150点以上、+80%）'
      },
      {
        type: 'overtime',
        rate: 0.8,
        description: '時間外加算１（1,000点以上、+80%）'
      },
      {
        type: 'overtime',
        rate: 0.4,
        description: '時間外加算２（150点以上、+40%）'
      },
      {
        type: 'midnight',
        rate: 1.6,
        description: '深夜加算１（1,000点以上、+160%）'
      },
      {
        type: 'midnight',
        rate: 0.8,
        description: '深夜加算２（150点以上、+80%）'
      }
    ],
    visit_based_additions: [
      {
        type: 'home_visit',
        rate: 0.5,
        description: '歯科訪問診療時の処置（+50%）'
      }
    ]
  },

  // 手術の加算ルール
  surgery: {
    age_based_additions: [],
    time_based_additions: [],
    visit_based_additions: [
      {
        type: 'home_visit',
        rate: 0.5,
        description: '歯科訪問診療時の手術（+50%）'
      }
    ]
  },

  // 歯冠修復の加算ルール
  crown: {
    age_based_additions: [
      {
        type: 'under_6_infant',
        rate: 0.7,
        description: '６歳未満の乳幼児に対する歯冠修復（+70%）'
      }
    ],
    time_based_additions: [],
    visit_based_additions: [
      {
        type: 'home_visit',
        rate: 0.7,
        description: '歯科訪問診療時の歯冠修復（印象採得等、+70%）'
      }
    ]
  }
};

/**
 * 診療行為別の詳細ルール
 */
export const TREATMENT_RULES: TreatmentRule[] = [
  // 抜髄
  {
    treatmentNamePattern: '抜髄',
    detailed_rules: {
      unit: '1歯につき',
      conditional_points: {
        after_pulp_preservation_3months_single: 42,
        after_direct_pulp_protection_1month_single: 80,
        after_pulp_preservation_3months_double: 234,
        after_direct_pulp_protection_1month_double: 272,
        after_pulp_preservation_3months_triple: 408,
        after_direct_pulp_protection_1month_triple: 446
      },
      conditions: [
        '歯髄温存療法を行った日から起算して3月以内の場合は減算',
        '直接歯髄保護処置を行った日から起算して1月以内の場合は減算'
      ]
    },
    addition_rules: ADDITION_RULES.treatment
  },

  // 抜歯（前歯・臼歯）
  {
    treatmentNamePattern: '抜歯',
    detailed_rules: {
      unit: '1歯につき',
      additions: {
        difficult_extraction: 210
      },
      conditions: ['難抜歯加算: 歯根肥大、骨の癒着歯等の場合 +210点']
    },
    addition_rules: ADDITION_RULES.surgery
  },

  // 抜歯（埋伏歯）
  {
    treatmentNamePattern: '埋伏',
    detailed_rules: {
      unit: '1歯につき',
      additions: {
        mandibular_impacted: 120
      },
      conditions: [
        '完全埋伏歯（骨性）又は水平埋伏智歯に限り算定',
        '下顎完全埋伏智歯（骨性）又は下顎水平埋伏智歯の場合 +120点'
      ]
    },
    addition_rules: ADDITION_RULES.surgery
  },

  // 歯髄保護処置
  {
    treatmentNamePattern: '歯髄温存',
    detailed_rules: {
      unit: '1歯につき',
      conditions: ['経過観察中のう蝕処置は所定点数に含まれる']
    },
    addition_rules: ADDITION_RULES.treatment
  },

  // う蝕処置
  {
    treatmentNamePattern: 'う蝕',
    detailed_rules: {
      unit: '1歯1回につき',
      inclusions: ['貼薬', '仮封', '特定薬剤'],
      note: '貼薬、仮封及び特定薬剤の費用並びに特定保険医療材料料は、所定点数に含まれる'
    },
    addition_rules: ADDITION_RULES.treatment
  },

  // 充填
  {
    treatmentNamePattern: '充填',
    addition_rules: ADDITION_RULES.treatment
  },

  // 根管治療
  {
    treatmentNamePattern: '根管',
    addition_rules: ADDITION_RULES.treatment
  }
];

/**
 * 診療行為名からルールを取得
 */
export function getTreatmentRuleByName(treatmentName: string): TreatmentRule | null {
  return TREATMENT_RULES.find(rule =>
    treatmentName.includes(rule.treatmentNamePattern)
  ) || null;
}

/**
 * カテゴリから加算ルールを取得
 */
export function getAdditionRulesByCategory(category: 'treatment' | 'surgery' | 'crown') {
  return ADDITION_RULES[category];
}
