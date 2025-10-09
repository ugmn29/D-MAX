'use client'

import { useState, useEffect } from 'react'
import { PatientIssueRecord } from '@/types/evaluation'

interface PatientIssuesTabProps {
  patientId: string
}

export default function PatientIssuesTab({ patientId }: PatientIssuesTabProps) {
  const [currentIssues, setCurrentIssues] = useState<PatientIssueRecord[]>([])
  const [resolvedIssues, setResolvedIssues] = useState<PatientIssueRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadIssues()
  }, [patientId])

  const loadIssues = async () => {
    try {
      const response = await fetch(
        `/api/training/issues?patient_id=${patientId}&include_resolved=true`
      )
      const result = await response.json()

      if (response.ok) {
        setCurrentIssues(result.data.current || [])
        setResolvedIssues(result.data.resolved || [])
      } else {
        console.error('課題取得エラー:', result.error)
      }
    } catch (error) {
      console.error('課題取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async (issueId: string) => {
    if (!confirm('この課題を解決済みにしますか？')) return

    try {
      const response = await fetch(`/api/training/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_resolved: true }),
      })

      if (response.ok) {
        loadIssues()
      } else {
        const result = await response.json()
        alert(result.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('課題解決エラー:', error)
      alert('エラーが発生しました')
    }
  }

  const handleReopen = async (issueId: string) => {
    if (!confirm('この課題を再度開きますか？')) return

    try {
      const response = await fetch(`/api/training/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_resolved: false }),
      })

      if (response.ok) {
        loadIssues()
      } else {
        const result = await response.json()
        alert(result.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('課題再開エラー:', error)
      alert('エラーが発生しました')
    }
  }

  const getSeverityColor = (severity: 1 | 2 | 3) => {
    switch (severity) {
      case 1:
        return 'bg-green-100 text-green-700'
      case 2:
        return 'bg-yellow-100 text-yellow-700'
      case 3:
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getSeverityLabel = (severity: 1 | 2 | 3) => {
    switch (severity) {
      case 1:
        return '軽度'
      case 2:
        return '中度'
      case 3:
        return '重度'
      default:
        return '不明'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 現在の課題 */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-yellow-600">⚠️</span>
          現在の課題（{currentIssues.length}件）
        </h3>

        {currentIssues.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <p className="text-green-700 font-semibold">
              ✅ 現在、特定されている課題はありません
            </p>
            <p className="text-sm text-green-600 mt-2">
              来院時評価を記録すると、課題が自動的に判定されます
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white rounded-lg p-6 border-2 border-yellow-200 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-gray-900">
                        {issue.issue?.name || '課題'}
                      </h4>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                          issue.severity
                        )}`}
                      >
                        {getSeverityLabel(issue.severity)}
                      </span>
                    </div>
                    {issue.issue?.category && (
                      <p className="text-sm text-gray-500 mb-2">
                        カテゴリ: {issue.issue.category}
                      </p>
                    )}
                    {issue.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <p className="text-sm text-gray-700">{issue.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    特定日:{' '}
                    {new Date(issue.identified_at).toLocaleDateString('ja-JP')}
                  </div>
                  <button
                    onClick={() => handleResolve(issue.id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    解決済みにする
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 解決済みの課題 */}
      {resolvedIssues.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-green-600">✅</span>
            解決済みの課題（{resolvedIssues.length}件）
          </h3>
          <div className="space-y-4">
            {resolvedIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-gray-50 rounded-lg p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-700">
                        {issue.issue?.name || '課題'}
                      </h4>
                      <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                        解決済み
                      </span>
                    </div>
                    {issue.notes && (
                      <p className="text-sm text-gray-600 mt-2">{issue.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    <div>
                      特定日:{' '}
                      {new Date(issue.identified_at).toLocaleDateString('ja-JP')}
                    </div>
                    {issue.resolved_at && (
                      <div>
                        解決日:{' '}
                        {new Date(issue.resolved_at).toLocaleDateString('ja-JP')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleReopen(issue.id)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                  >
                    再度開く
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
