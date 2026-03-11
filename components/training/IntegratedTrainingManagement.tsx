'use client'

import { useState, useEffect, useCallback } from 'react'
import { Training } from '@/types/training'
import { EvaluationProgressSummary } from '@/types/evaluation'

interface IntegratedTrainingManagementProps {
  patientId: string
  clinicId: string
}

// フォールバック用のハードコードグループ
const FALLBACK_GROUPS = [
  {
    id: 'tongue',
    name: '舌のトレーニング',
    icon: '👅',
    color: 'blue',
    sort_order: 0,
    categories: ['舌系の訓練', '舌の運動'],
  },
  {
    id: 'lips',
    name: '口唇のトレーニング',
    icon: '👄',
    color: 'pink',
    sort_order: 1,
    categories: ['口唇系の訓練', '唇の運動', '頬の運動'],
  },
  {
    id: 'bite',
    name: '咬合力・歯列のトレーニング',
    icon: '🦷',
    color: 'green',
    sort_order: 2,
    categories: ['咬合力系の訓練', '歯列改善系の訓練'],
  },
  {
    id: 'other',
    name: 'その他のトレーニング',
    icon: '🏃',
    color: 'blue',
    sort_order: 3,
    categories: ['発音', '口の開閉', '吸引', 'うがい', 'その他'],
  },
]

interface TrainingGroup {
  id: string
  name: string
  icon: string
  color: string
  sort_order: number
  // DB由来の場合はitemsを持つ、フォールバックの場合はcategories
  categories?: string[]
  items?: { id: string; training_id: string; training: Training }[]
}

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
  const [activeGroupId, setActiveGroupId] = useState<string>('tongue')
  const [allTrainings, setAllTrainings] = useState<TrainingWithStatus[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [groups, setGroups] = useState<TrainingGroup[]>(FALLBACK_GROUPS)
  const [usingDbGroups, setUsingDbGroups] = useState(false)

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/clinic/groups?clinicId=${clinicId}`)
      if (!res.ok) return

      const { groups: dbGroups } = await res.json()
      if (dbGroups && dbGroups.length > 0) {
        setGroups(dbGroups)
        setUsingDbGroups(true)
        setActiveGroupId(dbGroups[0].id)
      } else {
        // グループ未設定なら自動シード
        await fetch(`/api/training/clinic/seed-groups?clinicId=${clinicId}`, { method: 'POST' })
        // シード後に再取得
        const res2 = await fetch(`/api/training/clinic/groups?clinicId=${clinicId}`)
        if (res2.ok) {
          const { groups: seeded } = await res2.json()
          if (seeded && seeded.length > 0) {
            setGroups(seeded)
            setUsingDbGroups(true)
            setActiveGroupId(seeded[0].id)
          }
        }
      }
    } catch {
      // フォールバックのままにする
    }
  }, [clinicId])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    loadAllData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/training/training-management?patientId=${patientId}&clinicId=${clinicId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'データ取得に失敗しました')
      }

      const { trainings: trainingsData, activeMenu: activeMenuData, progress: progressData, records: recordsData } = result

      setActiveMenuId(activeMenuData?.id || null)

      const prescribedTrainingIds = new Set(
        activeMenuData?.menu_trainings?.map((mt: any) => mt.training_id) || []
      )
      const menuTrainingMap = new Map(
        activeMenuData?.menu_trainings?.map((mt: any) => [mt.training_id, mt.id]) || []
      )

      const evaluationMap = new Map<string, EvaluationProgressSummary>()
      progressData?.forEach((evaluation: any) => {
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
      setTrainingRecords(recordsData || [])
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // グループのトレーニングを取得
  const getGroupTrainings = (group: TrainingGroup): TrainingWithStatus[] => {
    if (usingDbGroups && group.items) {
      // DB由来: itemsのtraining_idで絞り込む
      const trainingIds = new Set(group.items.map((item) => item.training_id))
      return allTrainings.filter((t) => trainingIds.has(t.id))
    } else {
      // フォールバック: カテゴリ名で絞り込む
      const cats = group.categories || []
      return allTrainings.filter((t) => cats.includes(t.category || ''))
    }
  }

  // トレーニングの処方
  const handlePrescribe = async (trainingId: string) => {
    try {
      const response = await fetch('/api/training/training-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prescribe',
          patientId,
          clinicId,
          trainingId,
          activeMenuId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '処方に失敗しました')
      }

      if (result.menuId) {
        setActiveMenuId(result.menuId)
      }

      alert('トレーニングを処方しました')
      loadAllData()
      setShowActionMenu(null)
    } catch (error: any) {
      console.error('処方エラー:', error)
      alert(error.message || '処方に失敗しました')
    }
  }

  // トレーニングの処方解除
  const handleUnprescribe = async (menuTrainingId: string) => {
    if (!confirm('このトレーニングの処方を解除しますか？')) return

    try {
      const response = await fetch('/api/training/training-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unprescribe',
          menuTrainingId,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || '処方解除に失敗しました')
      }

      alert('処方を解除しました')
      loadAllData()
      setShowActionMenu(null)
    } catch (error: any) {
      console.error('処方解除エラー:', error)
      alert(error.message || '処方解除に失敗しました')
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

  // カラークラス
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { border: string; bg: string; hover: string; text: string; button: string }> = {
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
    return colorMap[color] || colorMap.blue
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0]
  const groupTrainings = activeGroup ? getGroupTrainings(activeGroup) : []
  const colors = getColorClasses(activeGroup?.color || 'blue')

  return (
    <div className="space-y-6">
      {/* グループタブ */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2 flex-wrap">
          {groups.map((group) => {
            const trainings = getGroupTrainings(group)
            const completed = trainings.filter((t) => t.is_completed).length

            return (
              <button
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className={`px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeGroupId === group.id
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
          <span className="text-2xl">{activeGroup?.icon}</span>
          {activeGroup?.name}
          <span className="text-sm font-normal text-gray-600">
            （{groupTrainings.filter((t) => t.is_prescribed).length}件処方中）
          </span>
        </h3>

        {groupTrainings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            このグループにトレーニングがありません
          </div>
        ) : (
          <div className="space-y-3">
            {groupTrainings.map((training) => (
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
