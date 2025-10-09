'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Training } from '@/types/training'
import { EvaluationProgressSummary } from '@/types/evaluation'

interface IntegratedTrainingManagementProps {
  patientId: string
  clinicId: string
}

// カテゴリーマッピング
const CATEGORY_GROUPS = {
  tongue: {
    name: '舌のトレーニング',
    icon: '👅',
    color: 'blue',
    categories: ['舌訓練', '舌位置', '柔軟性'],
  },
  lips: {
    name: '口唇のトレーニング',
    icon: '👄',
    color: 'pink',
    categories: ['筋力訓練', '基礎訓練', 'リラックス', '呼吸訓練'],
  },
  bite: {
    name: '咬合力のトレーニング',
    icon: '🦷',
    color: 'green',
    categories: ['総合訓練', '顎訓練'],
  },
} as const

type CategoryGroup = keyof typeof CATEGORY_GROUPS

interface TrainingWithStatus extends Training {
  is_prescribed: boolean
  latest_evaluation_level: number | null
  evaluation_count: number
  is_completed: boolean
  latest_evaluated_at: string | null
  menu_training_id: string | null
}

interface TrainingRecord {
  id: string
  training_id: string
  performed_at: string
  completed: boolean
  interrupted: boolean
  time_of_day: string
  actual_duration_seconds: number
  training?: Training
}

export default function IntegratedTrainingManagement({
  patientId,
  clinicId,
}: IntegratedTrainingManagementProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryGroup>('tongue')
  const [allTrainings, setAllTrainings] = useState<TrainingWithStatus[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [patientId])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      // 全トレーニングを取得
      const { data: trainingsData, error: trainingsError } = await supabase
        .from('trainings')
        .select('*')
        .eq('is_deleted', false)
        .is('clinic_id', null)
        .order('category')
        .order('training_name')

      if (trainingsError) throw trainingsError

      // アクティブなメニューを取得
      const { data: activeMenuData } = await supabase
        .from('training_menus')
        .select(`
          id,
          menu_trainings(
            id,
            training_id
          )
        `)
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .single()

      setActiveMenuId(activeMenuData?.id || null)

      const prescribedTrainingIds = new Set(
        activeMenuData?.menu_trainings?.map((mt: any) => mt.training_id) || []
      )
      const menuTrainingMap = new Map(
        activeMenuData?.menu_trainings?.map((mt: any) => [mt.training_id, mt.id]) || []
      )

      // 評価進捗を取得
      const { data: progressData } = await supabase
        .from('training_evaluations')
        .select('training_id, evaluation_level, evaluated_at')
        .eq('patient_id', patientId)
        .order('evaluated_at', { ascending: false })

      // トレーニングごとの評価情報を集計
      const evaluationMap = new Map<string, EvaluationProgressSummary>()
      progressData?.forEach((evaluation) => {
        if (!evaluationMap.has(evaluation.training_id)) {
          evaluationMap.set(evaluation.training_id, {
            training_id: evaluation.training_id,
            training_name: '',
            training_category: '',
            latest_evaluation_level: evaluation.evaluation_level,
            latest_evaluated_at: evaluation.evaluated_at,
            evaluation_count: 1,
            level_3_count: evaluation.evaluation_level === 3 ? 1 : 0,
            is_completed: evaluation.evaluation_level === 3,
          })
        } else {
          const existing = evaluationMap.get(evaluation.training_id)!
          existing.evaluation_count++
          if (evaluation.evaluation_level === 3) {
            existing.level_3_count++
          }
        }
      })

      // トレーニングデータと評価情報を統合
      const trainingsWithStatus: TrainingWithStatus[] = (trainingsData || []).map((training) => {
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

      // 実施記録を取得
      const { data: recordsData } = await supabase
        .from('training_records')
        .select(`
          *,
          training:trainings(*)
        `)
        .eq('patient_id', patientId)
        .order('performed_at', { ascending: false })
        .limit(50)

      setTrainingRecords(recordsData || [])
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // カテゴリーでフィルタリング
  const getCategoryTrainings = (category: CategoryGroup) => {
    const categories = CATEGORY_GROUPS[category].categories
    return allTrainings.filter((t) => categories.includes(t.category || ''))
  }

  // トレーニングの処方
  const handlePrescribe = async (trainingId: string) => {
    try {
      if (!activeMenuId) {
        // 新しいメニューを作成
        const { data: menuData, error: menuError } = await supabase
          .from('training_menus')
          .insert({
            patient_id: patientId,
            clinic_id: clinicId,
            menu_name: `トレーニングメニュー`,
            is_active: true,
          })
          .select()
          .single()

        if (menuError) throw menuError
        setActiveMenuId(menuData.id)

        // トレーニングを追加
        const { error: mtError } = await supabase.from('menu_trainings').insert({
          menu_id: menuData.id,
          training_id: trainingId,
          sort_order: 1,
          action_seconds: 10,
          rest_seconds: 5,
          sets: 3,
          auto_progress: true,
        })

        if (mtError) throw mtError
      } else {
        // 既存メニューにトレーニングを追加
        const prescribedCount = allTrainings.filter((t) => t.is_prescribed).length

        const { error } = await supabase.from('menu_trainings').insert({
          menu_id: activeMenuId,
          training_id: trainingId,
          sort_order: prescribedCount + 1,
          action_seconds: 10,
          rest_seconds: 5,
          sets: 3,
          auto_progress: true,
        })

        if (error) throw error
      }

      alert('トレーニングを処方しました')
      loadAllData()
      setShowActionMenu(null)
    } catch (error) {
      console.error('処方エラー:', error)
      alert('処方に失敗しました')
    }
  }

  // トレーニングの処方解除
  const handleUnprescribe = async (menuTrainingId: string) => {
    if (!confirm('このトレーニングの処方を解除しますか？')) return

    try {
      const { error } = await supabase
        .from('menu_trainings')
        .delete()
        .eq('id', menuTrainingId)

      if (error) throw error

      alert('処方を解除しました')
      loadAllData()
      setShowActionMenu(null)
    } catch (error) {
      console.error('処方解除エラー:', error)
      alert('処方解除に失敗しました')
    }
  }

  // 評価レベルのバッジ
  const getLevelBadge = (training: TrainingWithStatus) => {
    if (!training.is_prescribed) {
      return <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">未処方</span>
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
    return <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">-</span>
  }

  // カテゴリーのカラークラス
  const getCategoryColorClasses = (category: CategoryGroup) => {
    const colorMap = {
      blue: {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        hover: 'hover:bg-blue-100',
        text: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
      },
      pink: {
        border: 'border-pink-200',
        bg: 'bg-pink-50',
        hover: 'hover:bg-pink-100',
        text: 'text-pink-600',
        button: 'bg-pink-600 hover:bg-pink-700',
      },
      green: {
        border: 'border-green-200',
        bg: 'bg-green-50',
        hover: 'hover:bg-green-100',
        text: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700',
      },
    }
    return colorMap[CATEGORY_GROUPS[category].color]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  const categoryTrainings = getCategoryTrainings(activeCategory)
  const colors = getCategoryColorClasses(activeCategory)

  return (
    <div className="space-y-6">
      {/* カテゴリータブ */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2">
          {(Object.keys(CATEGORY_GROUPS) as CategoryGroup[]).map((key) => {
            const group = CATEGORY_GROUPS[key]
            const trainings = getCategoryTrainings(key)
            const prescribed = trainings.filter((t) => t.is_prescribed).length
            const completed = trainings.filter((t) => t.is_completed).length

            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeCategory === key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">{group.icon}</span>
                <span>{group.name}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {completed}/{trainings.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* トレーニング一覧 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">{CATEGORY_GROUPS[activeCategory].icon}</span>
          {CATEGORY_GROUPS[activeCategory].name}
          <span className="text-sm font-normal text-gray-600">
            （{categoryTrainings.filter((t) => t.is_prescribed).length}件処方中）
          </span>
        </h3>

        {categoryTrainings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            このカテゴリーにトレーニングがありません
          </div>
        ) : (
          <div className="space-y-3">
            {categoryTrainings.map((training) => (
              <div
                key={training.id}
                className={`bg-white rounded-lg border-2 ${
                  training.is_prescribed ? 'border-blue-300' : 'border-gray-200'
                } p-4 hover:shadow-md transition-all cursor-pointer relative`}
                onClick={() => setShowActionMenu(showActionMenu === training.id ? null : training.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* ステータスアイコン */}
                    <div className="flex-shrink-0 text-2xl">
                      {training.is_completed ? (
                        '✅'
                      ) : training.is_prescribed ? (
                        training.latest_evaluation_level === 2 ? (
                          '⚠️'
                        ) : training.latest_evaluation_level === 1 ? (
                          '❌'
                        ) : (
                          '🔵'
                        )
                      ) : (
                        '⚪'
                      )}
                    </div>

                    {/* トレーニング情報 */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{training.training_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{training.description}</p>
                      {training.evaluation_count > 0 && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>評価 {training.evaluation_count}回</span>
                          {training.latest_evaluated_at && (
                            <span>
                              最終評価: {new Date(training.latest_evaluated_at).toLocaleDateString('ja-JP')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ステータスバッジ */}
                    <div className="flex-shrink-0">{getLevelBadge(training)}</div>
                  </div>
                </div>

                {/* アクションメニュー */}
                {showActionMenu === training.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    {training.is_prescribed ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `/training/clinic/evaluate/${patientId}`
                          }}
                          className={`flex-1 px-4 py-2 ${colors.button} text-white rounded-lg font-medium`}
                        >
                          📝 評価を記録
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (training.menu_training_id) {
                              handleUnprescribe(training.menu_training_id)
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                        >
                          ❌ 処方解除
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePrescribe(training.id)
                        }}
                        className={`flex-1 px-4 py-2 ${colors.button} text-white rounded-lg font-medium`}
                      >
                        ➕ 処方する
                        </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 実施記録セクション */}
      {trainingRecords.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📝 最近の実施記録</h3>
          <div className="space-y-3">
            {trainingRecords.slice(0, 10).map((record) => (
              <div key={record.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {record.training?.training_name || 'トレーニング'}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                      <span>{new Date(record.performed_at).toLocaleString('ja-JP')}</span>
                      <span>時間帯: {record.time_of_day}</span>
                      <span>実施時間: {Math.round(record.actual_duration_seconds / 60)}分</span>
                    </div>
                  </div>
                  <div>
                    {record.completed ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        完了
                      </span>
                    ) : record.interrupted ? (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                        中断
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        未完了
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
