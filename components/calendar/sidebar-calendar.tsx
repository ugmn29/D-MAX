'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search, Users, Settings, BarChart3, ChevronDown, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { searchPatients } from '@/lib/api/patients'
import { getDailyMemo, saveDailyMemo } from '@/lib/api/clinic'
import { formatDateForDB } from '@/lib/utils/date'
import { Patient, DailyMemo } from '@/types/database'

interface SidebarCalendarProps {
  clinicId: string
  selectedDate: Date
  onDateChange: (date: Date) => void
  onPatientSelect?: (patient: Patient) => void
  isPasteMode?: boolean
  onPasteToDate?: (date: Date) => void
  displayMode?: 'staff' | 'units' | 'both'
  onDisplayModeChange?: (mode: 'staff' | 'units' | 'both') => void
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]

export function SidebarCalendar({ 
  clinicId, 
  selectedDate, 
  onDateChange, 
  onPatientSelect,
  isPasteMode = false,
  onPasteToDate,
  displayMode,
  onDisplayModeChange
}: SidebarCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [memo, setMemo] = useState('')
  const [memoLoading, setMemoLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)

  // 月間カレンダーの日付を生成
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()

  // メモを読み込み
  useEffect(() => {
    const loadMemo = async () => {
      try {
        const dateString = formatDateForDB(selectedDate) // 日本時間で日付を処理
        const memoData = await getDailyMemo(clinicId, dateString)
        setMemo(memoData?.memo || '')
      } catch (error) {
        console.error('メモ読み込みエラー:', error)
      }
    }

    loadMemo()
  }, [clinicId, selectedDate])

  // 患者検索
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      const results = await searchPatients(clinicId, query)
      // 診察券番号が振られている患者のみフィルタ
      const registeredResults = results.filter(patient => patient.patient_number > 0)
      setSearchResults(registeredResults)
    } catch (error) {
      console.error('患者検索エラー:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // メモ保存
  const handleMemoSave = async () => {
    try {
      setMemoLoading(true)
      const dateString = formatDateForDB(selectedDate) // 日本時間で日付を処理
      await saveDailyMemo(clinicId, dateString, memo)
    } catch (error) {
      console.error('メモ保存エラー:', error)
    } finally {
      setMemoLoading(false)
    }
  }

  // 日付選択
  const handleDateSelect = (date: Date) => {
    onDateChange(date)
  }

  // 月移動
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setCurrentMonth(newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setCurrentMonth(newMonth)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onDateChange(today)
  }

  // 月選択
  const handleMonthSelect = (year: number, month: number) => {
    const newDate = new Date(year, month, 1)
    setCurrentMonth(newDate)
    setIsMonthDropdownOpen(false)
  }

  // 年と月のオプションを生成
  const generateYearMonthOptions = () => {
    const options = []
    const currentYear = new Date().getFullYear()
    
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      for (let month = 0; month < 12; month++) {
        options.push({ year, month })
      }
    }
    return options
  }

  // 日付が今日かどうか
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // 日付が選択された日かどうか
  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  // 日付が現在の月かどうか
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  // 日付フォーマット
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short'
    })
  }

  // 日付クリック処理
  const handleDateClick = (date: Date) => {
    if (isPasteMode && onPasteToDate) {
      onPasteToDate(date)
    } else {
      onDateChange(date)
    }
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-screen">
      {/* 日付ナビゲーション */}
      <div className="px-3 py-1 border-b border-gray-200 h-11 flex items-center">
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={() => {
            const newDate = new Date(selectedDate)
            newDate.setDate(newDate.getDate() - 1)
            onDateChange(newDate)
          }}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 text-center">
            <div className="text-base font-medium text-gray-900">
              {formatDate(selectedDate)}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="xs"
              onClick={() => {
                const today = new Date()
                setCurrentMonth(today)
                onDateChange(today)
              }}
              className="bg-blue-600 text-white hover:bg-blue-700 h-4"
            >
              本日
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(newDate.getDate() + 1)
              onDateChange(newDate)
            }}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 月間カレンダー */}
      <div className="px-4 py-0.5 border-b border-gray-200">
        {/* 月ナビゲーション */}
        <div className="flex items-center justify-between">
          <button 
            onClick={goToPreviousMonth} 
            className="text-base font-medium hover:bg-gray-100 rounded px-2 py-1 transition-colors"
          >
            ≪
          </button>
          
          {/* 年月選択ドロップダウン */}
          <div className="relative">
            <button
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors"
            >
              <span>{currentMonth.getFullYear()}年 {MONTHS[currentMonth.getMonth()]}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {isMonthDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {generateYearMonthOptions().map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleMonthSelect(option.year, option.month)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                      option.year === currentMonth.getFullYear() && option.month === currentMonth.getMonth()
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-700'
                    }`}
                  >
                    {option.year}年 {MONTHS[option.month]}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={goToNextMonth} 
            className="text-base font-medium hover:bg-gray-100 rounded px-2 py-1 transition-colors"
          >
            ≫
          </button>
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-1">
          {/* 曜日ヘッダー */}
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          
          {/* 日付 */}
          {calendarDays.map((date, index) => {
            const isCurrent = isCurrentMonth(date)
            const isSelectedDate = isSelected(date)
            const isTodayDate = isToday(date)
            const dayOfWeek = date.getDay() // 0=日曜日, 6=土曜日
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  h-8 w-8 text-xs rounded-md transition-colors
                  ${isCurrent ? 'text-gray-900' : 'text-gray-400'}
                  ${isSelectedDate 
                    ? 'bg-blue-600 text-white' 
                    : isTodayDate 
                      ? 'bg-blue-100 text-blue-600' 
                      : isPasteMode && isCurrent
                        ? 'hover:bg-yellow-100 hover:border-yellow-300 border-2 border-transparent'
                        : 'hover:bg-gray-100'
                  }
                  ${!isSelectedDate && !isTodayDate && isCurrent && dayOfWeek === 0 ? 'text-red-500' : ''}
                  ${!isSelectedDate && !isTodayDate && isCurrent && dayOfWeek === 6 ? 'text-blue-500' : ''}
                `}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>

      </div>

      {/* 患者検索 */}
      <div className="px-4 py-2 border-b border-gray-200 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
            <Input
              placeholder="ID/名前で検索"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              className="pl-8 h-8 text-sm relative z-10"
            />
          </div>
          <button
            onClick={() => {
              // 患者ステータス管理ページに遷移
              window.location.href = '/patients/status'
            }}
            className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md h-8 px-3 flex items-center space-x-1 transition-colors"
          >
            <Users className="w-3 h-3 text-gray-600" />
            <span className="text-xs text-gray-700 font-medium">患者</span>
          </button>
        </div>
        
        {/* 検索結果 */}
        {searchLoading && (
          <div className="mt-2 text-center text-sm text-gray-500">
            検索中...
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {searchResults.map(patient => (
              <button
                key={patient.id}
                onClick={() => onPatientSelect?.(patient)}
                className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded-md flex items-center"
              >
                <Users className="w-4 h-4 mr-2 text-gray-400" />
                <div>
                  <div className="font-medium">
                    {patient.last_name} {patient.first_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {patient.patient_number}番
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* メモ */}
      <div className="p-4 border-b border-gray-200">
        <Textarea
          placeholder="今日のメモを入力してください..."
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onBlur={handleMemoSave}
          className="h-28 resize-none"
        />
        {memoLoading && (
          <div className="mt-2 text-xs text-gray-500">
            保存中...
          </div>
        )}
      </div>

      {/* ボタン - 右下に配置 */}
      <div className="mt-auto px-4 py-2 flex space-x-2">
        {/* 表示モード切り替えボタン */}
        {onDisplayModeChange && (
          <button
            onClick={() => {
              // スタッフ → ユニット → 両方 → スタッフ の順で循環
              if (displayMode === 'staff') {
                onDisplayModeChange('units')
              } else if (displayMode === 'units') {
                onDisplayModeChange('both')
              } else {
                onDisplayModeChange('staff')
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-8 w-8 flex items-center justify-center transition-colors"
            title={`現在: ${displayMode === 'staff' ? 'スタッフ表示' : displayMode === 'units' ? 'ユニット表示' : '両方表示'} (クリックで切り替え)`}
          >
            {displayMode === 'staff' && (
              <Users className="w-4 h-4" />
            )}
            {displayMode === 'units' && (
              <Grid3X3 className="w-4 h-4" />
            )}
            {displayMode === 'both' && (
              <div className="flex items-center">
                <Users className="w-3 h-3" />
                <Grid3X3 className="w-3 h-3 -ml-1" />
              </div>
            )}
          </button>
        )}
        
        <button
          onClick={() => {
            window.location.href = '/settings'
          }}
          className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md h-8 px-3 flex items-center justify-center space-x-2 transition-colors"
        >
          <Settings className="w-3 h-3 text-gray-600" />
          <span className="text-xs text-gray-700 font-medium">設定</span>
        </button>
        <button
          onClick={() => {
            window.location.href = '/analytics'
          }}
          className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md h-8 px-3 flex items-center justify-center space-x-2 transition-colors"
        >
          <BarChart3 className="w-3 h-3 text-gray-600" />
          <span className="text-xs text-gray-700 font-medium">分析</span>
        </button>
      </div>
    </div>
  )
}
