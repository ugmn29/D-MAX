import type { PeriodontalExam, PeriodontalToothData } from '@/lib/api/periodontal-exams'
import type { TreatmentPlanProposal } from './treatment-plan-generator'

// 部位名のマッピング
const POSITION_NAMES: Record<string, string> = {
  mb: '近心頬側',
  b: '頬側',
  db: '遠心頬側',
  ml: '近心舌側',
  l: '舌側',
  dl: '遠心舌側',
}

/**
 * P検査データから治療計画を自動生成
 */
export function generateTreatmentPlansFromPeriodontalExam(
  perioExam: PeriodontalExam
): TreatmentPlanProposal[] {
  const proposals: TreatmentPlanProposal[] = []
  const toothData = perioExam.tooth_data || []
  const phase = perioExam.examination_phase

  // P検査2の場合: 4mm以上のポケットがあればSRPを生成
  if (phase === 'P_EXAM_2') {
    const srpNeeded = analyzeSRPNeeds(toothData)

    if (srpNeeded.length > 0) {
      // 歯番号ごとにSRP計画を作成（部位情報は含めるが、歯ごとに1つのTODO）
      srpNeeded.forEach(({ toothNumber, positions }) => {
        const positionText = positions.map(p => POSITION_NAMES[p] || p).join('、')
        const depthInfo = positions.map(p => `${POSITION_NAMES[p]}: ${getDepth(toothData, toothNumber, p)}mm`).join(', ')

        proposals.push({
          treatment_content: `SRP`,
          staff_type: 'hygienist',
          tooth_numbers: [toothNumber],
          tooth_position: positionText,
          priority: 2, // 中
          hygienist_menu_type: 'SRP',
          periodontal_phase: 'SRP',
          notes: `P検査2で4mm以上のポケットを検出（${depthInfo}）`,
        })
      })
    } else {
      // 3mm以下で炎症ありの場合はP重防
      const hasInflammation = checkInflammation(toothData)
      if (hasInflammation) {
        proposals.push({
          treatment_content: 'P重防（歯周病重症化予防治療）',
          staff_type: 'hygienist',
          tooth_numbers: [], // 全顎対象
          priority: 3, // 低
          hygienist_menu_type: 'P_JUBO',
          periodontal_phase: 'P_HEAVY_PREVENTION',
          notes: 'P検査2で4mm未満だが炎症あり - 重症化予防が必要',
        })
      }
    }
  }

  // P検査3の場合: SRP後の再評価
  if (phase === 'P_EXAM_3') {
    const deepPockets = findDeepPockets(toothData)

    if (deepPockets.length > 0) {
      const maxDepth = Math.max(...deepPockets.map(p => p.depth))

      if (maxDepth >= 6) {
        // 6mm以上残存 → 歯周外科を提案
        proposals.push({
          treatment_content: '歯周外科',
          staff_type: 'doctor',
          tooth_numbers: deepPockets.map(p => p.toothNumber),
          priority: 1, // 高
          periodontal_phase: 'SURGERY',
          notes: `P検査3で6mm以上のポケットが残存（最大${maxDepth}mm） - 歯周外科の適応`,
        })
      } else if (maxDepth >= 4) {
        // 4-5mm残存 → 再SRPまたはSPT
        const hasInflammation = checkInflammation(toothData)

        if (hasInflammation) {
          // 炎症あり → 再SRP（歯番号ごと）
          deepPockets.forEach(({ toothNumber, positions }) => {
            const positionText = positions.map(p => POSITION_NAMES[p] || p).join('、')

            proposals.push({
              treatment_content: `再SRP`,
              staff_type: 'hygienist',
              tooth_numbers: [toothNumber],
              tooth_position: positionText,
              priority: 2, // 中
              hygienist_menu_type: 'SRP',
              periodontal_phase: 'SRP',
              notes: `P検査3で4mm以上残存 + 炎症あり - 再SRPが必要`,
            })
          })
        } else {
          // 炎症なし → SPT
          proposals.push({
            treatment_content: 'SPT（歯周病安定期治療）',
            staff_type: 'hygienist',
            tooth_numbers: [],
            priority: 3, // 低
            hygienist_menu_type: 'SPT',
            periodontal_phase: 'MAINTENANCE',
            notes: 'P検査3で4mm以上あるが炎症なし - SPTで経過観察',
          })
        }
      } else {
        // 3mm以下に改善
        const hasInflammation = checkInflammation(toothData)

        if (hasInflammation) {
          // 炎症あり → P重防
          proposals.push({
            treatment_content: 'P重防（歯周病重症化予防治療）',
            staff_type: 'hygienist',
            tooth_numbers: [],
            priority: 3, // 低
            hygienist_menu_type: 'P_JUBO',
            periodontal_phase: 'P_HEAVY_PREVENTION',
            notes: 'P検査3で3mm以下だが炎症あり - 重症化予防が必要',
          })
        } else {
          // 炎症なし → SPT（メンテナンスへ移行）
          proposals.push({
            treatment_content: 'SPT（歯周病安定期治療）',
            staff_type: 'hygienist',
            tooth_numbers: [],
            priority: 3, // 低
            hygienist_menu_type: 'SPT',
            periodontal_phase: 'MAINTENANCE',
            notes: 'P検査3で良好な結果 - SPTでメンテナンス',
          })
        }
      }
    }
  }

  return proposals
}

/**
 * SRPが必要な歯と部位を分析（4mm以上）
 */
function analyzeSRPNeeds(toothData: PeriodontalToothData[]): Array<{
  toothNumber: number
  positions: string[]
}> {
  const result: Array<{ toothNumber: number; positions: string[] }> = []

  toothData.forEach(tooth => {
    if (tooth.is_missing) return

    const deepPositions: string[] = []
    const positions = ['mb', 'b', 'db', 'ml', 'l', 'dl'] as const

    positions.forEach(pos => {
      const depth = tooth[`ppd_${pos}` as keyof PeriodontalToothData] as number | undefined
      if (depth && depth >= 4) {
        deepPositions.push(pos)
      }
    })

    if (deepPositions.length > 0) {
      result.push({
        toothNumber: tooth.tooth_number,
        positions: deepPositions,
      })
    }
  })

  return result
}

/**
 * 深いポケット（4mm以上）を検出
 */
function findDeepPockets(toothData: PeriodontalToothData[]): Array<{
  toothNumber: number
  positions: string[]
  depth: number
}> {
  const result: Array<{ toothNumber: number; positions: string[]; depth: number }> = []

  toothData.forEach(tooth => {
    if (tooth.is_missing) return

    const deepPositions: string[] = []
    let maxDepth = 0
    const positions = ['mb', 'b', 'db', 'ml', 'l', 'dl'] as const

    positions.forEach(pos => {
      const depth = tooth[`ppd_${pos}` as keyof PeriodontalToothData] as number | undefined
      if (depth && depth >= 4) {
        deepPositions.push(pos)
        maxDepth = Math.max(maxDepth, depth)
      }
    })

    if (deepPositions.length > 0) {
      result.push({
        toothNumber: tooth.tooth_number,
        positions: deepPositions,
        depth: maxDepth,
      })
    }
  })

  return result
}

/**
 * 炎症の有無をチェック（BOP: 出血）
 */
function checkInflammation(toothData: PeriodontalToothData[]): boolean {
  return toothData.some(tooth => {
    if (tooth.is_missing) return false

    return (
      tooth.bop_mb ||
      tooth.bop_b ||
      tooth.bop_db ||
      tooth.bop_ml ||
      tooth.bop_l ||
      tooth.bop_dl
    )
  })
}

/**
 * 指定した歯・部位のポケット深さを取得
 */
function getDepth(
  toothData: PeriodontalToothData[],
  toothNumber: number,
  position: string
): number {
  const tooth = toothData.find(t => t.tooth_number === toothNumber)
  if (!tooth) return 0

  const depth = tooth[`ppd_${position}` as keyof PeriodontalToothData] as number | undefined
  return depth || 0
}
