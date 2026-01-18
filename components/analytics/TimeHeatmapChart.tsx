'use client'

import { useMemo } from 'react'

interface TimeHeatmapChartProps {
  data: {
    by_day: { day: string; count: number; percentage: number }[]
    by_hour: { hour: string; count: number; percentage: number }[]
    matrix: Record<string, Record<string, number>>
  }
}

export default function TimeHeatmapChart({ data }: TimeHeatmapChartProps) {
  const { matrix, by_day, by_hour } = data

  const days = ['日', '月', '火', '水', '木', '金', '土']
  const hours = ['9-12時', '12-15時', '15-18時', '18-21時', 'その他']

  // 最大値を計算（色の強度用）
  const maxValue = useMemo(() => {
    let max = 0
    days.forEach(day => {
      hours.forEach(hour => {
        const value = matrix[day]?.[hour] || 0
        if (value > max) max = value
      })
    })
    return max || 1
  }, [matrix])

  // 色の強度を計算
  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-100'
    const intensity = value / maxValue
    if (intensity < 0.25) return 'bg-blue-100'
    if (intensity < 0.5) return 'bg-blue-200'
    if (intensity < 0.75) return 'bg-blue-400 text-white'
    return 'bg-blue-600 text-white'
  }

  return (
    <div className="space-y-6">
      {/* ヒートマップ */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-sm font-medium text-gray-600">曜日 / 時間帯</th>
              {hours.map(hour => (
                <th key={hour} className="p-2 text-sm font-medium text-gray-600 text-center">
                  {hour}
                </th>
              ))}
              <th className="p-2 text-sm font-medium text-gray-600 text-center">合計</th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              const dayTotal = by_day.find(d => d.day === day)?.count || 0
              return (
                <tr key={day}>
                  <td className="p-2 text-sm font-medium text-gray-700">
                    {day}曜日
                  </td>
                  {hours.map(hour => {
                    const value = matrix[day]?.[hour] || 0
                    return (
                      <td key={hour} className="p-1">
                        <div
                          className={`p-3 text-center rounded-md ${getColor(value)} transition-colors`}
                          title={`${day}曜 ${hour}: ${value}件`}
                        >
                          <span className="font-bold">{value}</span>
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-2 text-center">
                    <span className="font-bold text-blue-600">{dayTotal}</span>
                  </td>
                </tr>
              )
            })}
            {/* 時間帯合計 */}
            <tr className="border-t-2">
              <td className="p-2 text-sm font-medium text-gray-700">合計</td>
              {hours.map(hour => {
                const hourTotal = by_hour.find(h => h.hour === hour)?.count || 0
                return (
                  <td key={hour} className="p-2 text-center">
                    <span className="font-bold text-blue-600">{hourTotal}</span>
                  </td>
                )
              })}
              <td className="p-2 text-center">
                <span className="font-bold text-gray-900">
                  {by_day.reduce((sum, d) => sum + d.count, 0)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <span className="text-gray-500">少</span>
        <div className="flex gap-1">
          <div className="w-6 h-6 bg-gray-100 rounded"></div>
          <div className="w-6 h-6 bg-blue-100 rounded"></div>
          <div className="w-6 h-6 bg-blue-200 rounded"></div>
          <div className="w-6 h-6 bg-blue-400 rounded"></div>
          <div className="w-6 h-6 bg-blue-600 rounded"></div>
        </div>
        <span className="text-gray-500">多</span>
      </div>

      {/* 曜日別・時間帯別のバーチャート */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 曜日別 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">曜日別予約数</h4>
          <div className="space-y-2">
            {by_day.map(item => (
              <div key={item.day} className="flex items-center gap-2">
                <span className="w-12 text-sm text-gray-600">{item.day}曜</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="w-16 text-sm text-right">
                  <span className="font-bold">{item.count}</span>
                  <span className="text-gray-400 text-xs ml-1">({item.percentage.toFixed(0)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 時間帯別 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">時間帯別予約数</h4>
          <div className="space-y-2">
            {by_hour.map(item => (
              <div key={item.hour} className="flex items-center gap-2">
                <span className="w-16 text-sm text-gray-600">{item.hour}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="w-16 text-sm text-right">
                  <span className="font-bold">{item.count}</span>
                  <span className="text-gray-400 text-xs ml-1">({item.percentage.toFixed(0)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
