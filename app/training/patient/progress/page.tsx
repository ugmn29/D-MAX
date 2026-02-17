'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CalendarDay {
  date: Date
  hasTraining: boolean
  isCurrentMonth: boolean
  isToday: boolean
}

export default function ProgressPage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())
  const [summary, setSummary] = useState({ thisWeek: 0, thisMonth: 0 })
  const [selectedPeriod, setSelectedPeriod] = useState('今週')
  const [trainingSummary, setTrainingSummary] = useState<any[]>([])

  useEffect(() => {
    loadProgressData()
  }, [currentMonth])

  const loadProgressData = async () => {
    const patient = JSON.parse(localStorage.getItem('patient_data') || '{}')

    try {
      // 完了記録をAPI経由で取得
      const response = await fetch(`/api/training/patient/progress?patientId=${patient.id}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('進捗データ取得エラー:', data)
        return
      }

      const records = data.records || []

      // 日付ごとに集計
      const dates = new Set<string>()
      records.forEach((record: any) => {
        const date = new Date(record.performed_at).toISOString().split('T')[0]
        dates.add(date)
      })

      setCompletedDates(dates)

      // カレンダー生成
      generateCalendar(dates)

      // サマリー計算
      calculateSummary(records)

      // トレーニング別サマリー
      calculateTrainingSummary(records)
    } catch (error) {
      console.error('進捗データ取得エラー:', error)
    }
  }

  const generateCalendar = (dates?: Set<string>) => {
    const activeDates = dates || completedDates
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 日曜日から開始

    const days: CalendarDay[] = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      // 6週分
      const dateStr = currentDate.toISOString().split('T')[0]
      days.push({
        date: new Date(currentDate),
        hasTraining: activeDates.has(dateStr),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday:
          currentDate.toISOString().split('T')[0] ===
          new Date().toISOString().split('T')[0]
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    setCalendarDays(days)
  }

  const calculateSummary = (records: any[]) => {
    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const thisWeek = records.filter(
      (r: any) => new Date(r.performed_at) >= thisWeekStart
    ).length

    const thisMonth = records.filter(
      (r: any) => new Date(r.performed_at) >= thisMonthStart
    ).length

    setSummary({ thisWeek, thisMonth })
  }

  const calculateTrainingSummary = (records: any[]) => {
    const now = new Date()
    let startDate: Date

    if (selectedPeriod === '今週') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay())
    } else if (selectedPeriod === '今月') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
    }

    const filteredRecords = records.filter(
      (r: any) => new Date(r.performed_at) >= startDate
    )

    // トレーニング別に集計
    const summary: { [key: string]: { name: string; count: number } } = {}

    filteredRecords.forEach((record: any) => {
      const id = record.training_id
      const name = record.training_name || '不明'

      if (!summary[id]) {
        summary[id] = { name, count: 0 }
      }
      summary[id].count++
    })

    // 完了回数順にソート
    const sorted = Object.values(summary).sort((a, b) => b.count - a.count)
    setTrainingSummary(sorted)
  }

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const nextMonth = () => {
    const next = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    )
    if (next <= new Date()) {
      setCurrentMonth(next)
    }
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">進捗</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* サマリー */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">今週</p>
            <p className="text-3xl font-bold text-blue-600">
              {summary.thisWeek}
            </p>
            <p className="text-xs text-gray-500">回完了</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">今月</p>
            <p className="text-3xl font-bold text-green-600">
              {summary.thisMonth}
            </p>
            <p className="text-xs text-gray-500">回完了</p>
          </div>
        </div>

        {/* カレンダー */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          {/* 月選択 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
              disabled={
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear()
              }
            >
              →
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-medium ${
                  index === 0
                    ? 'text-red-500'
                    : index === 6
                    ? 'text-blue-500'
                    : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダー日付 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm relative ${
                  !day.isCurrentMonth
                    ? 'text-gray-300'
                    : day.isToday
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-gray-700'
                }`}
              >
                {day.date.getDate()}
                {day.hasTraining && day.isCurrentMonth && (
                  <div className="absolute bottom-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 凡例 */}
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>トレーニング実施日</span>
            </div>
          </div>
        </div>

        {/* トレーニング別サマリー */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              トレーニング別サマリー
            </h3>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value)
                loadProgressData()
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1"
            >
              <option>今週</option>
              <option>今月</option>
              <option>過去30日</option>
            </select>
          </div>

          {trainingSummary.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              この期間のデータはありません
            </p>
          ) : (
            <div className="space-y-3">
              {trainingSummary.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {item.count}回
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-around">
          <button
            onClick={() => router.push('/training/patient/home')}
            className="flex flex-col items-center text-gray-600 hover:text-gray-900"
          >
            <span className="text-2xl mb-1">🏠</span>
            <span className="text-xs">ホーム</span>
          </button>
          <button className="flex flex-col items-center text-blue-600">
            <span className="text-2xl mb-1">📅</span>
            <span className="text-xs">進捗</span>
          </button>
          <button
            onClick={() => router.push('/training/patient/settings')}
            className="flex flex-col items-center text-gray-600 hover:text-gray-900"
          >
            <span className="text-2xl mb-1">⚙️</span>
            <span className="text-xs">設定</span>
          </button>
        </div>
      </div>
    </div>
  )
}
