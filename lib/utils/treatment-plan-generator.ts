import type { VisualExamination, VisualToothData } from '@/lib/api/visual-exams'
import type { CreateTreatmentPlanInput } from '@/lib/api/treatment-plans'

// 生成された治療計画の提案
export interface TreatmentPlanProposal {
  treatment_content: string
  staff_type: 'doctor' | 'hygienist'
  tooth_numbers: number[]
  tooth_position?: string
  priority: 1 | 2 | 3
  hygienist_menu_type?: 'TBI' | 'SRP' | 'PMT' | 'SPT' | 'P_JUBO' | 'OTHER'
  notes?: string
  is_memo?: boolean  // メモ・所見フラグ（治療しない場合はtrue）
  periodontal_phase?: string  // 歯周治療フェーズ ('P_EXAM_1', 'INITIAL', 'SRP', etc.)
  allow_memo?: boolean  // メモ入力を許可するかどうか
  // 欠損歯の場合の治療方法選択用
  restoration_options?: Array<{
    label: string
    value: string
    description: string
  }>
}

/**
 * 歯番号をブロック（象限）ごとにグループ化
 * 右上: 11-18, 左上: 21-28, 左下: 31-38, 右下: 41-48
 */
function groupTeethByBlock(teeth: number[]): Array<{ label: string; teeth: number[] }> {
  const blocks: Record<string, { label: string; teeth: number[] }> = {
    upperRight: { label: '右上', teeth: [] },
    upperLeft: { label: '左上', teeth: [] },
    lowerLeft: { label: '左下', teeth: [] },
    lowerRight: { label: '右下', teeth: [] },
  }

  teeth.forEach(tooth => {
    const quadrant = Math.floor(tooth / 10)
    if (quadrant === 1) {
      blocks.upperRight.teeth.push(tooth)
    } else if (quadrant === 2) {
      blocks.upperLeft.teeth.push(tooth)
    } else if (quadrant === 3) {
      blocks.lowerLeft.teeth.push(tooth)
    } else if (quadrant === 4) {
      blocks.lowerRight.teeth.push(tooth)
    }
    // 乳歯の場合
    else if (quadrant === 5) {
      blocks.upperRight.teeth.push(tooth)
    } else if (quadrant === 6) {
      blocks.upperLeft.teeth.push(tooth)
    } else if (quadrant === 7) {
      blocks.lowerLeft.teeth.push(tooth)
    } else if (quadrant === 8) {
      blocks.lowerRight.teeth.push(tooth)
    }
  })

  // 歯が存在するブロックのみ返す（歯番号をソート）
  return Object.values(blocks)
    .filter(block => block.teeth.length > 0)
    .map(block => ({
      ...block,
      teeth: block.teeth.sort((a, b) => a - b),
    }))
}

/**
 * 視診データから治療計画を自動生成
 */
export function generateTreatmentPlansFromVisualExam(
  visualExam: VisualExamination
): TreatmentPlanProposal[] {
  const proposals: TreatmentPlanProposal[] = []
  const toothData = visualExam.tooth_data || []

  // う蝕（C1-C4）のグループ化
  const cariesByLevel: Record<string, number[]> = {
    CO: [],
    C1: [],
    C2: [],
    C3: [],
    C4: [],
  }

  // 欠損歯のリスト
  const missingTeeth: number[] = []

  // 歯データを分類
  toothData.forEach((tooth: VisualToothData) => {
    // う蝕の場合
    if (tooth.status === 'caries' && tooth.caries_level) {
      const level = tooth.caries_level
      if (cariesByLevel[level]) {
        cariesByLevel[level].push(tooth.tooth_number)
      }
    }

    // 欠損歯の場合（ただし'none', 'unerupted', 'impacted'は除外）
    // 'none': 大人で乳歯が正常に交換済み（歯番号自体が存在しない）
    // 'unerupted': まだ生えていない（治療対象外）
    // 'impacted': 埋伏（治療は手動で計画を立てる）
    if (tooth.status === 'missing') {
      missingTeeth.push(tooth.tooth_number)
    }
  })

  // CO: 予防処置（衛生士枠）- ブロックごとに分割
  if (cariesByLevel.CO.length > 0) {
    const coByBlock = groupTeethByBlock(cariesByLevel.CO)
    coByBlock.forEach(block => {
      proposals.push({
        treatment_content: '予防処置（フッ素塗布・シーラント）',
        staff_type: 'hygienist',
        tooth_numbers: block.teeth,
        tooth_position: block.label,
        priority: 3, // 低
        hygienist_menu_type: 'OTHER',
        notes: `要観察歯（CO）の予防処置 - ${block.label}`,
      })
    })
  }

  // C1, C2: CR充填 - ブロックごとに分割
  const c1c2Teeth = [...cariesByLevel.C1, ...cariesByLevel.C2]
  if (c1c2Teeth.length > 0) {
    const c1c2ByBlock = groupTeethByBlock(c1c2Teeth)
    c1c2ByBlock.forEach(block => {
      // このブロック内のC1とC2の本数を計算
      const c1Count = block.teeth.filter(t => cariesByLevel.C1.includes(t)).length
      const c2Count = block.teeth.filter(t => cariesByLevel.C2.includes(t)).length
      proposals.push({
        treatment_content: 'CR充填',
        staff_type: 'doctor',
        tooth_numbers: block.teeth,
        tooth_position: block.label,
        priority: c2Count > 0 ? 2 : 3, // C2があれば中、C1のみなら低
        notes: `う蝕治療 - ${block.label}（C1: ${c1Count}本, C2: ${c2Count}本）`,
      })
    })
  }

  // C3: 根管治療 - ブロックごとに分割
  if (cariesByLevel.C3.length > 0) {
    const c3ByBlock = groupTeethByBlock(cariesByLevel.C3)
    c3ByBlock.forEach(block => {
      proposals.push({
        treatment_content: '根管治療',
        staff_type: 'doctor',
        tooth_numbers: block.teeth,
        tooth_position: block.label,
        priority: 2, // 中
        notes: `重度う蝕（C3）の根管治療 - ${block.label}`,
      })
    })
  }

  // C4: 抜歯（高優先度）- ブロックごとに分割
  if (cariesByLevel.C4.length > 0) {
    const c4ByBlock = groupTeethByBlock(cariesByLevel.C4)
    c4ByBlock.forEach(block => {
      proposals.push({
        treatment_content: '抜歯',
        staff_type: 'doctor',
        tooth_numbers: block.teeth,
        tooth_position: block.label,
        priority: 1, // 高
        notes: `最重度う蝕（C4）- 抜歯適応 - ${block.label}`,
        allow_memo: true, // メモ入力可能
      })
    })
  }

  // 欠損歯: 治療方法選択が必要
  if (missingTeeth.length > 0) {
    // 欠損歯の状況を分析
    const missingGroups = analyzeMissingTeeth(missingTeeth, toothData)

    missingGroups.forEach(group => {
      proposals.push({
        treatment_content: '欠損補綴',
        staff_type: 'doctor',
        tooth_numbers: group.teeth,
        priority: 2, // 中
        notes: group.note,
        restoration_options: group.options,
      })
    })
  }

  return proposals
}

/**
 * 欠損歯を分析してグループ化
 */
function analyzeMissingTeeth(
  missingTeeth: number[],
  allToothData: VisualToothData[]
): Array<{
  teeth: number[]
  note: string
  options: Array<{ label: string; value: string; description: string }>
}> {
  const groups: Array<{
    teeth: number[]
    note: string
    options: Array<{ label: string; value: string; description: string }>
  }> = []

  // 連続した欠損をグループ化
  const sortedMissing = [...missingTeeth].sort((a, b) => a - b)
  let currentGroup: number[] = []

  sortedMissing.forEach((tooth, index) => {
    if (currentGroup.length === 0) {
      currentGroup.push(tooth)
    } else {
      const lastTooth = currentGroup[currentGroup.length - 1]
      // 連続している場合（同じ象限で歯番号が連続）
      if (Math.floor(tooth / 10) === Math.floor(lastTooth / 10) && tooth - lastTooth === 1) {
        currentGroup.push(tooth)
      } else {
        // グループ確定
        groups.push(createMissingToothGroup(currentGroup, allToothData))
        currentGroup = [tooth]
      }
    }

    // 最後の要素の場合
    if (index === sortedMissing.length - 1) {
      groups.push(createMissingToothGroup(currentGroup, allToothData))
    }
  })

  return groups
}

/**
 * 欠損歯グループに対する治療選択肢を生成
 */
function createMissingToothGroup(
  teeth: number[],
  allToothData: VisualToothData[]
): {
  teeth: number[]
  note: string
  options: Array<{ label: string; value: string; description: string }>
} {
  const options: Array<{ label: string; value: string; description: string }> = []

  // 単独欠損か複数欠損か
  const isSingleTooth = teeth.length === 1

  // 隣在歯の状態をチェック
  const hasAdjacentTeeth = teeth.every(tooth => {
    const quadrant = Math.floor(tooth / 10)
    const position = tooth % 10

    // 前後の歯が存在するかチェック
    const anteriorTooth = quadrant * 10 + (position - 1)
    const posteriorTooth = quadrant * 10 + (position + 1)

    const hasAnterior = allToothData.some(
      t => t.tooth_number === anteriorTooth && t.status !== 'missing'
    )
    const hasPosterior = allToothData.some(
      t => t.tooth_number === posteriorTooth && t.status !== 'missing'
    )

    return hasAnterior || hasPosterior
  })

  // インプラント（常に選択可能）
  options.push({
    label: 'インプラント',
    value: 'implant',
    description: '人工歯根を埋入する治療',
  })

  // ブリッジ（隣在歯がある場合のみ）
  if (hasAdjacentTeeth) {
    options.push({
      label: 'ブリッジ',
      value: 'bridge',
      description: '隣在歯を支台とした固定式補綴',
    })
  }

  // 部分床義歯（常に選択可能）
  options.push({
    label: '部分床義歯',
    value: 'partial_denture',
    description: '取り外し式の部分入れ歯',
  })

  // 経過観察
  options.push({
    label: '治療しない（経過観察）',
    value: 'observe',
    description: '現状維持で経過を観察',
  })

  const note = isSingleTooth
    ? `${teeth[0]}番の欠損に対する補綴処置`
    : `${teeth[0]}-${teeth[teeth.length - 1]}番の連続欠損に対する補綴処置`

  return { teeth, note, options }
}

/**
 * 治療計画提案を実際の登録用データに変換
 */
export function convertProposalToTreatmentPlan(
  proposal: TreatmentPlanProposal,
  clinicId: string,
  patientId: string,
  sortOrder: number,
  selectedOption?: string, // 欠損歯の場合の選択された治療方法
  memoText?: string // 追加のメモ入力
): CreateTreatmentPlanInput[] {
  const plans: CreateTreatmentPlanInput[] = []

  // 歯番号が複数ある場合、まとめて1つの計画として登録
  // （同じ処置を複数の歯に行う場合）
  const toothNumbersStr = proposal.tooth_numbers.length > 1
    ? proposal.tooth_numbers.join(', ')
    : proposal.tooth_numbers[0]?.toString() || ''

  let treatmentContent = proposal.treatment_content
  let isMemo = proposal.is_memo || false

  // 欠損歯で治療方法が選択された場合、内容を更新
  if (selectedOption && proposal.restoration_options) {
    const selected = proposal.restoration_options.find(opt => opt.value === selectedOption)
    if (selected) {
      // 歯番号は別フィールド(tooth_number)に保存されるため、ラベルのみにする
      treatmentContent = selected.label

      // 「治療しない（経過観察）」の場合はメモとして登録
      if (selectedOption === 'observe') {
        isMemo = true
        treatmentContent = '欠損：経過観察'
      }
    }
  }

  // メモテキストがある場合、治療内容に追加
  if (memoText && memoText.trim()) {
    treatmentContent = `${treatmentContent}【${memoText.trim()}】`
  }

  plans.push({
    clinic_id: clinicId,
    patient_id: patientId,
    treatment_content: treatmentContent,
    staff_type: proposal.staff_type,
    tooth_number: toothNumbersStr,
    priority: proposal.priority,
    sort_order: sortOrder,
    hygienist_menu_type: proposal.hygienist_menu_type,
    periodontal_phase: proposal.periodontal_phase,
    is_memo: isMemo,
  })

  return plans
}
