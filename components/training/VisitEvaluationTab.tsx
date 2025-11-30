'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface LipClosureTest {
  id: string
  patient_id: string
  clinic_id: string
  test_date: string
  measurement_value: number
  notes: string | null
  examiner_id: string | null
  created_at: string
}

interface VisitEvaluationTabProps {
  patientId: string
  patientName: string
}

export default function VisitEvaluationTab({ patientId, patientName }: VisitEvaluationTabProps) {
  const [tests, setTests] = useState<LipClosureTest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [measurementValue, setMeasurementValue] = useState<string>('')

  useEffect(() => {
    loadTests()
  }, [patientId])

  const loadTests = async () => {
    try {
      const { data, error } = await supabase
        .from('lip_closure_tests')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', DEMO_CLINIC_ID)
        .order('test_date', { ascending: false })

      if (error) {
        console.error('口唇閉鎖検査記録取得エラー:', error)
      } else {
        setTests(data || [])
      }
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!measurementValue || measurementValue.trim() === '') {
      alert('測定値を入力してください')
      return
    }

    const value = parseFloat(measurementValue)
    if (isNaN(value)) {
      alert('有効な数値を入力してください')
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('lip_closure_tests')
        .insert({
          patient_id: patientId,
          clinic_id: DEMO_CLINIC_ID,
          test_date: new Date().toISOString(),
          measurement_value: value,
          notes: null,
          examiner_id: null, // TODO: 実際のスタッフIDを設定
        })

      if (error) {
        console.error('保存エラー:', error)
        alert('保存に失敗しました')
      } else {
        alert('検査記録を保存しました')
        setMeasurementValue('')
        loadTests()
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert('エラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (testId: string) => {
    if (!confirm('この検査記録を削除しますか?')) return

    try {
      const { error } = await supabase
        .from('lip_closure_tests')
        .delete()
        .eq('id', testId)

      if (error) {
        console.error('削除エラー:', error)
        alert('削除に失敗しました')
      } else {
        alert('検査記録を削除しました')
        loadTests()
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('エラーが発生しました')
    }
  }

  // グラフ用のデータを準備（古い順に並べ替え）
  const chartData = [...tests]
    .reverse()
    .map((test) => ({
      date: new Date(test.test_date).toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
      }),
      value: test.measurement_value,
      fullDate: new Date(test.test_date).toLocaleDateString('ja-JP'),
    }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">口唇閉鎖検査</h2>
      </div>

      {/* 新規記録フォーム */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">新規検査記録</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              測定値 *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={measurementValue}
                onChange={(e) => setMeasurementValue(e.target.value)}
                className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: 12.5"
              />
              <span className="text-gray-600 font-medium">N</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSaving ? '保存中...' : '検査記録を保存'}
          </button>
        </div>
      </div>

      {/* グラフ */}
      {tests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">測定値の推移</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  label={{ value: '検査日', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'N', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                          <p className="text-sm font-medium text-gray-900">
                            {payload[0].payload.fullDate}
                          </p>
                          <p className="text-sm text-gray-600">
                            測定値: {payload[0].value} N
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="測定値 (N)"
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 検査記録一覧 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          検査記録一覧 ({tests.length}件)
        </h3>

        {tests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            まだ検査記録がありません
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="text-sm text-gray-500">
                        {new Date(test.test_date).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {test.measurement_value} N
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(test.id)}
                    className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
