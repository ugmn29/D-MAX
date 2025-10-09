'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Training } from '@/types/training'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface CustomCriteria {
  training_id: string
  evaluation_level_1_label: string
  evaluation_level_1_criteria: string
  evaluation_level_2_label: string
  evaluation_level_2_criteria: string
  evaluation_level_3_label: string
  evaluation_level_3_criteria: string
}

export default function EvaluationCriteriaPage() {
  const router = useRouter()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [customizations, setCustomizations] = useState<Map<string, CustomCriteria>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // トレーニング一覧を取得
      const { data: trainingsData, error: trainingsError } = await supabase
        .from('trainings')
        .select('*')
        .eq('is_deleted', false)
        .order('category', { ascending: true })

      if (trainingsError) throw trainingsError
      setTrainings(trainingsData || [])

      // カスタマイズ済みの評価基準を取得
      const { data: customData, error: customError } = await supabase
        .from('clinic_training_customizations')
        .select('*')
        .eq('clinic_id', DEMO_CLINIC_ID)

      if (customError) throw customError

      const customMap = new Map<string, CustomCriteria>()
      customData?.forEach((c: any) => {
        customMap.set(c.training_id, {
          training_id: c.training_id,
          evaluation_level_1_label: c.evaluation_level_1_label || '',
          evaluation_level_1_criteria: c.evaluation_level_1_criteria || '',
          evaluation_level_2_label: c.evaluation_level_2_label || '',
          evaluation_level_2_criteria: c.evaluation_level_2_criteria || '',
          evaluation_level_3_label: c.evaluation_level_3_label || '',
          evaluation_level_3_criteria: c.evaluation_level_3_criteria || '',
        })
      })
      setCustomizations(customMap)
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDisplayCriteria = (training: Training) => {
    const custom = customizations.get(training.id)
    if (custom) return custom

    return {
      training_id: training.id,
      evaluation_level_1_label: training.evaluation_level_1_label || 'できなかった',
      evaluation_level_1_criteria: training.evaluation_level_1_criteria || '',
      evaluation_level_2_label: training.evaluation_level_2_label || 'まあまあできた',
      evaluation_level_2_criteria: training.evaluation_level_2_criteria || '',
      evaluation_level_3_label: training.evaluation_level_3_label || 'できた',
      evaluation_level_3_criteria: training.evaluation_level_3_criteria || '',
    }
  }

  const handleEdit = (trainingId: string) => {
    setEditingTrainingId(trainingId)
  }

  const handleSave = async (training: Training) => {
    const criteria = getDisplayCriteria(training)
    setIsSaving(true)

    try {
      // カスタマイズデータを保存（upsert）
      const { error } = await supabase
        .from('clinic_training_customizations')
        .upsert({
          clinic_id: DEMO_CLINIC_ID,
          training_id: training.id,
          evaluation_level_1_label: criteria.evaluation_level_1_label,
          evaluation_level_1_criteria: criteria.evaluation_level_1_criteria,
          evaluation_level_2_label: criteria.evaluation_level_2_label,
          evaluation_level_2_criteria: criteria.evaluation_level_2_criteria,
          evaluation_level_3_label: criteria.evaluation_level_3_label,
          evaluation_level_3_criteria: criteria.evaluation_level_3_criteria,
        })

      if (error) throw error

      setEditingTrainingId(null)
      alert('評価基準を保存しました')
      loadData()
    } catch (error: any) {
      console.error('保存エラー:', error)
      alert(error.message || '保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async (trainingId: string) => {
    if (!confirm('このトレーニングの評価基準をデフォルトに戻しますか？')) return

    setIsSaving(true)

    try {
      // カスタマイズデータを削除
      const { error } = await supabase
        .from('clinic_training_customizations')
        .delete()
        .eq('clinic_id', DEMO_CLINIC_ID)
        .eq('training_id', trainingId)

      if (error) throw error

      alert('評価基準をデフォルトに戻しました')
      loadData()
    } catch (error: any) {
      console.error('リセットエラー:', error)
      alert(error.message || 'リセットに失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCriteriaChange = (
    trainingId: string,
    field: keyof CustomCriteria,
    value: string
  ) => {
    const updated = new Map(customizations)
    const current = updated.get(trainingId) || getDisplayCriteria(
      trainings.find((t) => t.id === trainingId)!
    )
    updated.set(trainingId, { ...current, [field]: value })
    setCustomizations(updated)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <button
            onClick={() => router.push('/training/clinic/patients')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-900">評価基準のカスタマイズ</h1>
          <p className="text-sm text-gray-500 mt-1">
            各トレーニングの評価基準を医院独自の基準にカスタマイズできます
          </p>
        </div>
      </header>

      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            💡 <strong>カスタマイズのヒント:</strong>
            デフォルト基準は全医院共通です。医院独自の基準を設定する場合は「編集」ボタンをクリックしてください。
            カスタマイズした基準は「デフォルトに戻す」でリセットできます。
          </p>
        </div>

        <div className="space-y-6">
          {trainings.map((training) => {
            const criteria = getDisplayCriteria(training)
            const isEditing = editingTrainingId === training.id
            const isCustomized = customizations.has(training.id)

            return (
              <div
                key={training.id}
                className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
                  isCustomized ? 'border-blue-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {training.training_name}
                      </h3>
                      {isCustomized && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          カスタマイズ済み
                        </span>
                      )}
                    </div>
                    {training.category && (
                      <p className="text-sm text-gray-500">
                        カテゴリ: {training.category}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => handleEdit(training.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          編集
                        </button>
                        {isCustomized && (
                          <button
                            onClick={() => handleReset(training.id)}
                            disabled={isSaving}
                            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
                          >
                            デフォルトに戻す
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSave(training)}
                          disabled={isSaving}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {isSaving ? '保存中...' : '保存'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingTrainingId(null)
                            loadData()
                          }}
                          disabled={isSaving}
                          className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 disabled:opacity-50"
                        >
                          キャンセル
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* レベル1 */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <label className="block text-sm font-semibold text-red-900 mb-2">
                      ❌ レベル1
                    </label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          ラベル
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={criteria.evaluation_level_1_label}
                            onChange={(e) =>
                              handleCriteriaChange(
                                training.id,
                                'evaluation_level_1_label',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="例: できなかった"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {criteria.evaluation_level_1_label}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          詳細基準
                        </label>
                        {isEditing ? (
                          <textarea
                            value={criteria.evaluation_level_1_criteria}
                            onChange={(e) =>
                              handleCriteriaChange(
                                training.id,
                                'evaluation_level_1_criteria',
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                            placeholder="詳細な評価基準を入力してください"
                          />
                        ) : (
                          <div className="text-sm text-gray-700">
                            {criteria.evaluation_level_1_criteria || '未設定'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* レベル2 */}
                  <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <label className="block text-sm font-semibold text-yellow-900 mb-2">
                      ⚠️ レベル2
                    </label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          ラベル
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={criteria.evaluation_level_2_label}
                            onChange={(e) =>
                              handleCriteriaChange(
                                training.id,
                                'evaluation_level_2_label',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="例: まあまあできた"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {criteria.evaluation_level_2_label}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          詳細基準
                        </label>
                        {isEditing ? (
                          <textarea
                            value={criteria.evaluation_level_2_criteria}
                            onChange={(e) =>
                              handleCriteriaChange(
                                training.id,
                                'evaluation_level_2_criteria',
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                            placeholder="詳細な評価基準を入力してください"
                          />
                        ) : (
                          <div className="text-sm text-gray-700">
                            {criteria.evaluation_level_2_criteria || '未設定'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* レベル3 */}
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <label className="block text-sm font-semibold text-green-900 mb-2">
                      ✅ レベル3
                    </label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          ラベル
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={criteria.evaluation_level_3_label}
                            onChange={(e) =>
                              handleCriteriaChange(
                                training.id,
                                'evaluation_level_3_label',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="例: できた"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">
                            {criteria.evaluation_level_3_label}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          詳細基準
                        </label>
                        {isEditing ? (
                          <textarea
                            value={criteria.evaluation_level_3_criteria}
                            onChange={(e) =>
                              handleCriteriaChange(
                                training.id,
                                'evaluation_level_3_criteria',
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                            placeholder="詳細な評価基準を入力してください"
                          />
                        ) : (
                          <div className="text-sm text-gray-700">
                            {criteria.evaluation_level_3_criteria || '未設定'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
