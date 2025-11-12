'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Training } from '@/types/training'
import { X } from 'lucide-react'

interface TrainingEvaluationModalProps {
  isOpen: boolean
  onClose: () => void
  training: Training
  patientId: string
  menuTrainingId: string
  onSuccess?: () => void
}

export default function TrainingEvaluationModal({
  isOpen,
  onClose,
  training,
  patientId,
  menuTrainingId,
  onSuccess
}: TrainingEvaluationModalProps) {
  const [evaluationLevel, setEvaluationLevel] = useState<1 | 2 | 3 | null>(null)
  const [comment, setComment] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // モーダルが開いたら状態をリセット
      setEvaluationLevel(null)
      setComment('')
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!evaluationLevel) {
      alert('評価レベルを選択してください')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from('training_evaluations').insert({
        patient_id: patientId,
        menu_training_id: menuTrainingId,
        training_id: training.id,
        evaluation_level: evaluationLevel,
        comment: comment,
        evaluated_at: new Date().toISOString(),
      })

      if (error) throw error

      alert('評価を保存しました')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('評価保存エラー:', error)
      alert('評価の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">トレーニング評価</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* トレーニング情報 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-1">{training.training_name}</h3>
            {training.description && (
              <p className="text-sm text-gray-600">{training.description}</p>
            )}
          </div>

          {/* 評価レベル選択 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              評価レベル <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  level: 1 as const,
                  label: training.evaluation_level_1_label || 'レベル1',
                  description: training.evaluation_level_1_criteria || '介助が必要',
                  color: 'bg-red-100 border-red-300 text-red-700',
                  activeColor: 'bg-red-200 border-red-500'
                },
                {
                  level: 2 as const,
                  label: training.evaluation_level_2_label || 'レベル2',
                  description: training.evaluation_level_2_criteria || '自分でできる',
                  color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
                  activeColor: 'bg-yellow-200 border-yellow-500'
                },
                {
                  level: 3 as const,
                  label: training.evaluation_level_3_label || 'レベル3',
                  description: training.evaluation_level_3_criteria || '完璧にできる',
                  color: 'bg-green-100 border-green-300 text-green-700',
                  activeColor: 'bg-green-200 border-green-500'
                },
              ].map(({ level, label, description, color, activeColor }) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEvaluationLevel(level)}
                  className={`px-4 py-6 rounded-lg border-2 font-semibold transition-all flex flex-col items-center gap-2 ${
                    evaluationLevel === level
                      ? activeColor
                      : `${color} hover:opacity-80`
                  }`}
                >
                  <span className="text-base">{label}</span>
                  <span className="text-xs font-normal">{description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* コメント */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              コメント（任意）
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="トレーニングの実施状況や気づいた点などを記入してください"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !evaluationLevel}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '評価を保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
