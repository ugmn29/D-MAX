'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft } from 'lucide-react'
import { getClinicSettings, setClinicSetting, updateClinicSettings } from '@/lib/api/clinic'
import { useClinicId } from '@/hooks/use-clinic-id'

const TIME_SLOT_OPTIONS = [
  { value: 10, label: '10分' },
  { value: 15, label: '15分' },
  { value: 20, label: '20分' },
  { value: 30, label: '30分' },
  { value: 60, label: '60分' }
]

const DISPLAY_ITEMS = [
  { id: 'reservation_time', name: '予約時間', description: '予約の開始・終了時間を表示' },
  { id: 'medical_card_number', name: '診察券番号', description: '患者の診察券番号を表示' },
  { id: 'name', name: '名前', description: '患者の氏名を表示' },
  { id: 'furigana', name: 'フリガナ', description: '患者のフリガナを表示' },
  { id: 'age', name: '年齢(月齢)', description: '患者の年齢または月齢を表示' },
  { id: 'patient_icon', name: '患者アイコン', description: '患者の特記事項アイコンを表示' },
  { id: 'patient_rank', name: '患者ランク', description: '患者のランクを表示' },
  { id: 'patient_color', name: '患者カラー', description: '患者のカラーを表示' },
  { id: 'treatment_content', name: '診療内容', description: '診療メニューの全階層を表示（大分類/中分類/詳細）' },
  { id: 'staff', name: '担当者', description: '担当者の全階層を表示（主担当者/副担当者1/副担当者2）' }
]

// キャンセル理由は動的に取得するため、固定配列を削除

export default function CalendarSettingsPage() {
  const clinicId = useClinicId()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // 基本設定
  const [timeSlotMinutes, setTimeSlotMinutes] = useState(15)
  const [displayItems, setDisplayItems] = useState<string[]>([])
  const [cellHeight, setCellHeight] = useState(40)

  // キャンセル設定（未使用だが保存処理で参照されているため定義）
  const cancelTypes: any[] = []
  const penaltySettings: any = {}
  

  // 設定変更を監視して即座にメインページに通知
  useEffect(() => {
    if (!isInitialLoad && timeSlotMinutes !== undefined) {
      const numericTimeSlotMinutes = Number(timeSlotMinutes)

      const updateData = {
        timestamp: Date.now(),
        timeSlotMinutes: numericTimeSlotMinutes,
        displayItems,
        cellHeight
      }
      window.localStorage.setItem('clinic_settings_updated', JSON.stringify(updateData))

      const customEvent = new CustomEvent('clinicSettingsUpdated', {
        detail: { timeSlotMinutes: numericTimeSlotMinutes, displayItems, cellHeight }
      })
      window.dispatchEvent(customEvent)

      window.postMessage({
        type: 'clinicSettingsUpdated',
        data: { timeSlotMinutes: numericTimeSlotMinutes, displayItems, cellHeight }
      }, window.location.origin)
    }
  }, [timeSlotMinutes, displayItems, cellHeight, isInitialLoad])

  // 手動保存関数
  const handleManualSave = useCallback(async () => {
    try {
      setSaving(true)
      
      // updateClinicSettingsを使用して一括保存
      const result = await updateClinicSettings(clinicId, {
        timeSlotMinutes,
        displayItems,
        cellHeight,
        cancelTypes,
        penaltySettings
      })
      alert('設定を保存しました')
    } catch (error) {
      console.error('手動保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }, [timeSlotMinutes, displayItems, cellHeight, cancelTypes, penaltySettings])

  // 自動保存関数（API保存のみ。通知は即時useEffectが担当）
  const autoSave = useCallback(async () => {
    if (isInitialLoad) return // 初期読み込み時は保存しない

    try {
      setSaving(true)

      // updateClinicSettingsを使用して一括保存
      await updateClinicSettings(clinicId, {
        timeSlotMinutes,
        displayItems,
        cellHeight,
        cancelTypes,
        penaltySettings
      })
    } catch (error) {
      console.error('自動保存エラー:', error)
    } finally {
      setSaving(false)
    }
  }, [isInitialLoad, timeSlotMinutes, displayItems, cellHeight, cancelTypes, penaltySettings])

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const settings = await getClinicSettings(clinicId)

        const numericTimeSlotValue = Number(settings.time_slot_minutes || 15)
        setTimeSlotMinutes(numericTimeSlotValue)

        const loadedDisplayItems = Array.isArray(settings.display_items) ? settings.display_items : []
        setDisplayItems(loadedDisplayItems)

        setCellHeight(settings.cell_height || 40)

        // 初期読み込み完了
        setIsInitialLoad(false)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 設定値変更時の自動保存
  useEffect(() => {
    if (isInitialLoad) return // 初期読み込み時は保存しない

    // デバウンス処理（500ms後に保存）
    const timeoutId = setTimeout(() => {
      autoSave()
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [timeSlotMinutes, displayItems, cellHeight, cancelTypes, penaltySettings, isInitialLoad, autoSave])


  // 表示項目の変更
  const handleDisplayItemChange = (itemId: string, checked: boolean) => {
    if (checked) {
      setDisplayItems(prev => [...prev, itemId])
    } else {
      setDisplayItems(prev => prev.filter(id => id !== itemId))
    }
  }



  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shikabot-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-screen">
        {/* 左サイドバー */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">カレンダー設定</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">カレンダー表示設定</div>
                <div className="text-sm text-blue-600">カレンダーの表示形式とレイアウトの設定</div>
              </div>
            </nav>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">カレンダー表示設定</h2>
                <p className="text-gray-600">カレンダーの表示形式とレイアウトを設定します（変更は自動保存されます）</p>
              </div>
              <div className="flex items-center space-x-2">
                {saving && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    保存中...
                  </div>
                )}
                {!saving && !isInitialLoad && (
                  <div className="text-sm text-green-600">
                    ✓ 保存済み
                  </div>
                )}
                <Button
                  onClick={handleManualSave}
                  size="sm"
                  disabled={saving}
                >
                  手動保存
                </Button>
              </div>
            </div>

            {/* タブ */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'basic'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                基本設定
              </button>
            </div>

            {/* 基本設定タブ */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* 1コマの時間 */}
                <Card>
                  <CardHeader>
                    <CardTitle>1コマの時間</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-xs">
                      <Select
                        value={timeSlotMinutes.toString()}
                        onValueChange={(value) => setTimeSlotMinutes(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOT_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>


                {/* 表示項目 */}
                <Card>
                  <CardHeader>
                    <CardTitle>表示項目</CardTitle>
                    <p className="text-sm text-gray-600">カレンダーの予約ブロックに表示する項目を選択してください</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {DISPLAY_ITEMS.map(item => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={item.id}
                            checked={displayItems.includes(item.id)}
                            onCheckedChange={(checked) => 
                              handleDisplayItemChange(item.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor={item.id} className="font-medium">
                              {item.name}
                            </Label>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* セル表示設定 */}
                <Card>
                  <CardHeader>
                    <CardTitle>セル表示設定</CardTitle>
                    <p className="text-sm text-gray-600">カレンダーのセル（予約ブロック）の基本高さを調整します</p>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-md">
                      <Label>セルの高さ: {cellHeight}px</Label>
                      <Slider
                        value={[cellHeight]}
                        onValueChange={(value) => setCellHeight(value[0])}
                        min={20}
                        max={80}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>
    </MainLayout>
  )
}
