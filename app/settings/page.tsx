'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  Settings,
  Building2,
  Calendar,
  Users,
  Stethoscope,
  MessageSquare,
  Globe,
  Bell,
  Database,
  BarChart3,
  Clock,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Edit,
  Star,
  Car,
  Taxi,
  AlertCircle,
  DollarSign,
  FileText,
  HelpCircle,
  User,
  Heart,
  Zap,
  Receipt,
  Accessibility,
  Frown
} from 'lucide-react'
import { updateClinicSettings } from '@/lib/api/clinic'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

const WEEKDAYS = [
  { id: 'monday', name: '月曜日' },
  { id: 'tuesday', name: '火曜日' },
  { id: 'wednesday', name: '水曜日' },
  { id: 'thursday', name: '木曜日' },
  { id: 'friday', name: '金曜日' },
  { id: 'saturday', name: '土曜日' },
  { id: 'sunday', name: '日曜日' }
]

const TIME_SLOT_OPTIONS = [
  { value: 10, label: '10分' },
  { value: 15, label: '15分' },
  { value: 20, label: '20分' },
  { value: 30, label: '30分' },
  { value: 60, label: '60分' }
]

// アイコンマスターデータ
const ICON_MASTER_DATA = [
  { id: 'child', icon: User, title: 'お子さん', enabled: true },
  { id: 'no_contact', icon: AlertCircle, title: '連絡いらない・しない', enabled: true },
  { id: 'long_talk', icon: MessageSquare, title: 'お話長め', enabled: true },
  { id: 'pregnant', icon: Heart, title: '妊娠・授乳中', enabled: true },
  { id: 'implant', icon: Zap, title: 'インプラント', enabled: true },
  { id: 'no_receipt', icon: Receipt, title: '領収書不要', enabled: true },
  { id: 'handicap', icon: Accessibility, title: 'ハンディキャップ有り', enabled: true },
  { id: 'anxious', icon: Frown, title: '心配・恐怖心あり', enabled: true },
  { id: 'review_requested', icon: Star, title: 'ロコミお願い済', enabled: true },
  { id: 'parking', icon: Car, title: '駐車券利用する', enabled: true },
  { id: 'taxi', icon: Taxi, title: 'タクシーを呼ばれる方', enabled: true },
  { id: 'accompanied', icon: Users, title: '付き添い者あり', enabled: true },
  { id: 'caution', icon: AlertCircle, title: '要注意!', enabled: true },
  { id: 'money_caution', icon: DollarSign, title: 'お金関係注意!', enabled: true },
  { id: 'cancellation_policy', icon: FileText, title: 'キャンセルポリシーお渡し済み', enabled: true },
  { id: 'assistance_required', icon: HelpCircle, title: '要介助必要', enabled: true },
  { id: 'referrer', icon: Users, title: '紹介者', enabled: true },
  { id: 'time_specified', icon: Calendar, title: '時間指定あり', enabled: true }
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

const settingCategories = [
  {
    id: 'clinic',
    name: 'クリニック',
    icon: Building2,
    description: 'クリニックの基本情報と診療時間の設定',
    href: '/settings/clinic'
  },
  {
    id: 'calendar',
    name: 'カレンダー',
    icon: Calendar,
    description: 'カレンダーの表示形式とレイアウトの設定',
    href: '/settings/calendar'
  },
  {
    id: 'treatment',
    name: '診療メニュー',
    icon: Stethoscope,
    description: '診療メニューの3階層設定',
    href: '/settings/treatment'
  },
  {
    id: 'questionnaire',
    name: '問診表',
    icon: MessageSquare,
    description: 'Web問診表の設定と管理',
    href: '/settings/questionnaire'
  },
  {
    id: 'staff',
    name: 'スタッフ',
    icon: Users,
    description: 'スタッフとユニット（診療台）の管理',
    href: '/settings/staff'
  },
  {
    id: 'shift',
    name: 'シフト',
    icon: Clock,
    description: '月間カレンダー形式のシフト管理',
    href: '/settings/shift'
  },
  {
    id: 'web',
    name: 'Web予約',
    icon: Globe,
    description: 'Web予約システムの設定',
    href: '/settings/web'
  },
  {
    id: 'notification',
    name: '通知',
    icon: Bell,
    description: 'メール・SMS・LINE通知の設定',
    href: '/settings/notification'
  },
  {
    id: 'master',
    name: 'マスタ',
    icon: Database,
    description: '特記事項アイコンや基本データの管理',
    href: '/settings/master'
  },
  {
    id: 'subkarte',
    name: 'サブカルテ',
    icon: BarChart3,
    description: '定型文登録とカテゴリ管理',
    href: '/settings/subkarte'
  }
]

export default function SettingsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMasterTab, setSelectedMasterTab] = useState('icons')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // クリニック設定の状態
  const [clinicInfo, setClinicInfo] = useState({
    name: '',
    name_kana: '',
    website_url: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address_line: '',
    phone: ''
  })
  const [businessHours, setBusinessHours] = useState<Record<string, { 
    isOpen: boolean; 
    start: string; 
    end: string;
    timeSlots: Array<{
      id: string;
      start: string;
      end: string;
      period: 'morning' | 'afternoon';
    }>;
  }>>({})
  const [breakTimes, setBreakTimes] = useState<Record<string, { start: string; end: string }>>({})
  const [timeSlotMinutes, setTimeSlotMinutes] = useState(15)
  const [holidays, setHolidays] = useState<string[]>([]) // 休診日は空で開始

  // カレンダー設定の状態
  const [unitCount, setUnitCount] = useState(3)
  const [units, setUnits] = useState(['チェア1', 'チェア2', 'チェア3'])
  const [displayItems, setDisplayItems] = useState<string[]>([])
  const [cellHeight, setCellHeight] = useState(40)
  const [cancelTypes, setCancelTypes] = useState<string[]>([])
  const [penaltySettings, setPenaltySettings] = useState({
    noShowThreshold: 3,
    webReservationLimit: true,
    penaltyPeriod: 30
  })
  const [activeTab, setActiveTab] = useState('basic')

  // 診療メニューの状態
  const [menus, setMenus] = useState<any[]>([])
  const [editingMenu, setEditingMenu] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMenu, setNewMenu] = useState({
    name: '',
    level: 1,
    parent_id: '',
    standard_duration: 30,
    color: '#3B82F6',
    sort_order: 0
  })

  // アイコンマスターの状態
  const [iconMaster, setIconMaster] = useState(ICON_MASTER_DATA)
  const [editingIconId, setEditingIconId] = useState<string | null>(null)

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  // 初期データの設定
  useEffect(() => {
    // デフォルトの診療時間を設定
    const defaultBusinessHours: Record<string, any> = {}
    WEEKDAYS.forEach(day => {
      if (day.id !== 'sunday') {
        defaultBusinessHours[day.id] = {
          isOpen: true,
          start: '09:00',
          end: '18:00',
          timeSlots: [
            {
              id: `${day.id}_morning`,
              start: '09:00',
              end: '13:00',
              period: 'morning'
            },
            {
              id: `${day.id}_afternoon`,
              start: '14:30',
              end: '18:00',
              period: 'afternoon'
            }
          ]
        }
      } else {
        defaultBusinessHours[day.id] = {
          isOpen: false,
          start: '09:00',
          end: '18:00',
          timeSlots: []
        }
      }
    })
    setBusinessHours(defaultBusinessHours)
  }, [])

  // 診療時間の変更
  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  // 休憩時間の変更
  const handleBreakTimesChange = (day: string, field: string, value: string) => {
    setBreakTimes(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  // 休診日の変更
  const handleHolidayChange = (day: string, checked: boolean) => {
    console.log('休診日変更:', day, checked)
    if (checked) {
      setHolidays(prev => {
        const newHolidays = [...prev, day]
        console.log('新しい休診日リスト:', newHolidays)
        return newHolidays
      })
    } else {
      setHolidays(prev => {
        const newHolidays = prev.filter(d => d !== day)
        console.log('新しい休診日リスト:', newHolidays)
        return newHolidays
      })
    }
  }

  // 時間枠の追加
  const addTimeSlot = (day: string) => {
    const currentSlots = businessHours[day]?.timeSlots || []
    const newSlot = {
      id: Date.now().toString(),
      start: '09:00',
      end: '18:00',
      period: 'morning'
    }
    
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...currentSlots, newSlot]
      }
    }))
  }

  // 時間枠の削除
  const removeTimeSlot = (day: string, slotId: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day]?.timeSlots?.filter(slot => slot.id !== slotId) || []
      }
    }))
  }

  // 時間枠の変更
  const updateTimeSlot = (day: string, slotId: string, field: string, value: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day]?.timeSlots?.map(slot => 
          slot.id === slotId ? { ...slot, [field]: value } : slot
        ) || []
      }
    }))
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

  // 保存処理
  const handleSave = async () => {
    try {
      setSaving(true)

      // カテゴリに応じて保存データを準備
      const settings: any = {}

      if (selectedCategory === 'clinic') {
        settings.clinicInfo = clinicInfo
        settings.businessHours = businessHours
        settings.breakTimes = breakTimes
        settings.timeSlotMinutes = timeSlotMinutes
        settings.holidays = holidays
      } else if (selectedCategory === 'calendar') {
        settings.timeSlotMinutes = timeSlotMinutes
        settings.unitCount = unitCount
        settings.units = units
        settings.displayItems = displayItems
        settings.cellHeight = cellHeight
        settings.cancelTypes = cancelTypes
        settings.penaltySettings = penaltySettings
      }

      console.log('保存データ:', settings)
      console.log('クリニックID:', DEMO_CLINIC_ID)
      console.log('現在の timeSlotMinutes:', timeSlotMinutes)

      // Supabaseに保存
      const result = await updateClinicSettings(DEMO_CLINIC_ID, settings)
      console.log('保存結果:', result)

      alert('設定を保存しました。カレンダーページをリロードすると反映されます。')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // クリニック設定コンテンツ
  const renderClinicSettings = () => (
    <div className="space-y-8">
      {/* クリニック情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">クリニック情報</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">クリニック名（正式名称）</Label>
                <Input
                  id="name"
                  value={clinicInfo.name}
                  onChange={(e) => setClinicInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例: 田中歯科医院"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="name_kana" className="text-sm font-medium text-gray-700">クリニック名（ふりがな）</Label>
                <Input
                  id="name_kana"
                  value={clinicInfo.name_kana}
                  onChange={(e) => setClinicInfo(prev => ({ ...prev, name_kana: e.target.value }))}
                  placeholder="例: たなかしかいいん"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="website_url" className="text-sm font-medium text-gray-700">ホームページURL</Label>
              <Input
                id="website_url"
                value={clinicInfo.website_url}
                onChange={(e) => setClinicInfo(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="例: https://example.com"
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="postal_code" className="text-sm font-medium text-gray-700">郵便番号</Label>
                <Input
                  id="postal_code"
                  value={clinicInfo.postal_code}
                  onChange={(e) => setClinicInfo(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="例: 123-4567"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="prefecture" className="text-sm font-medium text-gray-700">都道府県</Label>
                <Input
                  id="prefecture"
                  value={clinicInfo.prefecture}
                  onChange={(e) => setClinicInfo(prev => ({ ...prev, prefecture: e.target.value }))}
                  placeholder="例: 東京都"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">市区町村</Label>
                <Input
                  id="city"
                  value={clinicInfo.city}
                  onChange={(e) => setClinicInfo(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="例: 渋谷区"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address_line" className="text-sm font-medium text-gray-700">住所（番地・建物名）</Label>
              <Input
                id="address_line"
                value={clinicInfo.address_line}
                onChange={(e) => setClinicInfo(prev => ({ ...prev, address_line: e.target.value }))}
                placeholder="例: 1-2-3 田中ビル 2F"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">電話番号</Label>
              <Input
                id="phone"
                value={clinicInfo.phone}
                onChange={(e) => setClinicInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="例: 03-1234-5678"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 診療時間設定 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">診療時間</h3>
          <div className="space-y-4">
            <div className="space-y-3">
              {WEEKDAYS.map(day => {
                const isHoliday = holidays.includes(day.id)
                const timeSlots = businessHours[day.id]?.timeSlots || []
                
                return (
                  <div key={day.id} className={`flex items-center p-4 rounded-lg border ${
                    isHoliday 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {/* 曜日名 */}
                    <div className="w-20 flex-shrink-0">
                      <h4 className="text-sm font-medium text-gray-900">{day.name}</h4>
                    </div>
                    
                    {/* 休診チェックボックス */}
                    <div className="w-20 flex-shrink-0 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`holiday_${day.id}`}
                        checked={isHoliday}
                        onChange={(e) => {
                          const checked = e.target.checked
                          console.log('チェックボックス変更:', day.id, checked)
                          handleHolidayChange(day.id, checked)
                          // 休診日がチェックされた場合、その日の診療時間をクリア
                          if (checked) {
                            setBusinessHours(prev => ({
                              ...prev,
                              [day.id]: {
                                ...prev[day.id],
                                isOpen: false,
                                timeSlots: []
                              }
                            }))
                          } else {
                            // 休診日がチェック解除された場合、デフォルトの診療時間を設定
                            setBusinessHours(prev => ({
                              ...prev,
                              [day.id]: {
                                ...prev[day.id],
                                isOpen: true,
                                timeSlots: [
                                  {
                                    id: `${day.id}_morning`,
                                    start: '09:00',
                                    end: '13:00',
                                    period: 'morning'
                                  },
                                  {
                                    id: `${day.id}_afternoon`,
                                    start: '14:30',
                                    end: '18:00',
                                    period: 'afternoon'
                                  }
                                ]
                              }
                            }))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor={`holiday_${day.id}`} className="text-xs text-gray-600 cursor-pointer">
                        休診
                      </Label>
                    </div>
                    
                    {/* 時間枠 */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {timeSlots.map((slot, index) => (
                          <div key={slot.id} className={`flex items-center space-x-2 rounded-md px-3 py-2 ${
                            isHoliday ? 'bg-gray-100' : 'bg-gray-50'
                          }`}>
                            <span className={`text-xs font-medium ${
                              isHoliday ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {slot.period === 'morning' ? '午前' : '午後'}
                            </span>
                            <Input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateTimeSlot(day.id, slot.id, 'start', e.target.value)}
                              disabled={isHoliday}
                              className={`w-24 text-xs ${
                                isHoliday 
                                  ? 'border-gray-200 bg-gray-100 text-gray-400' 
                                  : 'border-gray-200'
                              }`}
                            />
                            <span className="text-gray-400">～</span>
                            <Input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateTimeSlot(day.id, slot.id, 'end', e.target.value)}
                              disabled={isHoliday}
                              className={`w-24 text-xs ${
                                isHoliday 
                                  ? 'border-gray-200 bg-gray-100 text-gray-400' 
                                  : 'border-gray-200'
                              }`}
                            />
                            <button
                              onClick={() => removeTimeSlot(day.id, slot.id)}
                              disabled={isHoliday}
                              className={`${
                                isHoliday 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        {!isHoliday && (
                          <button
                            onClick={() => addTimeSlot(day.id)}
                            className="flex items-center space-x-1 px-3 py-2 text-xs text-blue-600 border border-dashed border-blue-300 rounded-md hover:bg-blue-50"
                          >
                            <Plus className="w-3 h-3" />
                            <span>追加</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // カレンダー設定コンテンツ
  const renderCalendarSettings = () => (
    <div className="space-y-6">
      {/* タブ */}
      <div className="flex space-x-0 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'basic'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          基本設定
        </button>
        <button
          onClick={() => setActiveTab('cancel')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'cancel'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          キャンセル管理
        </button>
      </div>

      {/* 基本設定タブ */}
      {activeTab === 'basic' && (
        <div className="space-y-8">
          {/* 1コマの時間 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">1コマの時間</h3>
              <div className="max-w-xs">
                <Select
                  value={timeSlotMinutes.toString()}
                  onValueChange={(value) => setTimeSlotMinutes(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
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
            </div>
          </div>

          {/* ユニット設定 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">ユニット</h3>
              <div className="space-y-4">
                <div className="max-w-xs">
                  <Label htmlFor="unit_count" className="text-sm font-medium text-gray-700">ユニット数:</Label>
                  <Input
                    id="unit_count"
                    type="number"
                    min="1"
                    max="10"
                    value={unitCount}
                    onChange={(e) => handleUnitCountChange(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                
                <div className="space-y-3">
                  {units.map((unit, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Label className="w-20 text-sm font-medium text-gray-700">ユニット{index + 1}:</Label>
                      <Input
                        value={unit}
                        onChange={(e) => handleUnitNameChange(index, e.target.value)}
                        placeholder={`チェア${index + 1}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 表示項目 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">表示項目</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DISPLAY_ITEMS.map(item => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <Checkbox
                      id={item.id}
                      checked={displayItems.includes(item.id)}
                      onCheckedChange={(checked) => 
                        handleDisplayItemChange(item.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={item.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                        {item.name}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* セル表示設定 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">セル表示設定</h3>
              <p className="text-sm text-gray-600">カレンダーのセル（予約ブロック）の基本高さを調整します</p>
              <div className="max-w-md">
                <Label className="text-sm font-medium text-gray-700">セルの高さ: {cellHeight}px</Label>
                <Slider
                  value={[cellHeight]}
                  onValueChange={(value) => setCellHeight(value[0])}
                  min={20}
                  max={80}
                  step={5}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* キャンセル管理タブ */}
      {activeTab === 'cancel' && (
        <div className="space-y-8">
          {/* キャンセル種類 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">キャンセル種類</h3>
                <p className="text-sm text-gray-600 mt-1">使用するキャンセル種類を選択してください</p>
              </div>
              <div className="space-y-4">
                {CANCEL_TYPES.map(type => (
                  <div key={type.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
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
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={type.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                        {type.name}
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ペナルティ設定 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">ペナルティ設定</h3>
                <p className="text-sm text-gray-600 mt-1">無断キャンセルに対するペナルティを設定します</p>
              </div>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="no_show_threshold" className="text-sm font-medium text-gray-700">無断キャンセル回数閾値</Label>
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
                    className="max-w-xs mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    この回数を超えるとWeb予約が制限されます
                  </p>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="web_reservation_limit"
                    checked={penaltySettings.webReservationLimit}
                    onCheckedChange={(checked) => setPenaltySettings(prev => ({
                      ...prev,
                      webReservationLimit: checked as boolean
                    }))}
                  />
                  <Label htmlFor="web_reservation_limit" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Web予約制限を有効にする
                  </Label>
                </div>
                
                <div>
                  <Label htmlFor="penalty_period" className="text-sm font-medium text-gray-700">ペナルティ期間（日）</Label>
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
                    className="max-w-xs mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // 診療メニュー設定コンテンツ
  // アイコンマスターの関数
  const handleIconTitleEdit = (iconId: string, newTitle: string) => {
    setIconMaster(prev => prev.map(icon => 
      icon.id === iconId ? { ...icon, title: newTitle } : icon
    ))
  }

  const handleIconToggle = (iconId: string) => {
    setIconMaster(prev => prev.map(icon => 
      icon.id === iconId ? { ...icon, enabled: !icon.enabled } : icon
    ))
  }

  const renderMasterSettings = () => (
    <div className="space-y-6">
      {/* サブタブ */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setSelectedMasterTab('icons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedMasterTab === 'icons'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            アイコン
          </button>
          <button
            onClick={() => setSelectedMasterTab('staff')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedMasterTab === 'staff'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            スタッフ
          </button>
          <button
            onClick={() => setSelectedMasterTab('files')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedMasterTab === 'files'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ファイル
          </button>
        </nav>
      </div>

      {/* アイコンタブのコンテンツ */}
      {selectedMasterTab === 'icons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">アイコン</h3>
              <p className="text-sm text-gray-500">患者の特記事項を管理します</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {iconMaster.map((icon) => {
              const IconComponent = icon.icon
              return (
                <div key={icon.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {IconComponent ? (
                        <IconComponent className="w-6 h-6 text-gray-600" />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">?</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {editingIconId === icon.id ? (
                        <Input
                          value={icon.title}
                          onChange={(e) => handleIconTitleEdit(icon.id, e.target.value)}
                          onBlur={() => setEditingIconId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingIconId(null)
                            }
                          }}
                          className="text-sm font-medium"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                          onClick={() => setEditingIconId(icon.id)}
                        >
                          {icon.title}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={icon.enabled}
                        onChange={() => handleIconToggle(icon.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => setEditingIconId(icon.id)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* スタッフタブのコンテンツ */}
      {selectedMasterTab === 'staff' && (
        <div className="text-center py-8 text-gray-500">
          スタッフ設定のコンテンツがここに表示されます
        </div>
      )}

      {/* ファイルタブのコンテンツ */}
      {selectedMasterTab === 'files' && (
        <div className="text-center py-8 text-gray-500">
          ファイル設定のコンテンツがここに表示されます
        </div>
      )}
    </div>
  )

  const renderTreatmentSettings = () => (
    <div className="space-y-6">
      {/* メニュー一覧 */}
      <div className="space-y-4">
        {menus.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            診療メニューが登録されていません
          </div>
        ) : (
          menus.map((menu, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: menu.color || '#3B82F6' }}
                    />
                    <div>
                      <div className="font-medium">{menu.name}</div>
                      <div className="text-sm text-gray-500">
                        レベル{menu.level} | 標準時間: {menu.standard_duration}分
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMenu(menu)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* メニュー追加フォーム */}
      {showAddForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>新しいメニューを追加</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="menu_name">メニュー名</Label>
                <Input
                  id="menu_name"
                  value={newMenu.name}
                  onChange={(e) => setNewMenu(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例: 虫歯治療"
                />
              </div>
              <div>
                <Label htmlFor="menu_level">レベル</Label>
                <select
                  id="menu_level"
                  value={newMenu.level}
                  onChange={(e) => setNewMenu(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>レベル1（大分類）</option>
                  <option value={2}>レベル2（中分類）</option>
                  <option value={3}>レベル3（詳細）</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standard_duration">標準時間（分）</Label>
                <Input
                  id="standard_duration"
                  type="number"
                  value={newMenu.standard_duration}
                  onChange={(e) => setNewMenu(prev => ({ ...prev, standard_duration: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="menu_color">色</Label>
                <Input
                  id="menu_color"
                  type="color"
                  value={newMenu.color}
                  onChange={(e) => setNewMenu(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => {
                  // メニュー追加処理
                  setShowAddForm(false)
                }}
                disabled={!newMenu.name}
              >
                追加
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 追加ボタン */}
      {!showAddForm && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            メニュー追加
          </Button>
        </div>
      )}
    </div>
  )

  // 右側コンテンツのレンダリング
  const renderRightContent = () => {
    if (!selectedCategory) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              設定を選択してください
            </h2>
            <p className="text-gray-600">
              左側のメニューから設定したい項目を選択してください
            </p>
          </div>
        </div>
      )
    }

    const category = settingCategories.find(cat => cat.id === selectedCategory)
    if (!category) return null

    return (
      <div className="p-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
            <p className="text-gray-600">{category.description}</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>

        {/* コンテンツ */}
        {selectedCategory === 'clinic' && renderClinicSettings()}
        {selectedCategory === 'calendar' && renderCalendarSettings()}
        {selectedCategory === 'treatment' && renderTreatmentSettings()}
        {selectedCategory === 'questionnaire' && (
          <div className="text-center py-8 text-gray-500">
            問診表設定のコンテンツがここに表示されます
          </div>
        )}
        {selectedCategory === 'staff' && (
          <div className="text-center py-8 text-gray-500">
            スタッフ設定のコンテンツがここに表示されます
          </div>
        )}
        {selectedCategory === 'shift' && (
          <div className="text-center py-8 text-gray-500">
            シフト設定のコンテンツがここに表示されます
          </div>
        )}
        {selectedCategory === 'web' && (
          <div className="text-center py-8 text-gray-500">
            Web予約設定のコンテンツがここに表示されます
          </div>
        )}
        {selectedCategory === 'notification' && (
          <div className="text-center py-8 text-gray-500">
            通知設定のコンテンツがここに表示されます
          </div>
        )}
        {selectedCategory === 'master' && renderMasterSettings()}
        {selectedCategory === 'subkarte' && (
          <div className="text-center py-8 text-gray-500">
            サブカルテ設定のコンテンツがここに表示されます
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-full">
        {/* 左サイドバー */}
        <div className="w-56 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              設定
            </h1>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-2">
              {settingCategories.map((category) => {
                const Icon = category.icon
                const isActive = selectedCategory === category.id
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors rounded-lg ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {renderRightContent()}
        </div>
      </div>
    </div>
  )
}