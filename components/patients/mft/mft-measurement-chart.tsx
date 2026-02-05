'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { MftMeasurement } from '@/lib/api/mft-measurements'

interface MftMeasurementChartProps {
  measurements: MftMeasurement[]
}

type ChartType = 'growth' | 'oral_function'

export function MftMeasurementChart({ measurements }: MftMeasurementChartProps) {
  const [chartType, setChartType] = useState<ChartType>('growth')

  if (measurements.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>グラフ表示には2件以上の測定記録が必要です</p>
      </div>
    )
  }

  // データを日付昇順に並び替え
  const sortedData = [...measurements]
    .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime())
    .map((m) => ({
      date: formatDate(m.measurement_date),
      height: m.height,
      weight: m.weight,
      bmi: m.bmi,
      lip_seal_strength: m.lip_seal_strength,
      tongue_pressure: m.tongue_pressure,
      max_mouth_opening: m.max_mouth_opening,
    }))

  return (
    <div className="space-y-4">
      {/* タブ切り替え */}
      <div className="flex gap-2">
        <Button
          variant={chartType === 'growth' ? 'default' : 'outline'}
          onClick={() => setChartType('growth')}
          size="sm"
        >
          身体計測
        </Button>
        <Button
          variant={chartType === 'oral_function' ? 'default' : 'outline'}
          onClick={() => setChartType('oral_function')}
          size="sm"
        >
          口腔機能
        </Button>
      </div>

      {/* グラフ */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        {chartType === 'growth' ? (
          <div className="space-y-6">
            {/* 身長・体重 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">身長・体重</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={sortedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="height"
                    stroke="#3b82f6"
                    name="身長 (cm)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="weight"
                    stroke="#10b981"
                    name="体重 (kg)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* BMI */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">BMI</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sortedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bmi"
                    stroke="#f59e0b"
                    name="BMI"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 口輪筋力 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">口輪筋力</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sortedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="lip_seal_strength"
                    stroke="#ef4444"
                    name="口輪筋力 (g)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 舌圧 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">舌圧</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sortedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tongue_pressure"
                    stroke="#8b5cf6"
                    name="舌圧 (kPa)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 最大開口量 */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">最大開口量</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sortedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="max_mouth_opening"
                    stroke="#06b6d4"
                    name="最大開口量 (mm)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
