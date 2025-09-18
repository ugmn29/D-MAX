'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, Save } from 'lucide-react'
import { getClinicSettings, setClinicSetting } from '@/lib/api/clinic'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

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
  { id: 'treatment_content_1', name: '診療内容1', description: '診療メニューの大分類を表示' },
  { id: 'treatment_content_2', name: '診療内容2', description: '診療メニューの中分類を表示' },
  { id: 'treatment_content_3', name: '診療内容3', description: '診療メニューの詳細を表示' },
  { id: 'staff_1', name: '担当者1', description: '主担当者を表示' },
  { id: 'staff_2', name: '担当者2', description: '副担当者1を表示' },
  { id: 'staff_3', name: '担当者3', description: '副担当者2を表示' }
]

const CANCEL_TYPES = [
  { id: 'no_show', name: '無断キャンセル', description: '連絡なしでのキャンセル' },
  { id: 'advance_notice', name: '事前連絡', description: '事前に連絡があったキャンセル' },
  { id: 'same_day', name: '当日キャンセル', description: '当日のキャンセル' },
  { id: 'clinic_reason', name: '医院都合', description: '医院側の都合によるキャンセル' }
]

export default function CalendarSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  // 基本設定
  const [timeSlotMinutes, setTimeSlotMinutes] = useState(15)
  const [unitCount, setUnitCount] = useState(3)
  const [units, setUnits] = useState(['チェア1', 'チェア2', 'チェア3'])
  const [displayItems, setDisplayItems] = useState<string[]>([])
  const [cellHeight, setCellHeight] = useState(40)
  
  // キャンセル管理
  const [cancelTypes, setCancelTypes] = useState<string[]>([])
  const [penaltySettings, setPenaltySettings] = useState({
    noShowThreshold: 3,
    webReservationLimit: true,
    penaltyPeriod: 30
  })

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const settings = await getClinicSettings(DEMO_CLINIC_ID)
        
        setTimeSlotMinutes(settings.time_slot_minutes || 15)
        setUnitCount(settings.unit_count || 3)
        setUnits(settings.units || ['チェア1', 'チェア2', 'チェア3'])
        setDisplayItems(settings.display_items || [])
        setCellHeight(settings.cell_height || 40)
        setCancelTypes(settings.cancel_types || [])
        setPenaltySettings(settings.penalty_settings || {
          noShowThreshold: 3,
          webReservationLimit: true,
          penaltyPeriod: 30
        })
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // 保存処理
  const handleSave = async () => {
    try {
      setSaving(true)
      
      await setClinicSetting(DEMO_CLINIC_ID, 'time_slot_minutes', timeSlotMinutes)
      await setClinicSetting(DEMO_CLINIC_ID, 'unit_count', unitCount)
      await setClinicSetting(DEMO_CLINIC_ID, 'units', units)
      await setClinicSetting(DEMO_CLINIC_ID, 'display_items', displayItems)
      await setClinicSetting(DEMO_CLINIC_ID, 'cell_height', cellHeight)
      await setClinicSetting(DEMO_CLINIC_ID, 'cancel_types', cancelTypes)
      await setClinicSetting(DEMO_CLINIC_ID, 'penalty_settings', penaltySettings)
      
      alert('設定を保存しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 表示項目の変更
  const handleDisplayItemChange = (itemId: string, checked: boolean) => {
    if (checked) {
      setDisplayItems(prev => [...prev, itemId])
    } else {
      setDisplayItems(prev => prev.filter(id => id !== itemId))
    }
  }

  // ユニット数の変更
  const handleUnitCountChange = (count: number) => {
    setUnitCount(count)
    const newUnits = Array.from({ length: count }, (_, i) => 
      units[i] || `チェア${i + 1}`
    )
    setUnits(newUnits)
  }

  // ユニット名の変更
  const handleUnitNameChange = (index: number, name: string) => {
    const newUnits = [...units]
    newUnits[index] = name
    setUnits(newUnits)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
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
                <p className="text-gray-600">カレンダーの表示形式とレイアウトを設定します</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
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
              <button
                onClick={() => setActiveTab('cancel')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'cancel'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                キャンセル管理
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

                {/* ユニット設定 */}
                <Card>
                  <CardHeader>
                    <CardTitle>ユニット設定</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="max-w-xs">
                      <Label htmlFor="unit_count">ユニット数</Label>
                      <Input
                        id="unit_count"
                        type="number"
                        min="1"
                        max="10"
                        value={unitCount}
                        onChange={(e) => handleUnitCountChange(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      {units.map((unit, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Label className="w-20">ユニット{index + 1}:</Label>
                          <Input
                            value={unit}
                            onChange={(e) => handleUnitNameChange(index, e.target.value)}
                            placeholder={`チェア${index + 1}`}
                          />
                        </div>
                      ))}
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

            {/* キャンセル管理タブ */}
            {activeTab === 'cancel' && (
              <div className="space-y-6">
                {/* キャンセル種類 */}
                <Card>
                  <CardHeader>
                    <CardTitle>キャンセル種類</CardTitle>
                    <p className="text-sm text-gray-600">使用するキャンセル種類を選択してください</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {CANCEL_TYPES.map(type => (
                        <div key={type.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={type.id}
                            checked={cancelTypes.includes(type.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCancelTypes(prev => [...prev, type.id])
                              } else {
                                setCancelTypes(prev => prev.filter(id => id !== type.id))
                              }
                            }}
                          />
                          <div className="flex-1">
                            <Label htmlFor={type.id} className="font-medium">
                              {type.name}
                            </Label>
                            <p className="text-sm text-gray-500">{type.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ペナルティ設定 */}
                <Card>
                  <CardHeader>
                    <CardTitle>ペナルティ設定</CardTitle>
                    <p className="text-sm text-gray-600">無断キャンセルに対するペナルティを設定します</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="no_show_threshold">無断キャンセル回数閾値</Label>
                      <Input
                        id="no_show_threshold"
                        type="number"
                        min="1"
                        max="10"
                        value={penaltySettings.noShowThreshold}
                        onChange={(e) => setPenaltySettings(prev => ({
                          ...prev,
                          noShowThreshold: parseInt(e.target.value) || 3
                        }))}
                        className="max-w-xs"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        この回数を超えるとWeb予約が制限されます
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="web_reservation_limit"
                        checked={penaltySettings.webReservationLimit}
                        onCheckedChange={(checked) => setPenaltySettings(prev => ({
                          ...prev,
                          webReservationLimit: checked as boolean
                        }))}
                      />
                      <Label htmlFor="web_reservation_limit">
                        Web予約制限を有効にする
                      </Label>
                    </div>
                    
                    <div>
                      <Label htmlFor="penalty_period">ペナルティ期間（日）</Label>
                      <Input
                        id="penalty_period"
                        type="number"
                        min="1"
                        max="365"
                        value={penaltySettings.penaltyPeriod}
                        onChange={(e) => setPenaltySettings(prev => ({
                          ...prev,
                          penaltyPeriod: parseInt(e.target.value) || 30
                        }))}
                        className="max-w-xs"
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
