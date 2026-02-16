'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useClinicId } from '@/hooks/use-clinic-id'

interface TrainingRecord {
  training_id: string
  training_name: string
  total_count: number
  completed_count: number
  interrupted_count: number
  last_performed_at: string
}

interface TrainingProgressChartProps {
  patientId: string
}

export default function TrainingProgressChart({ patientId }: TrainingProgressChartProps) {
  const clinicId = useClinicId()
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalStats, setTotalStats] = useState({
    total: 0,
    completed: 0,
    interrupted: 0,
  })

  useEffect(() => {
    loadTrainingRecords()
  }, [patientId])

  const loadTrainingRecords = async () => {
    try {
      // 患者のトレーニング実施記録をAPI経由で取得
      const response = await fetch(`/api/training/training-records?patient_id=${patientId}&clinic_id=${clinicId}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('トレーニング記録取得エラー:', result.error)
        setIsLoading(false)
        return
      }

      const data = result.data || []

      // トレーニングごとに集計
      const recordMap = new Map<string, TrainingRecord>()
      let totalCount = 0
      let completedCount = 0
      let interruptedCount = 0

      data.forEach((record: any) => {
        const trainingId = record.training_id
        const trainingName = record.training_name

        if (!recordMap.has(trainingId)) {
          recordMap.set(trainingId, {
            training_id: trainingId,
            training_name: trainingName,
            total_count: 0,
            completed_count: 0,
            interrupted_count: 0,
            last_performed_at: record.performed_at,
          })
        }

        const existing = recordMap.get(trainingId)!
        existing.total_count++
        if (record.completed) existing.completed_count++
        if (record.interrupted) existing.interrupted_count++

        // 最新の実施日時を保持
        if (new Date(record.performed_at) > new Date(existing.last_performed_at)) {
          existing.last_performed_at = record.performed_at
        }

        totalCount++
        if (record.completed) completedCount++
        if (record.interrupted) interruptedCount++
      })

      const recordsArray = Array.from(recordMap.values()).sort((a, b) =>
        b.total_count - a.total_count
      )

      setRecords(recordsArray)
      setTotalStats({
        total: totalCount,
        completed: completedCount,
        interrupted: interruptedCount,
      })
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-2">トレーニング実施記録がありません</p>
        <p className="text-sm text-gray-500">
          患者さんがトレーニングを実施すると、ここに記録が表示されます
        </p>
      </div>
    )
  }

  // グラフ用データ
  const chartData = records.map(record => ({
    name: record.training_name.length > 12
      ? record.training_name.substring(0, 12) + '...'
      : record.training_name,
    fullName: record.training_name,
    完了: record.completed_count,
    中断: record.interrupted_count,
  }))

  const completionRate = totalStats.total > 0
    ? Math.round((totalStats.completed / totalStats.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* 全体サマリー */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">全体の実施状況</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{totalStats.total}</div>
            <div className="text-sm text-gray-600 mt-1">総実施回数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{totalStats.completed}</div>
            <div className="text-sm text-gray-600 mt-1">完了</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{totalStats.interrupted}</div>
            <div className="text-sm text-gray-600 mt-1">中断</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-700">{completionRate}%</div>
            <div className="text-sm text-gray-600 mt-1">完了率</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* トレーニング別実施回数グラフ */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">トレーニング別実施回数</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis label={{ value: '実施回数', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {payload[0].payload.fullName}
                        </p>
                        <p className="text-sm text-green-600">
                          完了: {payload[0].value}回
                        </p>
                        <p className="text-sm text-orange-600">
                          中断: {payload[1].value}回
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              <Bar dataKey="完了" fill="#10b981" />
              <Bar dataKey="中断" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* トレーニング詳細一覧 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          トレーニング詳細 ({records.length}種類)
        </h3>
        <div className="space-y-3">
          {records.map((record) => {
            const rate = record.total_count > 0
              ? Math.round((record.completed_count / record.total_count) * 100)
              : 0

            return (
              <div
                key={record.training_id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{record.training_name}</h4>
                  <span className="text-sm text-gray-500">
                    最終実施: {new Date(record.last_performed_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{record.total_count}</div>
                    <div className="text-xs text-gray-600">総回数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{record.completed_count}</div>
                    <div className="text-xs text-gray-600">完了</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">{record.interrupted_count}</div>
                    <div className="text-xs text-gray-600">中断</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-700">{rate}%</div>
                    <div className="text-xs text-gray-600">完了率</div>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
