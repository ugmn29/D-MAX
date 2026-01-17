'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { TreatmentPlan } from '@/lib/api/treatment-plans'

interface PeriodontalFlowCompactProps {
  plans: TreatmentPlan[]
  onPhaseToggle: (phaseId: string, isCompleted: boolean) => Promise<void>
  onPhaseClick?: (phaseId: string) => void
}

// 歯周治療フローチャートのフェーズ定義（治療計画タブと同じ）
const PERIODONTAL_FLOW_PHASES = [
  { id: 'P_EXAM_1', label: 'P検①', fullLabel: '歯周基本検査①' },
  { id: 'INITIAL', label: '初期治療', fullLabel: 'Sc/Poli/TBI' },
  { id: 'P_EXAM_2', label: 'P検②', fullLabel: '歯周基本検査②' },
  { id: 'SRP', label: 'SRP', fullLabel: 'スケーリング・ルートプレーニング' },
  { id: 'P_EXAM_3', label: 'P検③', fullLabel: '歯周基本検査③' },
  { id: 'SURGERY', label: '外科', fullLabel: '歯周外科' },
  { id: 'P_EXAM_4', label: 'P検④', fullLabel: '歯周基本検査④' },
  { id: 'MAINTENANCE', label: 'SPT', fullLabel: 'サポーティブペリオドンタルセラピー' }
] as const

export function PeriodontalFlowCompact({
  plans,
  onPhaseToggle,
  onPhaseClick
}: PeriodontalFlowCompactProps) {
  // 各フェーズの情報を計算（フローの順序を保持）
  const phaseInfo = PERIODONTAL_FLOW_PHASES.map(phase => {
    const phasePlans = plans.filter(p => p.periodontal_phase === phase.id)
    const completedCount = phasePlans.filter(p => p.status === 'completed').length
    const pendingCount = phasePlans.filter(p => p.status !== 'completed').length
    const totalCount = phasePlans.length
    const isCompleted = totalCount > 0 && completedCount === totalCount
    const isInProgress = pendingCount > 0

    return {
      ...phase,
      phasePlans,
      completedCount,
      pendingCount,
      totalCount,
      isCompleted,
      isInProgress
    }
  })

  // TODOが存在するフェーズのみ抽出（順序を保持）
  const phasesWithTodos = phaseInfo.filter(p => p.totalCount > 0)

  return (
    <div className="space-y-2">
      {/* フェーズを順番通りに表示 */}
      {phasesWithTodos.map((phase, index) => {
        // 完了済みフェーズはコンパクト表示
        if (phase.isCompleted) {
          return (
            <div key={phase.id}>
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

              {/* 下向き矢印（最後以外） */}
              {index < phasesWithTodos.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ChevronDown className="w-3 h-3 text-green-500" />
                </div>
              )}
            </div>
          )
        }

        // 未完了フェーズは通常表示
        return (
          <div key={phase.id}>
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
                {/* チェックボックス（ボタン内） */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={phase.isCompleted}
                    onCheckedChange={() => onPhaseToggle(phase.id, phase.isCompleted)}
                  />
                </div>

                {/* ステータスアイコン */}
                {phase.isInProgress && <Clock className="w-4 h-4" />}

                {/* フェーズ情報 */}
                <div className="flex-1">
                  <div className="font-semibold">{phase.label}</div>
                  {phase.totalCount > 0 && (
                    <div className="text-xs text-blue-600">{phase.pendingCount}件</div>
                  )}
                </div>
              </div>
            </button>

            {/* 下向き矢印（最後以外） */}
            {index < phasesWithTodos.length - 1 && (
              <div className="flex justify-center py-1">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
