'use client'

import { useState, useEffect } from 'react'
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

// トレーニングフローの定義
const TRAINING_FLOW_CATEGORIES = [
  {
    category: "舌",
    icon: "👅",
    steps: [
      {
        step: 1,
        checkPoint: "『あ』の口ができるか？",
        description: "口を大きく開けて『あ』の形が作れるか確認",
        trainingNames: ["「あ」の口の確認"]
      },
      {
        step: 2,
        checkPoint: "舌尖が前に伸びるか？",
        description: "舌の先端を前方に十分伸ばせるか確認",
        trainingNames: ["舌を前に出す", "舌を左右に振る", "口唇をなぞる", "舌小帯伸ばし"]
      },
      {
        step: 3,
        checkPoint: "スポット位置に置けるか？",
        description: "舌を正しいスポット位置（上あごの前方）に置けるか確認",
        trainingNames: ["スポットの位置確認"]
      },
      {
        step: 4,
        checkPoint: "吸い上げができるか？",
        description: "舌を上あごに吸い付けた状態を保持できるか確認",
        trainingNames: ["吸い上げ", "吸い上げができない場合", "チューブ吸い"]
      },
      {
        step: 5,
        checkPoint: "吸い上げ状態の嚥下ができるか？",
        description: "舌を吸い上げた状態で飲み込めるか確認",
        trainingNames: ["舌筋の訓練"]
      }
    ]
  },
  {
    category: "口唇",
    icon: "👄",
    steps: [
      {
        step: 1,
        checkPoint: "口唇が弱い",
        description: "口唇の筋力を鍛える",
        trainingNames: ["口輪筋訓練"]
      },
      {
        step: 2,
        checkPoint: "口唇が強い",
        description: "口唇の緊張を除去し柔軟性を高める",
        trainingNames: ["口唇の緊張除去", "上唇小帯と下唇小帯を伸ばす"]
      }
    ]
  },
  {
    category: "体操",
    icon: "🤸",
    steps: [
      {
        step: 1,
        checkPoint: "体操",
        description: "総合的な体操トレーニング",
        trainingNames: ["あいうべ体操", "タラ体操"]
      }
    ]
  }
]

export default function TrainingFlowChart({ patientId, clinicId }: TrainingFlowChartProps) {
  const [allTrainings, setAllTrainings] = useState<TrainingWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]))
  const [activeCategory, setActiveCategory] = useState<string>("舌")
  const [showModal, setShowModal] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    type: 'success' | 'confirm' | 'error'
    title: string
    message: string
    onConfirm?: () => void
  } | null>(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [selectedTrainingForEvaluation, setSelectedTrainingForEvaluation] = useState<TrainingWithStatus | null>(null)

  useEffect(() => {
    loadAllData()
  }, [patientId])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      // 全トレーニングを取得
      const trainingsRes = await fetch('/api/training/trainings')
      if (!trainingsRes.ok) {
        throw new Error(`トレーニングデータの取得に失敗: ${trainingsRes.statusText}`)
      }
      const trainingsJson = await trainingsRes.json()
      const trainingsData = trainingsJson.data || []

      console.log('取得したトレーニング数:', trainingsData.length)

      // アクティブなメニューを取得
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

      // 評価進捗を取得
      const evalRes = await fetch(`/api/training/evaluations?patient_id=${patientId}`)
      const evalJson = await evalRes.json()
      const progressData = evalJson.data || []

      // トレーニングごとの評価情報を集計
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

      // トレーニングデータと評価情報を統合
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
      if (error instanceof Error) {
        console.error('エラーメッセージ:', error.message)
        console.error('エラースタック:', error.stack)
      }
      alert('トレーニングデータの取得に失敗しました。\nサーバーが起動しているか確認してください。')
    } finally {
      setIsLoading(false)
    }
  }

  // トレーニング名からトレーニングを取得
  const getTrainingByName = (name: string): TrainingWithStatus | undefined => {
    return allTrainings.find((t) => t.training_name === name)
  }

  // ステップの展開/折りたたみ
  const toggleStep = (step: number) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(step)) {
      newExpanded.delete(step)
    } else {
      newExpanded.add(step)
    }
    setExpandedSteps(newExpanded)
  }

  // モーダルを表示
  const showModalMessage = (config: {
    type: 'success' | 'confirm' | 'error'
    title: string
    message: string
    onConfirm?: () => void
  }) => {
    setModalConfig(config)
    setShowModal(true)
  }

  // トレーニングの処方
  const handlePrescribe = async (trainingId: string) => {
    try {
      if (!activeMenuId) {
        // 新しいメニューを作成
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

        // トレーニングを追加
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
        // 既存メニューにトレーニングを追加
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

      showModalMessage({
        type: 'success',
        title: '処方完了',
        message: 'トレーニングを処方しました'
      })
      loadAllData()
    } catch (error) {
      console.error('処方エラー:', error)
      showModalMessage({
        type: 'error',
        title: 'エラー',
        message: '処方に失敗しました'
      })
    }
  }

  // トレーニングの処方解除
  const handleUnprescribe = (menuTrainingId: string) => {
    showModalMessage({
      type: 'confirm',
      title: '処方解除の確認',
      message: 'このトレーニングの処方を解除しますか？',
      onConfirm: () => executeUnprescribe(menuTrainingId)
    })
  }

  const executeUnprescribe = async (menuTrainingId: string) => {
    try {
      const res = await fetch(`/api/training/menu-trainings?id=${menuTrainingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('処方解除に失敗しました')

      showModalMessage({
        type: 'success',
        title: '解除完了',
        message: '処方を解除しました'
      })
      loadAllData()
    } catch (error) {
      console.error('処方解除エラー:', error)
      showModalMessage({
        type: 'error',
        title: 'エラー',
        message: '処方解除に失敗しました'
      })
    }
  }

  // 評価レベルのバッジ
  const getLevelBadge = (training: TrainingWithStatus | undefined) => {
    if (!training) {
      return null
    }
    if (!training.is_prescribed) {
      return null
    }
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

  // ステップのステータスアイコン
  const getStepStatusIcon = (stepTrainings: (TrainingWithStatus | undefined)[]) => {
    const validTrainings = stepTrainings.filter((t) => t !== undefined) as TrainingWithStatus[]
    if (validTrainings.length === 0) return '⚪'

    const allCompleted = validTrainings.every((t) => t.is_completed)
    if (allCompleted) return '✅'

    const anyPrescribed = validTrainings.some((t) => t.is_prescribed)
    if (anyPrescribed) return '🔵'

    return '⚪'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  const currentCategory = TRAINING_FLOW_CATEGORIES.find((cat) => cat.category === activeCategory)

  return (
    <div className="flex flex-col h-full">
      {/* カテゴリータブナビゲーション - 固定 */}
      <div className="border-b border-gray-200 mb-4 flex-shrink-0">
        <div className="flex gap-2">
          {TRAINING_FLOW_CATEGORIES.map((category) => (
            <button
              key={category.category}
              onClick={() => setActiveCategory(category.category)}
              className={`px-6 py-2 font-medium text-base transition-colors ${
                activeCategory === category.category
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>
      </div>

      {/* スクロール可能なコンテンツエリア */}
      <div className="flex-1 overflow-y-auto">
        {/* 選択されたカテゴリーのステップを表示 */}
        {currentCategory && (
          <div className={currentCategory.category === "口唇" ? "flex gap-6" : "space-y-6"}>
          {currentCategory.steps.map((flowStep, index) => {
        const stepTrainings = flowStep.trainingNames.map((name) => getTrainingByName(name))
        const isExpanded = expandedSteps.has(flowStep.step)
        const statusIcon = getStepStatusIcon(stepTrainings)

        return (
          <div key={flowStep.step} className={currentCategory.category === "口唇" ? "flex-1" : "relative"}>
            {/* ステップ間の矢印 */}
            {currentCategory.category !== "口唇" && index > 0 && (
              <div className="flex justify-center py-2">
                <div className="text-3xl text-gray-400">↓</div>
              </div>
            )}

            <div className={currentCategory.category === "口唇" ? "space-y-4" : "flex gap-6"}>
              {/* 左側：評価項目 */}
              <div className={currentCategory.category === "口唇" ? "w-full" : "w-80 flex-shrink-0"}>
                <button
                  onClick={() => toggleStep(flowStep.step)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{statusIcon}</span>
                      <div>
                        {currentCategory.category !== "口唇" && (
                          <div className="text-xs font-semibold opacity-90">ステップ {flowStep.step}</div>
                        )}
                        <div className="text-lg font-bold">{flowStep.checkPoint}</div>
                      </div>
                    </div>
                    <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </button>
              </div>

              {/* 右側：推奨トレーニング */}
              {isExpanded && (
                <div className="flex-1">
                  <div className="space-y-3">
                    {stepTrainings.map((training, tIndex) => {
                      if (!training) {
                        return (
                          <div key={tIndex} className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
                            <div className="text-gray-500">
                              トレーニング「{flowStep.trainingNames[tIndex]}」が見つかりません
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={training.id}
                          className={`bg-white rounded-lg p-4 border-2 transition-all ${
                            training.is_prescribed
                              ? 'border-blue-400 shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-900">{training.training_name}</h4>
                                {/* タイトル右側のアクションボタン */}
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
                                          if (training.menu_training_id) {
                                            handleUnprescribe(training.menu_training_id)
                                          }
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
                                      <span>
                                        最終評価: {new Date(training.latest_evaluated_at).toLocaleDateString('ja-JP')}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
          onSuccess={() => {
            // 評価成功後、データを再読み込み
            loadAllData()
          }}
        />
      )}
    </div>
  )
}
