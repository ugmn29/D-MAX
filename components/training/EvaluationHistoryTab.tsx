'use client'

import { useState, useEffect } from 'react'
import { TrainingEvaluation } from '@/types/evaluation'

interface EvaluationHistoryTabProps {
  patientId: string
}

interface TimelineEntry {
  date: string
  evaluated_at: string
  evaluations: TrainingEvaluation[]
}

export default function EvaluationHistoryTab({ patientId }: EvaluationHistoryTabProps) {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [patientId])

  const loadHistory = async () => {
    try {
      const response = await fetch(
        `/api/training/evaluations/history?patient_id=${patientId}`
      )
      const result = await response.json()

      if (response.ok) {
        setTimeline(result.data || [])
      } else {
        console.error('評価履歴取得エラー:', result.error)
      }
    } catch (error) {
      console.error('評価履歴取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getEvaluationLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'text-red-600 bg-red-100'
      case 2:
        return 'text-yellow-600 bg-yellow-100'
      case 3:
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getEvaluationLevelIcon = (level: number) => {
    switch (level) {
      case 1:
        return '❌'
      case 2:
        return '⚠️'
      case 3:
        return '✅'
      default:
        return '❓'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-2">評価履歴がありません</p>
        <p className="text-sm text-gray-500">
          来院時評価を記録すると、ここに履歴が表示されます
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {timeline.map((entry, index) => (
        <div key={entry.date} className="relative">
          {/* タイムライン線 */}
          {index !== timeline.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
          )}

          {/* 日付 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              {new Date(entry.date).getDate()}
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {new Date(entry.date).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(entry.evaluated_at).toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* 評価一覧 */}
          <div className="ml-16 space-y-3">
            {entry.evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">
                        {getEvaluationLevelIcon(evaluation.evaluation_level)}
                      </span>
                      <h4 className="font-semibold text-gray-900">
                        {evaluation.training?.training_name || 'トレーニング'}
                      </h4>
                    </div>
                    {evaluation.comment && (
                      <p className="text-sm text-gray-600 mt-2 ml-9">
                        💬 {evaluation.comment}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getEvaluationLevelColor(
                      evaluation.evaluation_level
                    )}`}
                  >
                    レベル{evaluation.evaluation_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
