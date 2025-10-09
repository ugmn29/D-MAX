'use client'

import { useState, useEffect } from 'react'
import { EvaluationProgressSummary } from '@/types/evaluation'

interface TrainingProgressChartProps {
  patientId: string
}

// カテゴリーマッピング：既存カテゴリーを3つのグループに分類
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

export default function TrainingProgressChart({ patientId }: TrainingProgressChartProps) {
  const [progress, setProgress] = useState<EvaluationProgressSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [patientId])

  const loadProgress = async () => {
    try {
      const response = await fetch(
        `/api/training/evaluations/progress?patient_id=${patientId}`
      )
      const result = await response.json()

      if (response.ok) {
        setProgress(result.data || [])
      } else {
        console.error('進捗取得エラー:', result.error)
      }
    } catch (error) {
      console.error('進捗取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // カテゴリーグループごとにトレーニングを分類
  const categorizeProgress = () => {
    const categorized: Record<CategoryGroup, EvaluationProgressSummary[]> = {
      tongue: [],
      lips: [],
      bite: [],
    }

    progress.forEach((item) => {
      const category = item.training_category

      // カテゴリーグループを特定
      if (CATEGORY_GROUPS.tongue.categories.includes(category)) {
        categorized.tongue.push(item)
      } else if (CATEGORY_GROUPS.lips.categories.includes(category)) {
        categorized.lips.push(item)
      } else if (CATEGORY_GROUPS.bite.categories.includes(category)) {
        categorized.bite.push(item)
      }
    })

    return categorized
  }

  // 評価レベルのバッジスタイル
  const getLevelBadge = (level: number | null) => {
    if (level === null) {
      return <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">未評価</span>
    }
    switch (level) {
      case 1:
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">❌ レベル1</span>
      case 2:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">⚠️ レベル2</span>
      case 3:
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">✅ レベル3</span>
      default:
        return <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">-</span>
    }
  }

  // カテゴリーグループの統計を計算
  const getGroupStats = (items: EvaluationProgressSummary[]) => {
    const completed = items.filter((item) => item.is_completed).length
    const total = items.length
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (progress.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-2">進捗データがありません</p>
        <p className="text-sm text-gray-500">
          来院時評価を記録すると、ここに進捗が表示されます
        </p>
      </div>
    )
  }

  const categorizedProgress = categorizeProgress()
  const completed = progress.filter((p) => p.is_completed)

  return (
    <div className="space-y-8">
      {/* 全体サマリー */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-100">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{progress.length}</div>
            <div className="text-sm text-gray-600 mt-1">評価済みトレーニング</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{completed.length}</div>
            <div className="text-sm text-gray-600 mt-1">レベル3達成</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">
              {progress.length > 0 ? Math.round((completed.length / progress.length) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">達成率</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${progress.length > 0 ? (completed.length / progress.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* カテゴリー別フローチャート */}
      {(Object.keys(CATEGORY_GROUPS) as CategoryGroup[]).map((groupKey) => {
        const group = CATEGORY_GROUPS[groupKey]
        const items = categorizedProgress[groupKey]

        if (items.length === 0) return null

        const stats = getGroupStats(items)
        const colorClasses = {
          blue: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-600', progress: 'bg-blue-500' },
          pink: { border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-600', progress: 'bg-pink-500' },
          green: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-600', progress: 'bg-green-500' },
        }
        const colors = colorClasses[group.color]

        return (
          <div key={groupKey} className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-6`}>
            {/* カテゴリーヘッダー */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xl font-bold ${colors.text} flex items-center gap-2`}>
                  <span className="text-2xl">{group.icon}</span>
                  {group.name}
                </h3>
                <div className="text-sm font-semibold text-gray-700">
                  {stats.completed}/{stats.total} 達成 ({stats.percentage}%)
                </div>
              </div>
              <div className="w-full bg-white rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${colors.progress}`}
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>

            {/* フローチャート形式のトレーニング一覧 */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.training_id}>
                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {/* ステータスアイコン */}
                        <div className="flex-shrink-0">
                          {item.is_completed ? (
                            <span className="text-2xl">✅</span>
                          ) : item.latest_evaluation_level === 2 ? (
                            <span className="text-2xl">⚠️</span>
                          ) : item.latest_evaluation_level === 1 ? (
                            <span className="text-2xl">❌</span>
                          ) : (
                            <span className="text-2xl">⚪</span>
                          )}
                        </div>

                        {/* トレーニング名 */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.training_name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>評価 {item.evaluation_count}回</span>
                            {item.latest_evaluated_at && (
                              <span>
                                最終評価: {new Date(item.latest_evaluated_at).toLocaleDateString('ja-JP')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 現在のレベル */}
                        <div className="flex-shrink-0">{getLevelBadge(item.latest_evaluation_level)}</div>
                      </div>
                    </div>
                  </div>

                  {/* 矢印（最後のアイテム以外） */}
                  {index < items.length - 1 && (
                    <div className="flex justify-center py-2">
                      <span className="text-2xl text-gray-400">↓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
