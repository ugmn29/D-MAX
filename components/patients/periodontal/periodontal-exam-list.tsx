'use client'

import { PeriodontalExam } from '@/lib/api/periodontal-exams'
import { Button } from '@/components/ui/button'
import { Calendar, Eye, Edit, Trash2 } from 'lucide-react'
import { useMemo } from 'react'

interface PeriodontalExamListProps {
  exams: PeriodontalExam[]
  onView: (examId: string) => void
  onEdit: (examId: string) => void
  onDelete: (examId: string) => void
}

// 統計値を計算する関数
function calculateStats(exam: PeriodontalExam) {
  const toothData = exam.tooth_data || []

  // 有効な歯の数（欠損歯を除く）
  const validTeeth = toothData.filter(t => !t.is_missing)
  const totalTeeth = validTeeth.length

  if (totalTeeth === 0) {
    return {
      pcrRate: '0.0',
      bopRate: '0.0',
      deepPocketRate: '0.0',
    }
  }

  // PCR率: 1つでもプラークがある歯の割合
  const teethWithPlaque = validTeeth.filter(t =>
    t.plaque_top || t.plaque_right || t.plaque_bottom || t.plaque_left
  ).length
  const pcrRate = ((teethWithPlaque / totalTeeth) * 100).toFixed(1)

  // BOP率: 出血がある部位の割合
  const totalPoints = totalTeeth * 6
  const bopPoints = validTeeth.reduce((sum, t) => {
    let count = 0
    if (t.bop_mb) count++
    if (t.bop_b) count++
    if (t.bop_db) count++
    if (t.bop_ml) count++
    if (t.bop_l) count++
    if (t.bop_dl) count++
    return sum + count
  }, 0)
  const bopRate = totalPoints > 0 ? ((bopPoints / totalPoints) * 100).toFixed(1) : '0.0'

  // PPD≧4mm率
  const deepPocketPoints = validTeeth.reduce((sum, t) => {
    let count = 0
    if (t.ppd_mb && t.ppd_mb >= 4) count++
    if (t.ppd_b && t.ppd_b >= 4) count++
    if (t.ppd_db && t.ppd_db >= 4) count++
    if (t.ppd_ml && t.ppd_ml >= 4) count++
    if (t.ppd_l && t.ppd_l >= 4) count++
    if (t.ppd_dl && t.ppd_dl >= 4) count++
    return sum + count
  }, 0)
  const deepPocketRate = totalPoints > 0 ? ((deepPocketPoints / totalPoints) * 100).toFixed(1) : '0.0'

  return {
    pcrRate,
    bopRate,
    deepPocketRate,
  }
}

// 測定方式のラベル
function getMeasurementTypeLabel(type: string): string {
  switch (type) {
    case '6point':
      return '6点法'
    case '4point':
      return '4点法'
    case '1point':
      return '1点法'
    default:
      return type
  }
}

export function PeriodontalExamList({
  exams,
  onView,
  onEdit,
  onDelete,
}: PeriodontalExamListProps) {
  if (exams.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Activity className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-2">検査履歴がありません</p>
        <p className="text-gray-400 text-sm">
          右上の「新規作成」ボタンから最初の検査を作成してください
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => {
        const stats = calculateStats(exam)
        const examDate = new Date(exam.examination_date).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        return (
          <div
            key={exam.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* 検査日 */}
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-medium text-gray-900">{examDate}</span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {getMeasurementTypeLabel(exam.measurement_type)}
                  </span>
                </div>

                {/* 統計値 */}
                <div className="flex items-center space-x-4 text-sm">
                  <div>
                    <span className="text-gray-600">PCR:</span>
                    <span className="ml-1 font-medium text-gray-900">{stats.pcrRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">BOP:</span>
                    <span className="ml-1 font-medium text-gray-900">{stats.bopRate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">PPD≧4mm:</span>
                    <span className="ml-1 font-medium text-gray-900">{stats.deepPocketRate}%</span>
                  </div>
                </div>

                {/* メモ */}
                {exam.notes && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{exam.notes}</p>
                )}
              </div>

              {/* アクションボタン */}
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(exam.id)}
                  className="flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>詳細</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(exam.id)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>編集</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(exam.id)}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Activity アイコンのインポート
function Activity({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  )
}
