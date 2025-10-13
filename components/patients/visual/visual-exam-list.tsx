'use client'

import { Button } from '@/components/ui/button'
import { Calendar, Eye, Edit2, Trash2 } from 'lucide-react'
import type { VisualExamination } from '@/lib/api/visual-exams'

interface VisualExamListProps {
  exams: VisualExamination[]
  onView: (examId: string) => void
  onEdit: (examId: string) => void
  onDelete: (examId: string) => void
}

export function VisualExamList({ exams, onView, onEdit, onDelete }: VisualExamListProps) {
  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Calendar className="w-16 h-16 mx-auto" />
        </div>
        <p className="text-gray-600 text-lg">視診検査の履歴がありません</p>
        <p className="text-gray-500 text-sm mt-2">「新規作成」ボタンから検査を記録してください</p>
      </div>
    )
  }

  // サマリー情報を計算
  const getSummary = (exam: VisualExamination) => {
    const toothData = exam.tooth_data || []

    const cariesCount = toothData.filter(t => t.status === 'caries').length
    const restorationCount = toothData.filter(t => t.status === 'restoration').length
    const missingCount = toothData.filter(t => t.status === 'missing').length
    const healthyCount = toothData.filter(t => t.status === 'healthy').length

    const parts: string[] = []
    if (healthyCount > 0) parts.push(`健全: ${healthyCount}本`)
    if (cariesCount > 0) parts.push(`う蝕: ${cariesCount}本`)
    if (restorationCount > 0) parts.push(`処置済: ${restorationCount}本`)
    if (missingCount > 0) parts.push(`欠損: ${missingCount}本`)

    return parts.join(' / ') || '記録なし'
  }

  return (
    <div className="space-y-4">
      {exams.map(exam => (
        <div
          key={exam.id}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* 日付 */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {new Date(exam.examination_date).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {/* サマリー */}
              <p className="text-gray-700 text-sm mb-3">{getSummary(exam)}</p>

              {/* メモ */}
              {exam.notes && (
                <p className="text-gray-600 text-sm mt-2 pl-6 border-l-2 border-gray-200">{exam.notes}</p>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(exam.id)}
                className="flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                <span>詳細</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(exam.id)}
                className="flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                <span>編集</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('この検査記録を削除してもよろしいですか？')) {
                    onDelete(exam.id)
                  }
                }}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>削除</span>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
