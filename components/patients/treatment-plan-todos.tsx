'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Clock,
  AlertCircle,
  Stethoscope,
  UserCog,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import {
  getTreatmentPlans,
  completeTreatmentPlan,
  updateTreatmentPlan,
  createTreatmentPlan,
  type TreatmentPlan
} from '@/lib/api/treatment-plans'
import { PeriodontalFlowCollapsibleCompact, type SrpSelectionItem, type DeepPocketTooth } from './periodontal-flow-collapsible-compact'
import { getPeriodontalExams, type PeriodontalExam } from '@/lib/api/periodontal-exams'
import { getVisualExaminations } from '@/lib/api/visual-exams'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface TreatmentPlanTodosProps {
  patientId: string
  subkarteId?: string
  onTodoComplete?: (planId: string) => void
}

type StaffTab = 'doctor' | 'hygienist'

export function TreatmentPlanTodos({
  patientId,
  subkarteId,
  onTodoComplete
}: TreatmentPlanTodosProps) {
  const [allTodos, setAllTodos] = useState<TreatmentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<StaffTab>('doctor')
  const [showCompleted, setShowCompleted] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null)
  const [memoInputs, setMemoInputs] = useState<{ [key: string]: string }>({})
  const [deepPocketTeeth, setDeepPocketTeeth] = useState<DeepPocketTooth[]>([])
  const [missingTeeth, setMissingTeeth] = useState<number[]>([])

  useEffect(() => {
    loadTodos()
    loadPeriodontalData()
    loadVisualData()
  }, [patientId])

  const loadTodos = async () => {
    try {
      setLoading(true)
      const data = await getTreatmentPlans(DEMO_CLINIC_ID, patientId)
      setAllTodos(data)
    } catch (error) {
      console.error('TODO読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // P検データから4mm以上の歯を抽出
  const loadPeriodontalData = async () => {
    try {
      const exams = await getPeriodontalExams(patientId)
      // 最新のP検②またはP検③を探す
      const latestExam = exams.find((e: PeriodontalExam) =>
        e.examination_phase === 'P_EXAM_2' || e.examination_phase === 'P_EXAM_3'
      )

      if (latestExam && latestExam.tooth_data) {
        const deepTeeth: DeepPocketTooth[] = []

        latestExam.tooth_data.forEach((tooth: any) => {
          if (tooth.is_missing) return

          const positions = ['mb', 'b', 'db', 'ml', 'l', 'dl'] as const
          const deepPositions: string[] = []
          let maxDepth = 0

          positions.forEach(pos => {
            const depth = tooth[`ppd_${pos}`] as number | undefined
            if (depth && depth >= 4) {
              deepPositions.push(pos)
              maxDepth = Math.max(maxDepth, depth)
            }
          })

          if (deepPositions.length > 0) {
            deepTeeth.push({
              toothNumber: tooth.tooth_number,
              maxDepth,
              positions: deepPositions
            })
          }
        })

        setDeepPocketTeeth(deepTeeth)
      }
    } catch (error) {
      console.error('P検データ読み込みエラー:', error)
    }
  }

  // 視診データから欠損歯を抽出
  const loadVisualData = async () => {
    try {
      const visualExams = await getVisualExaminations(patientId)
      if (visualExams && visualExams.length > 0) {
        const latestExam = visualExams[0]
        if (latestExam.tooth_data) {
          const missing: number[] = []
          latestExam.tooth_data.forEach(tooth => {
            // 欠損歯を収集（missing, none, unerupted, impacted）
            if (['missing', 'none', 'unerupted', 'impacted'].includes(tooth.status)) {
              missing.push(tooth.tooth_number)
            }
          })
          setMissingTeeth(missing)
        }
      }
    } catch (error) {
      console.error('視診データ読み込みエラー:', error)
    }
  }

  // 現在のタブのTODOをフィルタ
  const currentTabTodos = allTodos.filter(todo => todo.staff_type === activeTab)

  // 衛生士タブの場合: 歯周フェーズTODOとそれ以外を分離
  const periodontalPhaseTodos = activeTab === 'hygienist'
    ? currentTabTodos.filter(todo => todo.periodontal_phase)
    : []
  const otherHygienistTodos = activeTab === 'hygienist'
    ? currentTabTodos.filter(todo => !todo.periodontal_phase)
    : currentTabTodos

  const pendingTodos = otherHygienistTodos.filter(todo => todo.status !== 'completed')
  const completedTodos = otherHygienistTodos.filter(todo => todo.status === 'completed')

  // 未完了TODOの表示制限
  const displayLimit = 5
  const visiblePendingTodos = showMore ? pendingTodos : pendingTodos.slice(0, displayLimit)
  const hasMorePending = pendingTodos.length > displayLimit

  // タブごとの未完了件数
  const doctorPendingCount = allTodos.filter(t => t.staff_type === 'doctor' && t.status !== 'completed').length
  const hygienistPendingCount = allTodos.filter(t => t.staff_type === 'hygienist' && t.status !== 'completed').length

  const handleToggle = async (plan: TreatmentPlan) => {
    try {
      if (plan.status === 'completed') {
        // 完了済みを未完了に戻す
        await updateTreatmentPlan(DEMO_CLINIC_ID, plan.id, {
          status: 'planned',
          completed_at: null,
          implemented_date: undefined
        })
      } else {
        // 完了にする
        const memo = memoInputs[plan.id] || undefined
        await completeTreatmentPlan(DEMO_CLINIC_ID, plan.id, undefined, memo)

        if (subkarteId) {
          // サブカルテIDを紐づける
          await updateTreatmentPlan(DEMO_CLINIC_ID, plan.id, {
            subkarte_id: subkarteId
          })
        }

        onTodoComplete?.(plan.id)

        // 完了時は折りたたみ状態に戻す
        setShowCompleted(false)
      }

      await loadTodos()
    } catch (error) {
      console.error('TODO切り替えエラー:', error)
      alert('TODOの状態変更に失敗しました')
    }
  }

  // 分岐選択ハンドラー（SRP/Fop/P重防/SPTのTODOを生成）
  const handleBranchSelect = async (phaseId: string, selections?: SrpSelectionItem[]) => {
    try {
      // 既存の最大sort_orderを取得
      const maxSortOrder = allTodos.length > 0
        ? Math.max(...allTodos.map(t => t.sort_order || 0))
        : 0
      let currentSortOrder = maxSortOrder

      if (phaseId === 'SRP' && selections && selections.length > 0) {
        // SRP: 選択された部位ごとにTODOを生成
        for (const selection of selections) {
          currentSortOrder++
          const teethStr = selection.teeth.join(', ')
          const content = selection.type === 'block'
            ? `SRP（${selection.label.split(' ')[0]}）`
            : `SRP（${teethStr}番）`

          await createTreatmentPlan(DEMO_CLINIC_ID, patientId, {
            treatment_content: content,
            staff_type: 'hygienist',
            tooth_number: teethStr,
            priority: 2,
            sort_order: currentSortOrder,
            periodontal_phase: 'SRP',
            hygienist_menu_type: 'SRP',
          })
        }
      } else if (phaseId === 'SURGERY' && selections && selections.length > 0) {
        // Fop: 選択された部位ごとにTODOを生成
        for (const selection of selections) {
          currentSortOrder++
          const teethStr = selection.teeth.join(', ')
          const content = selection.type === 'block'
            ? `歯周外科（${selection.label.split(' ')[0]}）`
            : `歯周外科（${teethStr}番）`

          await createTreatmentPlan(DEMO_CLINIC_ID, patientId, {
            treatment_content: content,
            staff_type: 'doctor',
            tooth_number: teethStr,
            priority: 1,
            sort_order: currentSortOrder,
            periodontal_phase: 'SURGERY',
          })
        }
      } else if (phaseId === 'P_HEAVY_PREVENTION') {
        // P重防: 全顎対象で1つのTODOを生成
        currentSortOrder++
        await createTreatmentPlan(DEMO_CLINIC_ID, patientId, {
          treatment_content: 'P重防（歯周病重症化予防治療）',
          staff_type: 'hygienist',
          priority: 3,
          sort_order: currentSortOrder,
          periodontal_phase: 'P_HEAVY_PREVENTION',
          hygienist_menu_type: 'P_JUBO',
        })
      } else if (phaseId === 'MAINTENANCE') {
        // SPT: 全顎対象で1つのTODOを生成
        currentSortOrder++
        await createTreatmentPlan(DEMO_CLINIC_ID, patientId, {
          treatment_content: 'SPT（歯周病安定期治療）',
          staff_type: 'hygienist',
          priority: 3,
          sort_order: currentSortOrder,
          periodontal_phase: 'MAINTENANCE',
          hygienist_menu_type: 'SPT',
        })
      } else if (phaseId === 'P_EXAM_2') {
        // P検②: 歯周基本検査②のTODOを生成
        currentSortOrder++
        await createTreatmentPlan(DEMO_CLINIC_ID, patientId, {
          treatment_content: '歯周基本検査②（再評価1）',
          staff_type: 'hygienist',
          priority: 2,
          sort_order: currentSortOrder,
          periodontal_phase: 'P_EXAM_2',
          hygienist_menu_type: 'OTHER',
        })
      } else if (phaseId === 'P_EXAM_3') {
        // P検③: 歯周基本検査③のTODOを生成
        currentSortOrder++
        await createTreatmentPlan(DEMO_CLINIC_ID, patientId, {
          treatment_content: '歯周基本検査③（再評価2）',
          staff_type: 'hygienist',
          priority: 2,
          sort_order: currentSortOrder,
          periodontal_phase: 'P_EXAM_3',
          hygienist_menu_type: 'OTHER',
        })
      } else if (phaseId === 'P_EXAM_4') {
        // P検④: 歯周基本検査④のTODOを生成
        currentSortOrder++
        await createTreatmentPlan(DEMO_CLINIC_ID, patientId, {
          treatment_content: '歯周基本検査④（再評価3）',
          staff_type: 'hygienist',
          priority: 2,
          sort_order: currentSortOrder,
          periodontal_phase: 'P_EXAM_4',
          hygienist_menu_type: 'OTHER',
        })
      } else if (phaseId === 'P_EXAM_5') {
        // P検⑤: 歯周基本検査⑤のTODOを生成
        currentSortOrder++
        await createTreatmentPlan(DEMO_CLINIC_ID, patientId, {
          treatment_content: '歯周基本検査⑤（再評価4）',
          staff_type: 'hygienist',
          priority: 2,
          sort_order: currentSortOrder,
          periodontal_phase: 'P_EXAM_5',
          hygienist_menu_type: 'OTHER',
        })
      }

      // リロード
      await loadTodos()
    } catch (error) {
      console.error('分岐選択エラー:', error)
      alert('治療計画の作成に失敗しました')
    }
  }

  // フェーズ完了ハンドラー（該当フェーズの全TODOを一括完了）
  const handlePhaseToggle = async (phaseId: string, isCurrentlyCompleted: boolean) => {
    try {
      // 該当フェーズのTODOを取得
      const phasePlans = allTodos.filter(p =>
        p.staff_type === 'hygienist' &&
        p.periodontal_phase === phaseId
      )

      if (phasePlans.length === 0) {
        return
      }

      // チェックON: 全て完了、チェックOFF: 全て未完了
      const newStatus = isCurrentlyCompleted ? 'planned' : 'completed'
      const timestamp = isCurrentlyCompleted ? null : new Date().toISOString()

      // 全TODOを一括更新
      await Promise.all(
        phasePlans.map(plan =>
          updateTreatmentPlan(DEMO_CLINIC_ID, plan.id, {
            status: newStatus,
            completed_at: timestamp,
          })
        )
      )

      // リロード
      await loadTodos()
    } catch (error) {
      console.error('フェーズ完了エラー:', error)
      alert('フェーズの完了処理に失敗しました')
    }
  }

  const handleMemoSave = async (planId: string) => {
    try {
      const memo = memoInputs[planId]
      if (!memo) return

      await updateTreatmentPlan(DEMO_CLINIC_ID, planId, { memo })
      await loadTodos()
      setExpandedTodo(null)
      setMemoInputs({ ...memoInputs, [planId]: '' })
    } catch (error) {
      console.error('メモ保存エラー:', error)
      alert('メモの保存に失敗しました')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (allTodos.length === 0) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="text-center text-gray-500 py-4">
            <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-xs">治療計画がありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 歯番号を」形式でフォーマット
  const formatToothNumber = (toothNumber?: string): string => {
    if (!toothNumber) return ''
    const teeth = toothNumber.split(',').map(t => t.trim())
    return teeth.map(t => `${t}」`).join('')
  }

  const renderCompactTodo = (todo: TreatmentPlan) => {
    const isCompleted = todo.status === 'completed'
    const formattedTeeth = formatToothNumber(todo.tooth_number)

    return (
      <div
        key={todo.id}
        className={`flex items-start gap-1.5 py-0.5 px-1.5 rounded hover:bg-gray-50 transition-colors ${
          isCompleted ? 'opacity-60' : ''
        }`}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => handleToggle(todo)}
          className="h-3.5 w-3.5 mt-0.5"
        />

        {/* 歯番号 → 治療内容 → メモ の順番 */}
        <div className="flex-1">
          <span className={`text-xs ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {formattedTeeth && <span className="font-medium">{formattedTeeth}</span>}
            {formattedTeeth && todo.treatment_content && ' '}
            {todo.treatment_content}
          </span>
          {/* メモ内容を表示 */}
          {todo.memo && (
            <div className={`text-xs mt-0.5 ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
              <MessageSquare className="w-3 h-3 inline mr-1" />
              {todo.memo}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-2">
        {/* タブ切り替え */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setActiveTab('doctor')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'doctor'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            ドクター ({doctorPendingCount})
          </button>
          <button
            onClick={() => setActiveTab('hygienist')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'hygienist'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            衛生士 ({hygienistPendingCount})
          </button>
        </div>

        {/* スクロール可能エリア */}
        <div className="max-h-36 overflow-y-auto">
          {/* 衛生士タブの場合: 歯周フローチャートを表示 */}
          {activeTab === 'hygienist' && periodontalPhaseTodos.length > 0 && (
            <div className="mb-2 pb-2 border-b border-gray-200">
              <PeriodontalFlowCollapsibleCompact
                plans={periodontalPhaseTodos}
                onPhaseToggle={handlePhaseToggle}
                onBranchSelect={handleBranchSelect}
                onTodoToggle={async (planId, isCompleted) => {
                  try {
                    if (isCompleted) {
                      // 完了済み→未完了に戻す
                      await updateTreatmentPlan(DEMO_CLINIC_ID, planId, {
                        status: 'planned',
                        completed_at: null
                      })
                    } else {
                      // 未完了→完了にする
                      await updateTreatmentPlan(DEMO_CLINIC_ID, planId, {
                        status: 'completed',
                        completed_at: new Date().toISOString()
                      })
                    }
                    await loadTodos()
                  } catch (error) {
                    console.error('TODO状態更新エラー:', error)
                  }
                }}
                deepPocketTeeth={deepPocketTeeth}
                missingTeeth={missingTeeth}
                patientId={patientId}
                clinicId={DEMO_CLINIC_ID}
              />
            </div>
          )}

          {/* 完了済みセクション */}
          {completedTodos.length > 0 && (
            <div className="mb-1">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-1 w-full px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
              >
                {showCompleted ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span>完了済み ({completedTodos.length}件)</span>
              </button>
              {showCompleted && (
                <div className="mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2 ml-2">
                  {completedTodos.map(renderCompactTodo)}
                </div>
              )}
            </div>
          )}

          {/* 未完了TODO */}
          {pendingTodos.length === 0 && periodontalPhaseTodos.length === 0 ? (
            <div className="text-center text-gray-400 py-2">
              <Check className="w-5 h-5 mx-auto mb-0.5" />
              <p className="text-xs">未完了のTODOはありません</p>
            </div>
          ) : pendingTodos.length === 0 ? null : (
            <>
              <div className="space-y-0">
                {visiblePendingTodos.map(renderCompactTodo)}
              </div>

              {/* もっと見るボタン */}
              {hasMorePending && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="w-full mt-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  {showMore ? '閉じる' : `もっと見る (+${pendingTodos.length - displayLimit}件)`}
                </button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
