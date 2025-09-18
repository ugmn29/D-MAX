'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { MainCalendar } from '@/components/calendar/main-calendar'
import { SidebarCalendar } from '@/components/calendar/sidebar-calendar'
import { Button } from '@/components/ui/button'
import { Patient } from '@/types/database'
import { getClinicSettings } from '@/lib/api/clinic'

// 仮のクリニックID（後で認証システムから取得）
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [timeSlotMinutes, setTimeSlotMinutes] = useState(15)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [])

  // 設定を読み込み
  const loadSettings = async () => {
    try {
      const settings = await getClinicSettings(DEMO_CLINIC_ID)
      if (settings.timeSlotMinutes) {
        setTimeSlotMinutes(settings.timeSlotMinutes)
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error)
    }
  }

  if (!mounted) {
    return null
  }

  // 日付ナビゲーション
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // 患者選択ハンドラー
  const handlePatientSelect = (patient: Patient) => {
    // 患者詳細ページに遷移するか、モーダルを開くなどの処理
    console.log('患者選択:', patient)
  }

  // 日付フォーマット
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* 左側: メインカレンダー */}
      <div className="flex-1">
        {/* カレンダーヘッダー */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {formatDate(selectedDate)}
            </h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">1コマ時間:</span>
              <span className="text-sm font-medium text-gray-900">{timeSlotMinutes}分</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4 mr-2" />
              設定
            </Button>
          </div>
        </div>
        
        <MainCalendar
          clinicId={DEMO_CLINIC_ID}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* 右側: サイドバー */}
      <SidebarCalendar
        clinicId={DEMO_CLINIC_ID}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onPatientSelect={handlePatientSelect}
      />
    </div>
  )
}