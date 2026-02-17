'use client'

import { useState, useEffect } from 'react'
import { MainCalendar } from '@/components/calendar/main-calendar'
import { SidebarCalendar } from '@/components/calendar/sidebar-calendar'
import { Patient } from '@/types/database'
import { getClinicSettings } from '@/lib/api/clinic'
import { useClinicId } from '@/hooks/use-clinic-id'

export default function DashboardPage() {
  const clinicId = useClinicId()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [timeSlotMinutes, setTimeSlotMinutes] = useState<number | undefined>(undefined)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [displayItems, setDisplayItems] = useState<string[]>([])
  const [cellHeight, setCellHeight] = useState<number>(40)
  const [displayMode, setDisplayMode] = useState<'staff' | 'units'>('staff')
  
  // コピータブ機能関連
  const [copiedAppointment, setCopiedAppointment] = useState<any>(null)
  const [isPasteMode, setIsPasteMode] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [])

  // 設定を読み込み
  const loadSettings = async () => {
    try {
      console.log('ダッシュボード: 設定読み込み開始')
      const settings = await getClinicSettings(clinicId)
      console.log('ダッシュボード: 取得した設定:', settings)

      // 数値に変換、設定がない場合はデフォルト値15
      const numericTimeSlotMinutes = settings.time_slot_minutes ? Number(settings.time_slot_minutes) : 15
      console.log('ダッシュボード: 最終的な時間設定値:', numericTimeSlotMinutes)

      setTimeSlotMinutes(numericTimeSlotMinutes)
      setDisplayItems(Array.isArray(settings.display_items) ? settings.display_items : [])
      setCellHeight(settings.cell_height || 40)
      setSettingsLoaded(true)

      console.log('ダッシュボード: 設定読み込み完了')
    } catch (error) {
      console.error('設定読み込みエラー:', error)
      // エラー時もデフォルト値で初期化
      setTimeSlotMinutes(15)
      setDisplayItems([])
      setCellHeight(40)
      setSettingsLoaded(true)
    }
  }

  if (!mounted || !settingsLoaded) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 患者選択ハンドラー
  const handlePatientSelect = (patient: Patient) => {
    console.log('患者選択:', patient)
  }

  // 日付クリック時の貼り付け処理
  const handlePasteToDate = (date: Date) => {
    if (copiedAppointment) {
      console.log('日付に移動:', date, copiedAppointment)
      setSelectedDate(date)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* 左側: メインカレンダー */}
      <div className="flex-1">
        <MainCalendar
          clinicId={clinicId}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          timeSlotMinutes={timeSlotMinutes ?? 15}
          displayItems={displayItems}
          cellHeight={cellHeight}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          onCopyStateChange={(copied, pasteMode) => {
            setCopiedAppointment(copied)
            setIsPasteMode(pasteMode)
          }}
        />
      </div>

      {/* 右側: サイドバー */}
      <SidebarCalendar
        clinicId={clinicId}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onPatientSelect={handlePatientSelect}
        isPasteMode={isPasteMode}
        onPasteToDate={handlePasteToDate}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      />
    </div>
  )
}
