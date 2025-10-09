'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IdentifiedIssue } from '@/types/evaluation'

interface IssueAnalysisModalProps {
  patientId: string
  clinicId: string
  analysisResult: {
    evaluations: any[]
    identified_issues: IdentifiedIssue[]
  }
  onClose: () => void
}

export default function IssueAnalysisModal({
  patientId,
  clinicId,
  analysisResult,
  onClose,
}: IssueAnalysisModalProps) {
  const router = useRouter()
  const [selectedIssues, setSelectedIssues] = useState<{
    [issue_code: string]: {
      severity: 1 | 2 | 3
      notes: string
      selected_training_ids: string[]
    }
  }>({})
  const [isSaving, setIsSaving] = useState(false)

  const handleIssueToggle = (issue_code: string) => {
    setSelectedIssues((prev) => {
      if (prev[issue_code]) {
        const { [issue_code]: _, ...rest } = prev
        return rest
      } else {
        return {
          ...prev,
          [issue_code]: {
            severity: 2, // デフォルトは中度
            notes: '',
            selected_training_ids: [],
          },
        }
      }
    })
  }

  const handleSeverityChange = (issue_code: string, severity: 1 | 2 | 3) => {
    setSelectedIssues((prev) => ({
      ...prev,
      [issue_code]: {
        ...prev[issue_code],
        severity,
      },
    }))
  }

  const handleNotesChange = (issue_code: string, notes: string) => {
    setSelectedIssues((prev) => ({
      ...prev,
      [issue_code]: {
        ...prev[issue_code],
        notes,
      },
    }))
  }

  const handleTrainingToggle = (issue_code: string, training_id: string) => {
    setSelectedIssues((prev) => {
      const current = prev[issue_code]?.selected_training_ids || []
      const updated = current.includes(training_id)
        ? current.filter((id) => id !== training_id)
        : [...current, training_id]

      return {
        ...prev,
        [issue_code]: {
          ...prev[issue_code],
          selected_training_ids: updated,
        },
      }
    })
  }

  const handleSaveAndPrescribe = async () => {
    const selectedIssueCodes = Object.keys(selectedIssues)
    if (selectedIssueCodes.length === 0) {
      alert('課題を選択してください')
      return
    }

    setIsSaving(true)

    try {
      // 課題を記録
      for (const issue_code of selectedIssueCodes) {
        const issueData = selectedIssues[issue_code]
        await fetch('/api/training/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            clinic_id: clinicId,
            issue_code,
            severity: issueData.severity,
            notes: issueData.notes || undefined,
          }),
        })
      }

      // 推奨トレーニングを処方画面へ渡す
      const allSelectedTrainings = selectedIssueCodes.flatMap(
        (code) => selectedIssues[code].selected_training_ids
      )
      const uniqueTrainingIds = Array.from(new Set(allSelectedTrainings))

      if (uniqueTrainingIds.length > 0) {
        // 推奨トレーニングIDをクエリパラメータで渡す
        router.push(
          `/training/clinic/prescribe/${patientId}?recommended=${uniqueTrainingIds.join(',')}`
        )
      } else {
        alert('課題を記録しました')
        onClose()
      }
    } catch (error) {
      console.error('課題記録エラー:', error)
      alert('エラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const { identified_issues } = analysisResult

  if (identified_issues.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            ✅ 評価を保存しました
          </h3>
          <p className="text-gray-600 mb-6">
            特に課題は検出されませんでした。すべてのトレーニングが良好に実施されています。
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            閉じる
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full my-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          ✅ 評価を保存しました
        </h3>
        <p className="text-gray-600 mb-6">
          評価結果から以下の課題が特定されました。重症度を設定し、推奨トレーニングを選択してください。
        </p>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto mb-6">
          {identified_issues.map((identified) => {
            const { issue, triggering_evaluation, recommended_trainings } = identified
            const isSelected = selectedIssues[issue.code] !== undefined

            return (
              <div
                key={issue.code}
                className={`border rounded-xl p-6 transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleIssueToggle(issue.code)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      ⚠️ {issue.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      評価結果: {triggering_evaluation.training?.training_name} -{' '}
                      レベル{triggering_evaluation.evaluation_level}
                    </p>

                    {isSelected && (
                      <>
                        {/* 重症度選択 */}
                        <div className="mt-4 mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            重症度
                          </label>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSeverityChange(issue.code, 1)}
                              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                                selectedIssues[issue.code]?.severity === 1
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                              }`}
                            >
                              軽度
                            </button>
                            <button
                              onClick={() => handleSeverityChange(issue.code, 2)}
                              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                                selectedIssues[issue.code]?.severity === 2
                                  ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-300'
                              }`}
                            >
                              中度
                            </button>
                            <button
                              onClick={() => handleSeverityChange(issue.code, 3)}
                              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                                selectedIssues[issue.code]?.severity === 3
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                              }`}
                            >
                              重度
                            </button>
                          </div>
                        </div>

                        {/* メモ */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            メモ（任意）
                          </label>
                          <textarea
                            value={selectedIssues[issue.code]?.notes || ''}
                            onChange={(e) => handleNotesChange(issue.code, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="特記事項があれば記入してください"
                          />
                        </div>

                        {/* 推奨トレーニング */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            💡 推奨トレーニング（処方するトレーニングを選択）
                          </label>
                          <div className="space-y-2">
                            {recommended_trainings.map((mapping) => {
                              const training = mapping.training
                              if (!training) return null

                              const isTrainingSelected =
                                selectedIssues[issue.code]?.selected_training_ids.includes(
                                  training.id
                                ) || false

                              return (
                                <div
                                  key={mapping.id}
                                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                    isTrainingSelected
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-300 hover:border-blue-300'
                                  }`}
                                  onClick={() =>
                                    handleTrainingToggle(issue.code, training.id)
                                  }
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isTrainingSelected}
                                      onChange={() =>
                                        handleTrainingToggle(issue.code, training.id)
                                      }
                                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                          優先度: {mapping.priority}
                                        </span>
                                        <span className="font-medium text-gray-900">
                                          {training.training_name}
                                        </span>
                                      </div>
                                      {mapping.description && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          {mapping.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            後で決める
          </button>
          <button
            onClick={handleSaveAndPrescribe}
            disabled={isSaving || Object.keys(selectedIssues).length === 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? '保存中...'
              : Object.values(selectedIssues).some(
                  (i) => i.selected_training_ids.length > 0
                )
              ? '課題を記録して推奨トレーニングを処方'
              : '課題を記録'}
          </button>
        </div>
      </div>
    </div>
  )
}
