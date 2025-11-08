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
  const [timeSlotMinutes, setTimeSlotMinutes] = useState<number | undefined>(undefined)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [displayItems, setDisplayItems] = useState<string[]>([])
  const [cellHeight, setCellHeight] = useState<number>(40)
  const [displayMode, setDisplayMode] = useState<'staff' | 'units' | 'both'>('staff')

  // コピータブ機能関連
  const [copiedAppointment, setCopiedAppointment] = useState<any>(null)
  const [isPasteMode, setIsPasteMode] = useState(false)

  // プライバシーモード（セッション中のみ有効、ページリロードで元に戻る）
  const [privacyMode, setPrivacyMode] = useState(false)

  // timeSlotMinutesの変更をログ出力
  useEffect(() => {
    console.log('メインページ: timeSlotMinutes変更:', timeSlotMinutes)
  }, [timeSlotMinutes])
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [])

  // ページがフォーカスされた時に設定を再読み込み
  useEffect(() => {
    const handleFocus = () => {
      console.log('メインページ: ページフォーカス - 設定を再読み込み')
      loadSettings()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // ページの可視性変更時に設定を再読み込み
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('メインページ: ページが可視になった - 設定を再読み込み')
        loadSettings()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // localStorageの変更を監視して設定を自動更新
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clinic_settings_updated' && e.newValue) {
        try {
          const updateData = JSON.parse(e.newValue)
          if (updateData.timeSlotMinutes) {
            const numericTimeSlotMinutes = Number(updateData.timeSlotMinutes)
            console.log('メインページ: localStorageから設定変更を検知:', numericTimeSlotMinutes, '現在の値:', timeSlotMinutes)
            if (numericTimeSlotMinutes !== timeSlotMinutes) {
              console.log('メインページ: timeSlotMinutesを更新:', timeSlotMinutes, '→', numericTimeSlotMinutes)
              setTimeSlotMinutes(numericTimeSlotMinutes)
            }
          }
          if (updateData.cellHeight) {
            const numericCellHeight = Number(updateData.cellHeight)
            console.log('メインページ: localStorageからcellHeight変更を検知:', numericCellHeight)
            if (numericCellHeight !== cellHeight) {
              console.log('メインページ: cellHeightを更新:', cellHeight, '→', numericCellHeight)
              setCellHeight(numericCellHeight)
            }
          }
        } catch (error) {
          console.error('設定更新データの解析エラー:', error)
        }
      }
    }

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail?.timeSlotMinutes) {
        const numericTimeSlotMinutes = Number(e.detail.timeSlotMinutes)
        console.log('メインページ: カスタムイベントから設定変更を検知:', numericTimeSlotMinutes, '現在の値:', timeSlotMinutes)
        if (numericTimeSlotMinutes !== timeSlotMinutes) {
          console.log('メインページ: timeSlotMinutesを更新:', timeSlotMinutes, '→', numericTimeSlotMinutes)
          setTimeSlotMinutes(numericTimeSlotMinutes)
        }
      }
      if (e.detail?.cellHeight) {
        const numericCellHeight = Number(e.detail.cellHeight)
        console.log('メインページ: カスタムイベントからcellHeight変更を検知:', numericCellHeight)
        if (numericCellHeight !== cellHeight) {
          console.log('メインページ: cellHeightを更新:', cellHeight, '→', numericCellHeight)
          setCellHeight(numericCellHeight)
        }
      }
    }

    const handlePostMessage = (e: MessageEvent) => {
      if (e.data?.type === 'clinicSettingsUpdated' && e.data?.data?.timeSlotMinutes) {
        const numericTimeSlotMinutes = Number(e.data.data.timeSlotMinutes)
        console.log('メインページ: postMessageから設定変更を検知:', numericTimeSlotMinutes, '現在の値:', timeSlotMinutes)
        if (numericTimeSlotMinutes !== timeSlotMinutes) {
          console.log('メインページ: timeSlotMinutesを更新:', timeSlotMinutes, '→', numericTimeSlotMinutes)
          setTimeSlotMinutes(numericTimeSlotMinutes)
        }
      }
      if (e.data?.data?.cellHeight) {
        const numericCellHeight = Number(e.data.data.cellHeight)
        console.log('メインページ: postMessageからcellHeight変更を検知:', numericCellHeight)
        if (numericCellHeight !== cellHeight) {
          console.log('メインページ: cellHeightを更新:', cellHeight, '→', numericCellHeight)
          setCellHeight(numericCellHeight)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('clinicSettingsUpdated', handleCustomEvent as EventListener)
    window.addEventListener('message', handlePostMessage)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('clinicSettingsUpdated', handleCustomEvent as EventListener)
      window.removeEventListener('message', handlePostMessage)
    }
  }, [timeSlotMinutes])

  // 設定を読み込み
  const loadSettings = async () => {
    try {
      console.log('メインページ: 設定読み込み開始')
      const settings = await getClinicSettings(DEMO_CLINIC_ID)
      console.log('メインページ: 取得した設定:', settings)
      console.log('メインページ: 取得した設定の詳細:', JSON.stringify(settings, null, 2))

      // 数値に変換、設定がない場合はデフォルト値15
      const numericTimeSlotMinutes = settings.time_slot_minutes ? Number(settings.time_slot_minutes) : 15
      console.log('メインページ: 最終的な時間設定値:', numericTimeSlotMinutes)

      // cell_heightとtimeSlotMinutesの整合性をチェックして自動調整
      let finalCellHeight = settings.cell_height || 40
      if (numericTimeSlotMinutes === 15 && finalCellHeight < 40) {
        console.warn(`メインページ: セル高さ（${finalCellHeight}px）が15分スロットに対して低すぎるため、40pxに自動調整します`)
        finalCellHeight = 40
      } else if (numericTimeSlotMinutes === 30 && finalCellHeight < 60) {
        console.warn(`メインページ: セル高さ（${finalCellHeight}px）が30分スロットに対して低すぎるため、60pxに自動調整します`)
        finalCellHeight = 60
      }

      setTimeSlotMinutes(numericTimeSlotMinutes)
      setDisplayItems(settings.display_items || [])
      setCellHeight(finalCellHeight)
      setSettingsLoaded(true)

      console.log('メインページ: 設定読み込み完了')
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

  // 日付クリック時の貼り付け処理
  const handlePasteToDate = (date: Date) => {
    if (copiedAppointment) {
      console.log('日付に移動:', date, copiedAppointment)
      // 日付を変更するだけ（予約は作成しない）
      setSelectedDate(date)
      // 貼り付けモードは継続
    }
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
        
        <MainCalendar
          clinicId={DEMO_CLINIC_ID}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          timeSlotMinutes={timeSlotMinutes ?? 15}
          displayItems={displayItems}
          cellHeight={cellHeight}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          privacyMode={privacyMode}
          onCopyStateChange={(copied, pasteMode) => {
            setCopiedAppointment(copied)
            setIsPasteMode(pasteMode)
          }}
        />
      </div>

        {/* 右側: サイドバー */}
        <SidebarCalendar
          clinicId={DEMO_CLINIC_ID}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onPatientSelect={handlePatientSelect}
          isPasteMode={isPasteMode}
          onPasteToDate={handlePasteToDate}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
          privacyMode={privacyMode}
          onPrivacyModeChange={setPrivacyMode}
        />
    </div>
  )
}