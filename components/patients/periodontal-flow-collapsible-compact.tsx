'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, ChevronDown, ChevronRight, Pencil, Plus } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { TreatmentPlan } from '@/lib/api/treatment-plans'
import { SrpToothSelectorModal, type SrpSelectionItem, type DeepPocketTooth } from './srp-tooth-selector-modal'

// 歯番号をPalmer記法に変換する関数
const formatToothNumber = (toothNumber: string): string => {
  if (!toothNumber || toothNumber.trim() === '') return ''

  // カンマやスペースで分割
  const teeth = toothNumber.split(/[,、\s]+/).filter(t => t.trim())

  // 各歯番号をPalmer記法に変換
  const formattedTeeth = teeth.map(tooth => {
    const trimmed = tooth.trim()
    // 数字のみ抽出
    const numbers = trimmed.match(/\d+/g)
    if (!numbers || numbers.length === 0) return trimmed

    // 最後の数字を取得（FDI表記: 2桁の場合、1桁目=象限、2桁目=歯番号）
    const lastNumber = numbers[numbers.length - 1]
    if (lastNumber.length < 2) return trimmed

    const quadrant = lastNumber.charAt(0)
    const toothNum = lastNumber.slice(-1)

    // Palmer記法のUnicode記号で象限を表現
    switch (quadrant) {
      case '1': // 右上: 数字→記号（上向き）
        return `${toothNum}⏌`
      case '2': // 左上: 記号→数字（上向き）
        return `⎿${toothNum}`
      case '3': // 左下: 記号→数字（下向き）
        return `⎾${toothNum}`
      case '4': // 右下: 数字→記号（下向き）
        return `${toothNum}⏋`
      default:
        return trimmed
    }
  })

  return formattedTeeth.join(' ')
}

interface PeriodontalFlowCollapsibleCompactProps {
  plans: TreatmentPlan[]
  onPhaseToggle: (phaseId: string, isCompleted: boolean) => Promise<void>
  onBranchSelect: (
    phaseId: string,
    selections?: SrpSelectionItem[]
  ) => Promise<void>
  onTodoToggle: (planId: string, isCompleted: boolean) => Promise<void>
  onEditTodo?: (plan: TreatmentPlan, phaseId: string) => void // 編集コールバック
  onAddTodo?: (phaseId: string, existingTeeth: number[]) => void // 追加コールバック
  deepPocketTeeth?: DeepPocketTooth[] // P検データから4mm以上の歯
  missingTeeth?: number[] // 欠損歯（選択不可）
  patientId: string
  clinicId: string
}

// 全フェーズ定義（フロー順）
const ALL_PHASE_DEFINITIONS = [
  { id: 'P_EXAM_1', label: 'P検①', fullLabel: '歯周基本検査①' },
  { id: 'INITIAL', label: '初期治療', fullLabel: 'Sc/Poli/TBI' },
  { id: 'P_EXAM_2', label: 'P検②', fullLabel: '歯周基本検査②' },
  // P検②後の分岐: SRP / P重防
  { id: 'SRP', label: 'SRP', fullLabel: 'スケーリング・ルートプレーニング' },
  { id: 'P_EXAM_3', label: 'P検③', fullLabel: '歯周基本検査③' },
  // P検③後の分岐: Fop / 再SRP / P重防 / SPT
  { id: 'SURGERY', label: 'Fop', fullLabel: '歯周外科' },
  { id: 'SRP_2', label: '再SRP', fullLabel: '再スケーリング・ルートプレーニング' },
  { id: 'P_EXAM_4', label: 'P検④', fullLabel: '歯周基本検査④' },
  // P検④後の分岐: Fop / 再SRP / P重防 / SPT
  { id: 'SURGERY_2', label: '再Fop', fullLabel: '再歯周外科' },
  { id: 'SRP_3', label: '再々SRP', fullLabel: '再々スケーリング・ルートプレーニング' },
  { id: 'P_EXAM_5', label: 'P検⑤', fullLabel: '歯周基本検査⑤' },
  // P検⑤後の分岐: Fop / 再SRP / P重防 / SPT（最終）
  { id: 'P_HEAVY_PREVENTION', label: 'P重防', fullLabel: '歯周病重症化予防治療' },
  { id: 'MAINTENANCE', label: 'SPT', fullLabel: 'サポーティブペリオドンタルセラピー' },
] as const

// フェーズ情報の型
type PhaseInfo = {
  id: string
  label: string
  fullLabel: string
  phasePlans: TreatmentPlan[]
  completedCount: number
  pendingCount: number
  totalCount: number
  isCompleted: boolean
  isInProgress: boolean
  hasTodos: boolean
}

// フロー表示アイテムの型
type FlowItem = {
  type: 'phase' | 'branch'
  data: PhaseInfo | PhaseInfo[]
  isPreview?: boolean  // 次のフェーズをプレビュー表示
}

export function PeriodontalFlowCollapsibleCompact({
  plans,
  onPhaseToggle,
  onBranchSelect,
  onTodoToggle,
  onEditTodo,
  onAddTodo,
  deepPocketTeeth = [],
  missingTeeth = [],
  patientId,
  clinicId
}: PeriodontalFlowCollapsibleCompactProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [srpModalOpen, setSrpModalOpen] = useState(false)
  const [fopModalOpen, setFopModalOpen] = useState(false)
  const [currentSrpType, setCurrentSrpType] = useState<'SRP' | 'SRP_2' | 'SRP_3'>('SRP')
  const [currentFopType, setCurrentFopType] = useState<'SURGERY' | 'SURGERY_2'>('SURGERY')

  // SRP/Fopで既に選択済みの歯を取得
  const getExistingSrpFopTeeth = (excludePhaseId?: string): number[] => {
    const srpFopPhases = ['SRP', 'SRP_2', 'SRP_3', 'SURGERY', 'SURGERY_2']
    const existingTeeth: number[] = []
    plans
      .filter(p => srpFopPhases.includes(p.periodontal_phase || '') && p.periodontal_phase !== excludePhaseId)
      .forEach(p => {
        if (p.tooth_number) {
          const teethStr = p.tooth_number.split(/[,、\s]+/).filter(t => t.trim())
          teethStr.forEach(t => {
            const num = parseInt(t.trim(), 10)
            if (!isNaN(num)) {
              existingTeeth.push(num)
            }
          })
        }
      })
    return existingTeeth
  }

  // 全フェーズの情報を計算
  const getPhaseInfo = (phaseId: string): PhaseInfo => {
    const phaseDef = ALL_PHASE_DEFINITIONS.find(p => p.id === phaseId)
    const phasePlans = plans.filter(p => p.periodontal_phase === phaseId)
    const completedCount = phasePlans.filter(p => p.status === 'completed').length
    const pendingCount = phasePlans.filter(p => p.status !== 'completed').length
    const totalCount = phasePlans.length
    const isCompleted = totalCount > 0 && completedCount === totalCount
    const isInProgress = pendingCount > 0
    const hasTodos = totalCount > 0

    return {
      id: phaseId,
      label: phaseDef?.label || phaseId,
      fullLabel: phaseDef?.fullLabel || phaseId,
      phasePlans,
      completedCount,
      pendingCount,
      totalCount,
      isCompleted,
      isInProgress,
      hasTodos
    }
  }

  // 全フェーズの情報を取得
  const allPhaseInfo = ALL_PHASE_DEFINITIONS.map(def => getPhaseInfo(def.id))

  // 現在のフロー状態を分析してアイテムリストを生成
  const buildFlowItems = (): FlowItem[] => {
    const items: FlowItem[] = []
    const addedPhaseIds = new Set<string>()

    // 基本フェーズを順番にチェック
    const pExam1 = getPhaseInfo('P_EXAM_1')
    const initial = getPhaseInfo('INITIAL')
    const pExam2 = getPhaseInfo('P_EXAM_2')
    const srp = getPhaseInfo('SRP')
    const pExam3 = getPhaseInfo('P_EXAM_3')
    const surgery = getPhaseInfo('SURGERY')
    const srp2 = getPhaseInfo('SRP_2')
    const pExam4 = getPhaseInfo('P_EXAM_4')
    const surgery2 = getPhaseInfo('SURGERY_2')
    const srp3 = getPhaseInfo('SRP_3')
    const pExam5 = getPhaseInfo('P_EXAM_5')
    const pHeavy = getPhaseInfo('P_HEAVY_PREVENTION')
    const spt = getPhaseInfo('MAINTENANCE')

    // P検① → 初期治療 → P検②
    if (pExam1.hasTodos && !pExam1.isCompleted) {
      items.push({ type: 'phase', data: pExam1 })
      addedPhaseIds.add('P_EXAM_1')
      // 次のフェーズをプレビュー
      items.push({ type: 'phase', data: initial, isPreview: true })
      return items
    }
    if (pExam1.hasTodos && pExam1.isCompleted) {
      addedPhaseIds.add('P_EXAM_1')
      // P検①完了後、初期治療がまだない場合はプレビュー表示
      if (!initial.hasTodos) {
        items.push({ type: 'phase', data: initial, isPreview: true })
        return items
      }
    }

    if (initial.hasTodos && !initial.isCompleted) {
      items.push({ type: 'phase', data: initial })
      addedPhaseIds.add('INITIAL')
      items.push({ type: 'phase', data: pExam2, isPreview: true })
      return items
    }
    if (initial.hasTodos && initial.isCompleted) {
      addedPhaseIds.add('INITIAL')
      // 初期治療完了後、P検②がまだない場合はプレビュー表示
      if (!pExam2.hasTodos) {
        items.push({ type: 'phase', data: pExam2, isPreview: true })
        return items
      }
    }

    if (pExam2.hasTodos && !pExam2.isCompleted) {
      items.push({ type: 'phase', data: pExam2 })
      addedPhaseIds.add('P_EXAM_2')
      // 次は分岐: SRP / P重防
      items.push({ type: 'branch', data: [srp, pHeavy], isPreview: true })
      return items
    }
    if (pExam2.hasTodos && pExam2.isCompleted) {
      addedPhaseIds.add('P_EXAM_2')
    }

    // P検②完了後: SRP / P重防 の分岐
    if (pExam2.isCompleted) {
      // SRPかP重防が進行中/未完了の場合
      if (srp.hasTodos && !srp.isCompleted) {
        items.push({ type: 'branch', data: [srp, pHeavy] })
        addedPhaseIds.add('SRP')
        addedPhaseIds.add('P_HEAVY_PREVENTION')
        items.push({ type: 'phase', data: pExam3, isPreview: true })
        return items
      }
      if (pHeavy.hasTodos && !pHeavy.isCompleted && !srp.hasTodos) {
        items.push({ type: 'branch', data: [srp, pHeavy] })
        addedPhaseIds.add('SRP')
        addedPhaseIds.add('P_HEAVY_PREVENTION')
        items.push({ type: 'phase', data: pExam3, isPreview: true })
        return items
      }
      // SRPが完了した場合 → P検③へ進む
      if (srp.isCompleted) {
        addedPhaseIds.add('SRP')
        // P検③がまだない場合はプレビュー表示
        if (!pExam3.hasTodos) {
          items.push({ type: 'phase', data: pExam3, isPreview: true })
          return items
        }
        // P検③がある場合は次のブロックで処理
      }
      // P重防が完了した場合（P検③がまだない場合はプレビュー表示）
      else if (pHeavy.isCompleted && !srp.hasTodos) {
        addedPhaseIds.add('P_HEAVY_PREVENTION')
        if (!pExam3.hasTodos) {
          items.push({ type: 'phase', data: pExam3, isPreview: true })
          return items
        }
      }
      // どちらも選択されていない場合は分岐を表示
      else if (!srp.hasTodos && !pHeavy.hasTodos) {
        items.push({ type: 'branch', data: [srp, pHeavy] })
        return items
      }
    }

    // P検③の処理
    if (pExam3.hasTodos && !pExam3.isCompleted) {
      items.push({ type: 'phase', data: pExam3 })
      addedPhaseIds.add('P_EXAM_3')
      // 次は分岐: Fop / 再SRP / P重防 / SPT
      items.push({ type: 'branch', data: [surgery, srp2, pHeavy, spt], isPreview: true })
      return items
    }
    if (pExam3.hasTodos && pExam3.isCompleted) {
      addedPhaseIds.add('P_EXAM_3')
    }

    // P検③完了後: Fop / 再SRP / P重防 / SPT の分岐
    if (pExam3.isCompleted) {
      const branch3Options = [surgery, srp2, pHeavy, spt]
      const selectedBranch = branch3Options.find(b => b.hasTodos && !b.isCompleted)
      const completedBranch = branch3Options.find(b => b.isCompleted)
      const anySelected = branch3Options.some(b => b.hasTodos)

      // SPTとSRP/Fopが両方存在する場合（SPT中にSRPに変更されたケース）
      const hasSptAndSrpOrFop = spt.hasTodos && (srp2.hasTodos || surgery.hasTodos)

      // P検④が既に完了している場合は、P検③後の分岐をスキップしてP検④後の処理へ
      if (pExam4.isCompleted) {
        addedPhaseIds.add('P_EXAM_4')
        branch3Options.forEach(b => addedPhaseIds.add(b.id))
        // P検④の処理へ進む（下のブロックで処理される）
      }
      // SPT以外の分岐が選択中の場合（または、SPT+SRP/Fopの並行ケース）
      else if ((selectedBranch && selectedBranch.id !== 'MAINTENANCE') || hasSptAndSrpOrFop) {
        items.push({ type: 'branch', data: branch3Options })
        branch3Options.forEach(b => addedPhaseIds.add(b.id))
        // SRP/Fopが完了した場合 → P検④へ
        if ((srp2.isCompleted || surgery.isCompleted) && !pExam4.hasTodos) {
          items.push({ type: 'phase', data: pExam4, isPreview: true })
          return items
        }
        // SRP/Fopが進行中 → P検④をプレビュー
        if (!srp2.isCompleted && !surgery.isCompleted) {
          items.push({ type: 'phase', data: pExam4, isPreview: true })
          return items
        }
        // P検④が既にある場合（未完了）
        if (pExam4.hasTodos && !pExam4.isCompleted) {
          // 次の処理へ（P検④の処理ブロックで扱う）
        } else if (!pExam4.hasTodos) {
          return items
        }
      }
      // SPTのみが選択中の場合（SRP/Fopなし）
      else if (selectedBranch && selectedBranch.id === 'MAINTENANCE' && !hasSptAndSrpOrFop) {
        items.push({ type: 'branch', data: branch3Options })
        branch3Options.forEach(b => addedPhaseIds.add(b.id))
        // SPT選択中でもP検④を追加可能
        if (!pExam4.hasTodos) {
          items.push({ type: 'phase', data: pExam4, isPreview: true })
          return items
        }
        // P検④が既にある場合 → SPTと並行してP検④を表示
        if (pExam4.hasTodos && !pExam4.isCompleted) {
          items.push({ type: 'phase', data: pExam4 })
          addedPhaseIds.add('P_EXAM_4')
          return items
        }
        // P検④が完了している場合はそのまま次の処理に進む
        if (pExam4.isCompleted) {
          addedPhaseIds.add('P_EXAM_4')
        }
      }
      // いずれかの分岐が完了した場合 → P検④へ
      else if (completedBranch && !hasSptAndSrpOrFop) {
        branch3Options.forEach(b => addedPhaseIds.add(b.id))
        if (!pExam4.hasTodos) {
          items.push({ type: 'phase', data: pExam4, isPreview: true })
          return items
        }
        // P検④が既にある場合は次の処理へ
      }
      else if (!anySelected) {
        items.push({ type: 'branch', data: branch3Options })
        return items
      }
    }

    // P検④の処理
    if (pExam4.hasTodos && !pExam4.isCompleted) {
      items.push({ type: 'phase', data: pExam4 })
      addedPhaseIds.add('P_EXAM_4')
      // 次は分岐: 再Fop / 再々SRP / P重防 / SPT
      items.push({ type: 'branch', data: [surgery2, srp3, pHeavy, spt], isPreview: true })
      return items
    }
    if (pExam4.hasTodos && pExam4.isCompleted) {
      addedPhaseIds.add('P_EXAM_4')
    }

    // P検④完了後: 再Fop / 再々SRP / P重防 / SPT の分岐
    if (pExam4.isCompleted) {
      const branch4Options = [surgery2, srp3, pHeavy, spt]
      const selectedBranch = branch4Options.find(b => b.hasTodos && !b.isCompleted)
      const completedBranch = branch4Options.find(b => b.isCompleted)
      const anySelected = branch4Options.some(b => b.hasTodos)

      // SPTとSRP/Fopが両方存在する場合（SPT中にSRPに変更されたケース）
      const hasSptAndSrpOrFop = spt.hasTodos && (srp3.hasTodos || surgery2.hasTodos)

      // SPT以外の分岐が選択中の場合（または、SPT+SRP/Fopの並行ケース）
      if ((selectedBranch && selectedBranch.id !== 'MAINTENANCE') || hasSptAndSrpOrFop) {
        items.push({ type: 'branch', data: branch4Options })
        branch4Options.forEach(b => addedPhaseIds.add(b.id))
        // SRP/Fopが完了した場合 → P検⑤へ
        if ((srp3.isCompleted || surgery2.isCompleted) && !pExam5.hasTodos) {
          items.push({ type: 'phase', data: pExam5, isPreview: true })
          return items
        }
        // SRP/Fopが進行中 → P検⑤をプレビュー
        if (!srp3.isCompleted && !surgery2.isCompleted) {
          items.push({ type: 'phase', data: pExam5, isPreview: true })
          return items
        }
        // P検⑤が既にある場合
        if (pExam5.hasTodos) {
          // 次の処理へ
        } else {
          return items
        }
      }
      // SPTのみが選択中の場合（SRP/Fopなし）
      else if (selectedBranch && selectedBranch.id === 'MAINTENANCE' && !hasSptAndSrpOrFop) {
        items.push({ type: 'branch', data: branch4Options })
        branch4Options.forEach(b => addedPhaseIds.add(b.id))
        // SPT選択中でもP検⑤を追加可能
        if (!pExam5.hasTodos) {
          items.push({ type: 'phase', data: pExam5, isPreview: true })
          return items
        }
        // P検⑤が既にある場合 → SPTと並行してP検⑤を表示
        if (pExam5.hasTodos && !pExam5.isCompleted) {
          items.push({ type: 'phase', data: pExam5 })
          addedPhaseIds.add('P_EXAM_5')
          return items
        }
        // P検⑤が完了している場合はそのまま次の処理に進む
        if (pExam5.isCompleted) {
          addedPhaseIds.add('P_EXAM_5')
        }
      }
      // いずれかの分岐が完了した場合 → P検⑤へ
      if (completedBranch && !hasSptAndSrpOrFop) {
        branch4Options.forEach(b => addedPhaseIds.add(b.id))
        if (!pExam5.hasTodos) {
          items.push({ type: 'phase', data: pExam5, isPreview: true })
          return items
        }
      }
      if (!anySelected) {
        items.push({ type: 'branch', data: branch4Options })
        return items
      }
    }

    // P検⑤の処理
    if (pExam5.hasTodos && !pExam5.isCompleted) {
      items.push({ type: 'phase', data: pExam5 })
      addedPhaseIds.add('P_EXAM_5')
      // 次は分岐（最終）: Fop / 再SRP / P重防 / SPT
      items.push({ type: 'branch', data: [surgery, srp2, pHeavy, spt], isPreview: true })
      return items
    }
    if (pExam5.hasTodos && pExam5.isCompleted) {
      addedPhaseIds.add('P_EXAM_5')
    }

    // P検⑤完了後（最終）
    if (pExam5.isCompleted) {
      const branch5Options = [surgery, srp2, pHeavy, spt]
      const selectedBranch = branch5Options.find(b => b.hasTodos && !b.isCompleted)
      const anySelected = branch5Options.some(b => b.hasTodos)

      if (selectedBranch) {
        items.push({ type: 'branch', data: branch5Options })
        return items
      }
      if (!anySelected) {
        items.push({ type: 'branch', data: branch5Options })
        return items
      }
    }

    // SPT完了後も次のP検に戻れる
    if (spt.isCompleted) {
      // 次のP検を探す
      const nextPExam = [pExam3, pExam4, pExam5].find(p => !p.hasTodos)
      if (nextPExam) {
        items.push({ type: 'phase', data: nextPExam, isPreview: true })
      }
    }

    return items
  }

  const flowItems = buildFlowItems()

  // 完了済みフェーズ
  const completedPhases = allPhaseInfo.filter(p => p.hasTodos && p.isCompleted)

  // 表示用アイテム（プレビューでないもの）
  const activeItems = flowItems.filter(item => !item.isPreview)
  const previewItem = flowItems.find(item => item.isPreview)

  if (completedPhases.length === 0 && activeItems.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        <p className="text-xs">治療計画がありません</p>
      </div>
    )
  }

  // フェーズボタンをレンダリング
  const renderPhaseButton = (phase: PhaseInfo, isPreview: boolean = false) => {
    if (isPreview) {
      return (
        <button
          onClick={() => onBranchSelect(phase.id)}
          className="w-full px-2 py-1 rounded-lg text-[10px] font-medium bg-gray-50 text-gray-400 border border-gray-200 border-dashed opacity-60 hover:opacity-80 hover:bg-gray-100 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-gray-300" />
            <div className="flex-1 text-left">
              <span className="font-semibold">{phase.label}</span>
              <span className="ml-1 text-[9px]">クリックして開始</span>
            </div>
          </div>
        </button>
      )
    }

    if (phase.isCompleted) {
      return (
        <button
          onClick={() => onPhaseToggle(phase.id, phase.isCompleted)}
          className="w-full px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-left bg-green-100 text-green-700 border border-green-300"
        >
          <div className="flex items-center gap-2">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={phase.isCompleted}
                onCheckedChange={() => onPhaseToggle(phase.id, phase.isCompleted)}
                className="h-3 w-3"
              />
            </div>
            <CheckCircle2 className="w-3 h-3" />
            <div className="flex-1 font-semibold">{phase.label}</div>
          </div>
        </button>
      )
    }

    return (
      <button
        onClick={() => onPhaseToggle(phase.id, phase.isCompleted)}
        className={`
          w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
          ${phase.isInProgress
            ? 'bg-blue-100 text-blue-700 border border-blue-300'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={phase.isCompleted}
              onCheckedChange={() => onPhaseToggle(phase.id, phase.isCompleted)}
            />
          </div>

          {phase.isInProgress && <Clock className="w-4 h-4" />}

          <div className="flex-1">
            <div className="font-semibold">{phase.label}</div>
          </div>
        </div>
      </button>
    )
  }

  // 分岐ボタンがクリックされた時の処理
  const handleBranchClick = (branchId: string) => {
    // SRP系
    if (branchId === 'SRP') {
      setCurrentSrpType('SRP')
      setSrpModalOpen(true)
    } else if (branchId === 'SRP_2') {
      setCurrentSrpType('SRP_2')
      setSrpModalOpen(true)
    } else if (branchId === 'SRP_3') {
      setCurrentSrpType('SRP_3')
      setSrpModalOpen(true)
    }
    // Fop系
    else if (branchId === 'SURGERY') {
      setCurrentFopType('SURGERY')
      setFopModalOpen(true)
    } else if (branchId === 'SURGERY_2') {
      setCurrentFopType('SURGERY_2')
      setFopModalOpen(true)
    }
    // P重防、SPTは直接TODO生成
    else {
      onBranchSelect(branchId)
    }
  }

  // モーダルで確定された時の処理
  const handleSrpConfirm = (selections: SrpSelectionItem[]) => {
    setSrpModalOpen(false)
    onBranchSelect(currentSrpType, selections)
  }

  const handleFopConfirm = (selections: SrpSelectionItem[]) => {
    setFopModalOpen(false)
    onBranchSelect(currentFopType, selections)
  }

  // SRP/FopのサブTODOリストをレンダリング
  const renderSubTodoList = (phasePlans: TreatmentPlan[], phaseId: string) => {
    if (phasePlans.length === 0) return null

    // 完了済みと未完了に分ける
    const pendingPlans = phasePlans.filter(p => p.status !== 'completed')
    const completedPlans = phasePlans.filter(p => p.status === 'completed')

    return (
      <div className="mt-2 ml-2 space-y-1">
        {/* 未完了のTODO */}
        {pendingPlans.map(plan => (
          <div
            key={plan.id}
            className="flex items-center gap-2 px-2 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Checkbox
              checked={false}
              onCheckedChange={() => onTodoToggle(plan.id, false)}
              className="h-4 w-4"
            />
            <div className="flex-1 text-sm font-medium text-gray-700">
              {plan.tooth_number ? formatToothNumber(plan.tooth_number) : '部位未設定'}
            </div>
            {onEditTodo && (
              <button
                onClick={() => onEditTodo(plan, phaseId)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="編集"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {/* 完了済みのTODO（薄く表示） */}
        {completedPlans.length > 0 && (
          <div className="space-y-1 opacity-50">
            {completedPlans.map(plan => (
              <div
                key={plan.id}
                className="flex items-center gap-2 px-2 py-1 bg-green-50 border border-green-200 rounded-md"
              >
                <Checkbox
                  checked={true}
                  onCheckedChange={() => onTodoToggle(plan.id, true)}
                  className="h-4 w-4"
                />
                <div className="flex-1 text-sm line-through text-gray-400">
                  <span className="font-medium">
                    {plan.tooth_number ? formatToothNumber(plan.tooth_number) : '部位未設定'}
                  </span>
                </div>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              </div>
            ))}
          </div>
        )}

        {/* 追加ボタン */}
        {onAddTodo && (
          <button
            onClick={() => {
              // 既存の歯番号を収集
              const existingTeeth: number[] = []
              phasePlans.forEach(plan => {
                if (plan.tooth_number) {
                  const teethStr = plan.tooth_number.split(/[,、\s]+/).filter(t => t.trim())
                  teethStr.forEach(t => {
                    const num = parseInt(t.trim(), 10)
                    if (!isNaN(num)) {
                      existingTeeth.push(num)
                    }
                  })
                }
              })
              onAddTodo(phaseId, existingTeeth)
            }}
            className="flex items-center justify-center gap-1 w-full px-2 py-1.5 mt-1 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md hover:bg-gray-100 hover:text-blue-600 hover:border-blue-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>部位を追加</span>
          </button>
        )}
      </div>
    )
  }

  // 分岐ボタンをレンダリング（横並び）
  const renderBranchButtons = (branches: PhaseInfo[], isPreview: boolean = false) => {
    if (isPreview) {
      return (
        <div className="flex gap-1 opacity-60">
          {branches.map(branch => (
            <div
              key={branch.id}
              className="flex-1 px-1 py-1 rounded text-[10px] font-medium text-center bg-gray-50 text-gray-400 border border-gray-200 border-dashed whitespace-nowrap"
            >
              <span className="font-semibold">{branch.label}</span>
            </div>
          ))}
        </div>
      )
    }

    // SPTとSRP/Fopが両方存在するかチェック
    const sptBranch = branches.find(b => b.id === 'MAINTENANCE')
    const srpFopBranches = branches.filter(b => ['SRP', 'SRP_2', 'SRP_3', 'SURGERY', 'SURGERY_2'].includes(b.id))
    const hasSptAndSrpOrFop = sptBranch?.hasTodos && srpFopBranches.some(b => b.hasTodos)

    return (
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {branches.map(branch => {
            // SPTとSRP/Fopが両方存在する場合、SPTは非選択状態として表示
            let isSelected = branch.hasTodos
            if (hasSptAndSrpOrFop && branch.id === 'MAINTENANCE') {
              isSelected = false // SPTは非選択状態に
            }
            const isOtherSelected = branches.some(b => b.id !== branch.id && b.hasTodos)

            return (
              <button
                key={branch.id}
                onClick={() => handleBranchClick(branch.id)}
                className={`
                  flex-1 px-1 py-1 rounded text-[10px] font-medium transition-all text-center whitespace-nowrap
                  ${isSelected && branch.isCompleted
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : isSelected && branch.isInProgress
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : isSelected
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : isOtherSelected
                    ? 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                <span className="font-semibold">{branch.label}</span>
              </button>
            )
          })}
        </div>

        {/* SRP/Fop選択後のサブTODOリスト */}
        {branches.map(branch => {
          // SRP系またはFop系で、TODOがある場合のみ表示
          const isSrpOrFop = ['SRP', 'SRP_2', 'SRP_3', 'SURGERY', 'SURGERY_2'].includes(branch.id)
          if (isSrpOrFop && branch.hasTodos) {
            return (
              <div key={`${branch.id}-todos`}>
                {renderSubTodoList(branch.phasePlans, branch.id)}
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* 完了済みフェーズ（折りたたみ） */}
      {completedPhases.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1 w-full px-2 py-1 text-xs text-green-700 hover:bg-green-100 rounded transition-colors"
          >
            {showCompleted ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <CheckCircle2 className="w-3 h-3" />
            <span>完了済み ({completedPhases.length}件)</span>
          </button>

          {showCompleted && (
            <div className="mt-1 space-y-1 pl-4">
              {completedPhases.map((phase, index) => (
                <div key={phase.id}>
                  {renderPhaseButton(phase)}
                  {index < completedPhases.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ChevronDown className="w-3 h-3 text-green-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!showCompleted && activeItems.length > 0 && (
            <div className="flex justify-center py-0.5">
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* アクティブなフェーズ/分岐 */}
      {activeItems.map((item, index) => (
        <div key={index}>
          {item.type === 'phase' ? (
            renderPhaseButton(item.data as PhaseInfo)
          ) : (
            renderBranchButtons(item.data as PhaseInfo[])
          )}

          {index < activeItems.length - 1 && (
            <div className="flex justify-center py-1">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      ))}

      {/* 次のフェーズをプレビュー表示 */}
      {previewItem && (
        <>
          {activeItems.length > 0 && (
            <div className="flex justify-center py-1">
              <ChevronDown className="w-4 h-4 text-gray-300" />
            </div>
          )}
          {previewItem.type === 'phase' ? (
            renderPhaseButton(previewItem.data as PhaseInfo, true)
          ) : (
            renderBranchButtons(previewItem.data as PhaseInfo[], true)
          )}
        </>
      )}

      {/* SRP部位選択モーダル */}
      <SrpToothSelectorModal
        isOpen={srpModalOpen}
        onClose={() => setSrpModalOpen(false)}
        onConfirm={handleSrpConfirm}
        title={currentSrpType === 'SRP' ? 'SRP' : currentSrpType === 'SRP_2' ? '再SRP' : '再々SRP'}
        deepPocketTeeth={deepPocketTeeth}
        treatmentType="SRP"
        existingTeeth={getExistingSrpFopTeeth(currentSrpType)}
        missingTeeth={missingTeeth}
      />

      {/* Fop部位選択モーダル */}
      <SrpToothSelectorModal
        isOpen={fopModalOpen}
        onClose={() => setFopModalOpen(false)}
        onConfirm={handleFopConfirm}
        title={currentFopType === 'SURGERY' ? '歯周外科（Fop）' : '再歯周外科（Fop）'}
        deepPocketTeeth={deepPocketTeeth}
        treatmentType="Fop"
        existingTeeth={getExistingSrpFopTeeth(currentFopType)}
        missingTeeth={missingTeeth}
      />
    </div>
  )
}

export type { SrpSelectionItem, DeepPocketTooth }
