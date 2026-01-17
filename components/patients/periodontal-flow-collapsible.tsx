'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import type { TreatmentPlan } from '@/lib/api/treatment-plans'

interface PeriodontalFlowCollapsibleProps {
  plans: TreatmentPlan[]
}

// 歯周治療フローチャートのフェーズ定義
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

export function PeriodontalFlowCollapsible({ plans }: PeriodontalFlowCollapsibleProps) {
  const [showCompleted, setShowCompleted] = useState(false)
  const [showExtra, setShowExtra] = useState(false)

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

  // 完了済み、進行中、未着手のフェーズに分類
  const completedPhases = phasesWithTodos.filter(p => p.isCompleted)
  const inProgressPhases = phasesWithTodos.filter(p => p.isInProgress)
  const upcomingPhases = phasesWithTodos.filter(p => !p.isCompleted && !p.isInProgress)

  // 実際の表示件数（3件まで）
  const displayLimit = 3
  const primaryPhases = [...inProgressPhases, ...upcomingPhases].slice(0, displayLimit)
  const extraPhases = [...inProgressPhases, ...upcomingPhases].slice(displayLimit)

  if (phasesWithTodos.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        <p className="text-xs">治療計画がありません</p>
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
            className="flex items-center gap-1 w-full px-2 py-1.5 text-xs text-green-700 hover:bg-green-100 rounded transition-colors"
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
                  <div className="px-2 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3" />
                      <div className="flex-1 font-semibold">{phase.label}</div>
                    </div>
                  </div>
                  {/* 下向き矢印 */}
                  {index < completedPhases.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ChevronDown className="w-3 h-3 text-green-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 完了済みと進行中の間の矢印 */}
          {!showCompleted && primaryPhases.length > 0 && (
            <div className="flex justify-center py-0.5">
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* 進行中・未着手フェーズ（3件まで表示） */}
      {primaryPhases.map((phase, index) => (
        <div key={phase.id}>
          <div
            className={`
              px-3 py-2 rounded-lg text-sm font-medium
              ${phase.isInProgress
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-600 border border-gray-200'
              }
            `}
          >
            <div className="flex items-center gap-2">
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
          </div>

          {/* 下向き矢印（最後以外） */}
          {index < primaryPhases.length - 1 && (
            <div className="flex justify-center py-1">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      ))}

      {/* 余剰フェーズ（折りたたみ） */}
      {extraPhases.length > 0 && (
        <div>
          {/* primaryPhasesとの間の矢印 */}
          {primaryPhases.length > 0 && (
            <div className="flex justify-center py-1">
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          )}

          <button
            onClick={() => setShowExtra(!showExtra)}
            className="flex items-center gap-1 w-full px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            {showExtra ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>その他 ({extraPhases.length}件)</span>
          </button>

          {showExtra && (
            <div className="mt-1 space-y-1 pl-4">
              {extraPhases.map((phase, index) => (
                <div key={phase.id}>
                  <div className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200">
                    <div className="flex items-center gap-2">
                      {/* フェーズ情報 */}
                      <div className="flex-1">
                        <div className="font-semibold">{phase.label}</div>
                        {phase.totalCount > 0 && (
                          <div className="text-xs text-gray-500">{phase.pendingCount}件</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 下向き矢印 */}
                  {index < extraPhases.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
