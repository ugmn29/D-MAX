'use client'

import { useState, useEffect, useCallback } from 'react'
import { Training } from '@/types/training'
import TrainingEvaluationModal from './TrainingEvaluationModal'

interface TrainingFlowChartProps {
  patientId: string
  clinicId: string
}

interface TrainingWithStatus extends Training {
  is_prescribed: boolean
  latest_evaluation_level: number | null
  evaluation_count: number
  is_completed: boolean
  latest_evaluated_at: string | null
  menu_training_id: string | null
}

// フォールバック用のハードコードプロトコル（名前ベース）
const FALLBACK_PROTOCOLS = [
  {
    id: 'tongue',
    name: '舌',
    icon: '👅',
    sort_order: 0,
    is_parallel_layout: false,
    steps: [
      {
        id: 's1',
        step_number: 1,
        checkpoint_name: '「あ」の口ができるか？',
        description: '口を大きく開けて「あ」の形が作れるか確認',
        trainingNames: ['「あ」の口の確認'],
      },
      {
        id: 's2',
        step_number: 2,
        checkpoint_name: '舌尖が前に伸びるか？',
        description: '舌の先端を前方に十分伸ばせるか確認',
        trainingNames: ['舌を前に出す', '舌を左右に振る', '口唇をなぞる', '舌小帯伸ばし'],
      },
      {
        id: 's3',
        step_number: 3,
        checkpoint_name: 'スポット位置に置けるか？',
        description: '舌を正しいスポット位置（上あごの前方）に置けるか確認',
        trainingNames: ['スポットの位置確認'],
      },
      {
        id: 's4',
        step_number: 4,
        checkpoint_name: '吸い上げができるか？',
        description: '舌を上あごに吸い付けた状態を保持できるか確認',
        trainingNames: ['吸い上げ', '吸い上げができない場合', 'チューブ吸い'],
      },
      {
        id: 's5',
        step_number: 5,
        checkpoint_name: '吸い上げ状態の嚥下ができるか？',
        description: '舌を吸い上げた状態で飲み込めるか確認',
        trainingNames: ['舌筋の訓練'],
      },
    ],
  },
  {
    id: 'lips',
    name: '口唇',
    icon: '👄',
    sort_order: 1,
    is_parallel_layout: true,
    steps: [
      {
        id: 's6',
        step_number: 1,
        checkpoint_name: '口唇が弱い',
        description: '口唇の筋力を鍛える',
        trainingNames: ['口輪筋訓練'],
      },
      {
        id: 's7',
        step_number: 2,
        checkpoint_name: '口唇が強い',
        description: '口唇の緊張を除去し柔軟性を高める',
        trainingNames: ['口唇の緊張除去', '上唇小帯と下唇小帯を伸ばす'],
      },
    ],
  },
  {
    id: 'exercise',
    name: '体操',
    icon: '🤸',
    sort_order: 2,
    is_parallel_layout: false,
    steps: [
      {
        id: 's8',
        step_number: 1,
        checkpoint_name: '体操',
        description: '総合的な体操トレーニング',
        trainingNames: ['あいうべ体操', 'タラ体操'],
      },
    ],
  },
]

interface DbProtocolStep {
  id: string
  step_number: number
  checkpoint_name: string
  description: string | null
  items: { id: string; training_id: string; sort_order: number; training: Training }[]
}

interface DbProtocol {
  id: string
  name: string
  sort_order: number
  is_parallel_layout: boolean
  steps: DbProtocolStep[]
}

export default function TrainingFlowChart({ patientId, clinicId }: TrainingFlowChartProps) {
  const [allTrainings, setAllTrainings] = useState<TrainingWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', '1', '2', '3', '4', '5', '6', '7', '8']))
  const [activeProtocolId, setActiveProtocolId] = useState<string>('tongue')
  const [showModal, setShowModal] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    type: 'success' | 'confirm' | 'error'
    title: string
    message: string
    onConfirm?: () => void
  } | null>(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [selectedTrainingForEvaluation, setSelectedTrainingForEvaluation] = useState<TrainingWithStatus | null>(null)
  const [protocols, setProtocols] = useState<typeof FALLBACK_PROTOCOLS>(FALLBACK_PROTOCOLS)
  const [dbProtocols, setDbProtocols] = useState<DbProtocol[] | null>(null)

  const loadProtocols = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/clinic/protocols?clinicId=${clinicId}`)
      if (!res.ok) return

      const { protocols: dbData } = await res.json()
      if (dbData && dbData.length > 0) {
        setDbProtocols(dbData)
        setActiveProtocolId(dbData[0].id)
        // expandedStepsにDBステップのIDを追加
        const allStepIds = new Set<string>()
        dbData.forEach((p: DbProtocol) => p.steps.forEach((s) => allStepIds.add(s.id)))
        setExpandedSteps(allStepIds)
      } else {
        // 自動シード
        await fetch(`/api/training/clinic/seed-protocols?clinicId=${clinicId}`, { method: 'POST' })
        const res2 = await fetch(`/api/training/clinic/protocols?clinicId=${clinicId}`)
        if (res2.ok) {
          const { protocols: seeded } = await res2.json()
          if (seeded && seeded.length > 0) {
            setDbProtocols(seeded)
            setActiveProtocolId(seeded[0].id)
            const allStepIds = new Set<string>()
            seeded.forEach((p: DbProtocol) => p.steps.forEach((s: DbProtocolStep) => allStepIds.add(s.id)))
            setExpandedSteps(allStepIds)
          }
        }
      }
    } catch {
      // フォールバックのまま
    }
  }, [clinicId])

  useEffect(() => {
    loadProtocols()
  }, [loadProtocols])

  useEffect(() => {
    loadAllData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      const trainingsRes = await fetch('/api/training/trainings')
      if (!trainingsRes.ok) {
        throw new Error(`トレーニングデータの取得に失敗: ${trainingsRes.statusText}`)
      }
      const trainingsJson = await trainingsRes.json()
      const trainingsData = trainingsJson.data || []

      const menuRes = await fetch(`/api/training/menus?patient_id=${patientId}`)
      const menuJson = await menuRes.json()
      const activeMenuData = menuJson.data

      setActiveMenuId(activeMenuData?.id || null)

      const prescribedTrainingIds = new Set(
        activeMenuData?.menu_trainings?.map((mt: any) => mt.training_id) || []
      )
      const menuTrainingMap = new Map(
        activeMenuData?.menu_trainings?.map((mt: any) => [mt.training_id, mt.id]) || []
      )

      const evalRes = await fetch(`/api/training/evaluations?patient_id=${patientId}`)
      const evalJson = await evalRes.json()
      const progressData = evalJson.data || []

      const evaluationMap = new Map<string, any>()
      progressData?.forEach((evaluation: any) => {
        if (!evaluationMap.has(evaluation.training_id)) {
          evaluationMap.set(evaluation.training_id, {
            latest_evaluation_level: evaluation.evaluation_level,
            latest_evaluated_at: evaluation.evaluated_at,
            evaluation_count: 1,
            is_completed: evaluation.evaluation_level === 3,
          })
        } else {
          const existing = evaluationMap.get(evaluation.training_id)
          existing.evaluation_count++
        }
      })

      const trainingsWithStatus: TrainingWithStatus[] = (trainingsData || []).map((training: any) => {
        const evalInfo = evaluationMap.get(training.id)
        return {
          ...training,
          is_prescribed: prescribedTrainingIds.has(training.id),
          latest_evaluation_level: evalInfo?.latest_evaluation_level || null,
          evaluation_count: evalInfo?.evaluation_count || 0,
          is_completed: evalInfo?.is_completed || false,
          latest_evaluated_at: evalInfo?.latest_evaluated_at || null,
          menu_training_id: menuTrainingMap.get(training.id) || null,
        }
      })

      setAllTrainings(trainingsWithStatus)
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrainingByName = (name: string): TrainingWithStatus | undefined => {
    return allTrainings.find((t) => t.training_name === name)
  }

  const getTrainingById = (id: string): TrainingWithStatus | undefined => {
    return allTrainings.find((t) => t.id === id)
  }

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const showModalMessage = (config: {
    type: 'success' | 'confirm' | 'error'
    title: string
    message: string
    onConfirm?: () => void
  }) => {
    setModalConfig(config)
    setShowModal(true)
  }

  const handlePrescribe = async (trainingId: string) => {
    try {
      if (!activeMenuId) {
        const menuRes = await fetch('/api/training/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            clinic_id: clinicId,
            menu_name: 'トレーニングメニュー',
            is_active: true,
          }),
        })

        if (!menuRes.ok) throw new Error('メニュー作成に失敗しました')
        const menuJson = await menuRes.json()
        const newMenuId = menuJson.data.id
        setActiveMenuId(newMenuId)

        const mtRes = await fetch('/api/training/menu-trainings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_id: newMenuId,
            training_id: trainingId,
            sort_order: 1,
            action_seconds: 10,
            rest_seconds: 5,
            sets: 3,
            auto_progress: true,
          }),
        })

        if (!mtRes.ok) throw new Error('トレーニング追加に失敗しました')
      } else {
        const prescribedCount = allTrainings.filter((t) => t.is_prescribed).length

        const mtRes = await fetch('/api/training/menu-trainings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_id: activeMenuId,
            training_id: trainingId,
            sort_order: prescribedCount + 1,
            action_seconds: 10,
            rest_seconds: 5,
            sets: 3,
            auto_progress: true,
          }),
        })

        if (!mtRes.ok) throw new Error('トレーニング追加に失敗しました')
      }

      showModalMessage({ type: 'success', title: '処方完了', message: 'トレーニングを処方しました' })
      loadAllData()
    } catch (error) {
      console.error('処方エラー:', error)
      showModalMessage({ type: 'error', title: 'エラー', message: '処方に失敗しました' })
    }
  }

  const handleUnprescribe = (menuTrainingId: string) => {
    showModalMessage({
      type: 'confirm',
      title: '処方解除の確認',
      message: 'このトレーニングの処方を解除しますか？',
      onConfirm: () => executeUnprescribe(menuTrainingId),
    })
  }

  const executeUnprescribe = async (menuTrainingId: string) => {
    try {
      const res = await fetch(`/api/training/menu-trainings?id=${menuTrainingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('処方解除に失敗しました')

      showModalMessage({ type: 'success', title: '解除完了', message: '処方を解除しました' })
      loadAllData()
    } catch (error) {
      console.error('処方解除エラー:', error)
      showModalMessage({ type: 'error', title: 'エラー', message: '処方解除に失敗しました' })
    }
  }

  const getLevelBadge = (training: TrainingWithStatus | undefined) => {
    if (!training || !training.is_prescribed) return null
    if (training.latest_evaluation_level === null) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">🔵 処方中（未評価）</span>
    }
    if (training.is_completed) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">✅ レベル3達成</span>
    }
    if (training.latest_evaluation_level === 2) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">⚠️ レベル2</span>
    }
    if (training.latest_evaluation_level === 1) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">❌ レベル1</span>
    }
    return null
  }

  const getStepStatusIcon = (stepTrainings: (TrainingWithStatus | undefined)[]) => {
    const valid = stepTrainings.filter(Boolean) as TrainingWithStatus[]
    if (valid.length === 0) return '⚪'
    if (valid.every((t) => t.is_completed)) return '✅'
    if (valid.some((t) => t.is_prescribed)) return '🔵'
    return '⚪'
  }

  const renderTrainingCard = (training: TrainingWithStatus | undefined, fallbackName: string) => {
    if (!training) {
      return (
        <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
          <div className="text-gray-500">トレーニング「{fallbackName}」が見つかりません</div>
        </div>
      )
    }

    return (
      <div
        key={training.id}
        className={`bg-white rounded-lg p-4 border-2 transition-all ${
          training.is_prescribed ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900">{training.training_name}</h4>
              <div className="flex gap-2 ml-4">
                {training.is_prescribed ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectedTrainingForEvaluation(training)
                        setShowEvaluationModal(true)
                      }}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium"
                    >
                      📝 評価
                    </button>
                    <button
                      onClick={() => {
                        if (training.menu_training_id) handleUnprescribe(training.menu_training_id)
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium"
                    >
                      解除
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handlePrescribe(training.id)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium"
                  >
                    処方する
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">{getLevelBadge(training)}</div>
              {training.evaluation_count > 0 && (
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>評価 {training.evaluation_count}回</span>
                  {training.latest_evaluated_at && (
                    <span>最終評価: {new Date(training.latest_evaluated_at).toLocaleDateString('ja-JP')}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  // DB or フォールバックの現在のプロトコルを取得
  const currentDbProtocol = dbProtocols?.find((p) => p.id === activeProtocolId)
  const currentFallbackProtocol = !dbProtocols ? protocols.find((p) => p.id === activeProtocolId) : undefined
  const isParallel = currentDbProtocol?.is_parallel_layout ?? currentFallbackProtocol?.is_parallel_layout ?? false
  const activeProtocolList = dbProtocols ?? protocols

  return (
    <div className="flex flex-col h-full">
      {/* プロトコルタブ */}
      <div className="border-b border-gray-200 mb-4 flex-shrink-0">
        <div className="flex gap-2">
          {activeProtocolList.map((proto) => (
            <button
              key={proto.id}
              onClick={() => setActiveProtocolId(proto.id)}
              className={`px-6 py-2 font-medium text-base transition-colors ${
                activeProtocolId === proto.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {proto.name}
            </button>
          ))}
        </div>
      </div>

      {/* スクロール可能なコンテンツエリア */}
      <div className="flex-1 overflow-y-auto">
        {/* DB由来のプロトコルを表示 */}
        {currentDbProtocol && (
          <div className={isParallel ? 'flex gap-6' : 'space-y-6'}>
            {currentDbProtocol.steps.map((step, index) => {
              const stepTrainings = step.items.map((item) => getTrainingById(item.training_id))
              const stepNames = step.items.map((item) => item.training.training_name)
              const isExpanded = expandedSteps.has(step.id)
              const statusIcon = getStepStatusIcon(stepTrainings)

              return (
                <div key={step.id} className={isParallel ? 'flex-1' : 'relative'}>
                  {!isParallel && index > 0 && (
                    <div className="flex justify-center py-2">
                      <div className="text-3xl text-gray-400">↓</div>
                    </div>
                  )}
                  <div className={isParallel ? 'space-y-4' : 'flex gap-6'}>
                    <div className={isParallel ? 'w-full' : 'w-80 flex-shrink-0'}>
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{statusIcon}</span>
                            <div>
                              {!isParallel && (
                                <div className="text-xs font-semibold opacity-90">ステップ {step.step_number}</div>
                              )}
                              <div className="text-lg font-bold">{step.checkpoint_name}</div>
                            </div>
                          </div>
                          <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                        </div>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="flex-1">
                        <div className="space-y-3">
                          {stepTrainings.map((training, tIdx) =>
                            renderTrainingCard(training, stepNames[tIdx])
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* フォールバックプロトコルを表示 */}
        {!currentDbProtocol && currentFallbackProtocol && (
          <div className={isParallel ? 'flex gap-6' : 'space-y-6'}>
            {currentFallbackProtocol.steps.map((flowStep, index) => {
              const stepTrainings = flowStep.trainingNames.map((name) => getTrainingByName(name))
              const isExpanded = expandedSteps.has(flowStep.id)
              const statusIcon = getStepStatusIcon(stepTrainings)

              return (
                <div key={flowStep.id} className={isParallel ? 'flex-1' : 'relative'}>
                  {!isParallel && index > 0 && (
                    <div className="flex justify-center py-2">
                      <div className="text-3xl text-gray-400">↓</div>
                    </div>
                  )}
                  <div className={isParallel ? 'space-y-4' : 'flex gap-6'}>
                    <div className={isParallel ? 'w-full' : 'w-80 flex-shrink-0'}>
                      <button
                        onClick={() => toggleStep(flowStep.id)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all text-left"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{statusIcon}</span>
                            <div>
                              {!isParallel && (
                                <div className="text-xs font-semibold opacity-90">ステップ {flowStep.step_number}</div>
                              )}
                              <div className="text-lg font-bold">{flowStep.checkpoint_name}</div>
                            </div>
                          </div>
                          <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                        </div>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="flex-1">
                        <div className="space-y-3">
                          {stepTrainings.map((training, tIdx) =>
                            renderTrainingCard(training, flowStep.trainingNames[tIdx])
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* モーダル */}
      {showModal && modalConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">{modalConfig.title}</h3>
            <p className="text-gray-700 mb-6">{modalConfig.message}</p>
            <div className="flex justify-end gap-3">
              {modalConfig.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      modalConfig.onConfirm?.()
                    }}
                    className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    解除する
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 評価モーダル */}
      {selectedTrainingForEvaluation && (
        <TrainingEvaluationModal
          isOpen={showEvaluationModal}
          onClose={() => {
            setShowEvaluationModal(false)
            setSelectedTrainingForEvaluation(null)
          }}
          training={selectedTrainingForEvaluation}
          patientId={patientId}
          menuTrainingId={selectedTrainingForEvaluation.menu_training_id || ''}
          onSuccess={() => loadAllData()}
        />
      )}
    </div>
  )
}
