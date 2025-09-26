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
import { Modal } from '@/components/ui/modal'
import { ShiftPatterns } from '@/components/shift/shift-patterns'
import { ShiftTable } from '@/components/shift/shift-table'
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
  Edit,
  Trash2,
  Plus,
  Clock,
  ChevronRight,
  Save,
  FolderOpen,
  X,
  Tag,
  User,
  AlertCircle,
  Heart,
  Zap,
  Receipt,
  Accessibility,
  Frown,
  Star,
  Car,
  DollarSign,
  FileText,
  HelpCircle,
  ExternalLink,
  Copy
} from 'lucide-react'
import { updateClinicSettings, setClinicSetting, getClinicSettings } from '@/lib/api/clinic'
import { getStaff, createStaff, updateStaff, deleteStaff } from '@/lib/api/staff'
import { getStaffPositions, createStaffPosition, updateStaffPosition, deleteStaffPosition } from '@/lib/api/staff-positions'
import { getPatientNoteTypes, createPatientNoteType, updatePatientNoteType, deletePatientNoteType } from '@/lib/api/patient-note-types'
import { getCancelReasons, createCancelReason, updateCancelReason, deleteCancelReason } from '@/lib/api/cancel-reasons'
import { getTreatmentMenus, createTreatmentMenu, updateTreatmentMenu, deleteTreatmentMenu } from '@/lib/api/treatment'
import { getQuestionnaires, createQuestionnaire, updateQuestionnaire, deleteQuestionnaire, Questionnaire, QuestionnaireQuestion } from '@/lib/api/questionnaires'
import { QuestionnaireEditModal } from '@/components/forms/questionnaire-edit-modal'

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
  { id: 'taxi', icon: Car, title: 'タクシーを呼ばれる方', enabled: true },
  { id: 'accompanied', icon: User, title: '付き添い者あり', enabled: true },
  { id: 'caution', icon: AlertCircle, title: '要注意!', enabled: true },
  { id: 'money_caution', icon: DollarSign, title: 'お金関係注意!', enabled: true },
  { id: 'cancellation_policy', icon: FileText, title: 'キャンセルポリシーお渡し済み', enabled: true },
  { id: 'assistance_required', icon: HelpCircle, title: '要介助必要', enabled: true },
  { id: 'referrer', icon: User, title: '紹介者', enabled: true },
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>('clinic')
  const [selectedMasterTab, setSelectedMasterTab] = useState('icons')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 問診票の状態
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null)
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false)
  const [newQuestionnaire, setNewQuestionnaire] = useState({
    name: '',
    description: '',
    is_active: true
  })

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
    isOpen: boolean, 
    start: string, 
    end: string,
    timeSlots: Array<{
      id: string,
      start: string,
      end: string,
      period: 'morning' | 'afternoon'
    }>
  }>>({})
  const [breakTimes, setBreakTimes] = useState<Record<string, { start: string; end: string }>>({})
  const [timeSlotMinutes, setTimeSlotMinutes] = useState(15)
  const [holidays, setHolidays] = useState<string[]>([]) // 休診日は空で開始
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // カレンダー設定の状態
  const [unitCount, setUnitCount] = useState(3)
  const [units, setUnits] = useState(['チェア1', 'チェア2', 'チェア3'])
  const [displayItems, setDisplayItems] = useState<string[]>([])
  const [cellHeight, setCellHeight] = useState(40)
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


  
  // スタッフ管理の状態
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [staff, setStaff] = useState<any[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [newStaff, setNewStaff] = useState({
    name: '',
    name_kana: '',
    email: '',
    phone: '',
    role: 'staff',
    position_id: ''
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // マスタ設定の状態
  const [staffPositions, setStaffPositions] = useState<any[]>([])
  const [patientNoteTypes, setPatientNoteTypes] = useState<any[]>([])
  const [cancelReasons, setCancelReasons] = useState<any[]>([])
  const [iconMaster, setIconMaster] = useState(ICON_MASTER_DATA)
  const [editingIconId, setEditingIconId] = useState<string | null>(null)
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [showAddNoteType, setShowAddNoteType] = useState(false)
  const [showAddCancelReason, setShowAddCancelReason] = useState(false)
  const [showEditCancelReason, setShowEditCancelReason] = useState(false)
  const [editingCancelReason, setEditingCancelReason] = useState<any>(null)
  const [newPosition, setNewPosition] = useState({
    name: '',
    sort_order: 0,
    enabled: true
  })
  const [newNoteType, setNewNoteType] = useState({
    name: '',
    description: '',
    sort_order: 0,
    is_active: true
  })
  const [newCancelReason, setNewCancelReason] = useState({
    name: '',
    is_active: true
  })

  // デフォルトテキストの状態
  const [defaultTexts, setDefaultTexts] = useState<Array<{id: string, title: string, content: string, createdAt: string, updatedAt: string}>>([])
  const [showAddDefaultTextModal, setShowAddDefaultTextModal] = useState(false)
  const [editingDefaultText, setEditingDefaultText] = useState<any>(null)
  const [newDefaultText, setNewDefaultText] = useState({
    title: '',
    content: ''
  })

  // 診療メニュー関連の状態
  const [treatmentMenus, setTreatmentMenus] = useState<any[]>([])
  const [editingTreatmentMenu, setEditingTreatmentMenu] = useState<any>(null)
  const [showTreatmentAddForm, setShowTreatmentAddForm] = useState(false)
  const [selectedTab, setSelectedTab] = useState('menu1')
  const [parentMenuForChild, setParentMenuForChild] = useState<any>(null) // 子メニュー作成用の親メニュー
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set()) // 展開されたメニューのID
  const [newTreatmentMenu, setNewTreatmentMenu] = useState({
    name: '',
    level: 1,
    parent_id: '',
    standard_duration: 30,
    color: '#3B82F6',
    sort_order: 0
  })

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    // スタッフタブが選択された場合は、スタッフ管理タブを自動選択
    if (categoryId === 'staff') {
      setActiveTab('staff')
    }
  }

  // デフォルトテキストの保存
  const saveDefaultTexts = (texts: Array<{id: string, title: string, content: string, createdAt: string, updatedAt: string}>) => {
    setDefaultTexts(texts)
    localStorage.setItem('default_texts', JSON.stringify(texts))
  }

  // デフォルトテキストの追加
  const handleAddDefaultText = () => {
    if (!newDefaultText.title.trim() || !newDefaultText.content.trim()) {
      alert('タイトルと内容を入力してください')
      return
    }

    const newText = {
      id: Date.now().toString(),
      title: newDefaultText.title,
      content: newDefaultText.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedTexts = [...defaultTexts, newText]
    saveDefaultTexts(updatedTexts)
    setNewDefaultText({ title: '', content: '' })
    setShowAddDefaultTextModal(false)
  }

  // デフォルトテキストの編集
  const handleEditDefaultText = (text: any) => {
    setEditingDefaultText(text)
    setNewDefaultText({ title: text.title, content: text.content })
    setShowAddDefaultTextModal(true)
  }

  // デフォルトテキストの編集保存
  const handleEditDefaultTextSave = () => {
    if (!newDefaultText.title.trim() || !newDefaultText.content.trim()) {
      alert('タイトルと内容を入力してください')
      return
    }

    const updatedTexts = defaultTexts.map(text =>
      text.id === editingDefaultText?.id
        ? { ...text, title: newDefaultText.title, content: newDefaultText.content, updatedAt: new Date().toISOString() }
        : text
    )

    saveDefaultTexts(updatedTexts)
    setNewDefaultText({ title: '', content: '' })
    setEditingDefaultText(null)
    setShowAddDefaultTextModal(false)
  }

  // デフォルトテキストの削除
  const handleDeleteDefaultText = (id: string) => {
    if (confirm('このデフォルトテキストを削除しますか？')) {
      const updatedTexts = defaultTexts.filter(text => text.id !== id)
      saveDefaultTexts(updatedTexts)
    }
  }


  // 問診票データの読み込み
  useEffect(() => {
    const loadQuestionnaires = async () => {
      if (selectedCategory === 'questionnaire') {
        try {
          const data = await getQuestionnaires(DEMO_CLINIC_ID)
          setQuestionnaires(data)
        } catch (error) {
          console.error('問診票データの読み込みエラー:', error)
        }
      }
    }
    loadQuestionnaires()
  }, [selectedCategory])

  // デフォルトテキストの読み込み
  useEffect(() => {
    const savedTexts = localStorage.getItem('default_texts')
    if (savedTexts) {
      setDefaultTexts(JSON.parse(savedTexts))
    }
  }, [])

  // 初期データの設定
  useEffect(() => {
    const loadClinicSettings = async () => {
      try {
        console.log('クリニック設定読み込み開始')
        const settings = await getClinicSettings(DEMO_CLINIC_ID)
        console.log('読み込んだ設定:', settings)
        
        // 保存された設定があれば使用、なければデフォルト値を使用
        if (settings.business_hours) {
          setBusinessHours(settings.business_hours)
        } else {
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
                    period: 'morning' as 'morning'
                  },
                  {
                    id: `${day.id}_afternoon`,
                    start: '14:30',
                    end: '18:00',
                    period: 'afternoon' as 'afternoon'
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
        }
        
        if (settings.break_times) {
          setBreakTimes(settings.break_times)
        }
        
        if (settings.time_slot_minutes) {
          setTimeSlotMinutes(settings.time_slot_minutes)
        }
        
        if (settings.holidays) {
          console.log('読み込んだ休診日:', settings.holidays)
          setHolidays(settings.holidays)
        }
        
        if (settings.clinic_info) {
          setClinicInfo(settings.clinic_info)
        }
        
      } catch (error) {
        console.error('クリニック設定読み込みエラー:', error)
        // エラーの場合はデフォルト値を使用
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
                  period: 'morning' as 'morning'
                },
                {
                  id: `${day.id}_afternoon`,
                  start: '14:30',
                  end: '18:00',
                  period: 'afternoon' as 'afternoon'
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
      }
    }
    
    loadClinicSettings()

    // 初期読み込み完了フラグを設定
    setIsInitialLoad(false)

    // スタッフデータの読み込み
    const loadStaff = async () => {
      try {
        console.log('スタッフデータ読み込み開始:', DEMO_CLINIC_ID)
        setStaffLoading(true)
        const data = await getStaff(DEMO_CLINIC_ID)
        console.log('読み込んだスタッフデータ:', data)
        setStaff(data)
      } catch (error) {
        console.error('スタッフデータ読み込みエラー:', error)
      } finally {
        setStaffLoading(false)
      }
    }
    
    loadStaff()

    // マスタデータの読み込み
    const loadMasterData = async () => {
      try {
        const [positionsData, noteTypesData, cancelReasonsData] = await Promise.all([
          getStaffPositions(DEMO_CLINIC_ID),
          getPatientNoteTypes(DEMO_CLINIC_ID),
          getCancelReasons(DEMO_CLINIC_ID)
        ])
        setStaffPositions(positionsData)
        setPatientNoteTypes(noteTypesData)
        setCancelReasons(cancelReasonsData)
      } catch (error) {
        console.error('マスタデータ読み込みエラー:', error)
      }
    }
    
    loadMasterData()

    // 診療メニューデータの読み込み
    const loadTreatmentMenus = async () => {
      try {
        console.log('メニュー読み込み開始:', DEMO_CLINIC_ID)
        const data = await getTreatmentMenus(DEMO_CLINIC_ID)
        console.log('読み込んだメニューデータ:', data)
        setTreatmentMenus(data)
      } catch (error) {
        console.error('メニュー読み込みエラー:', error)
      }
    }
    
    loadTreatmentMenus()
  }, [])

  // timeSlotMinutesの変更を監視して自動保存
  useEffect(() => {
    console.log('設定ページ: 自動保存useEffect実行 - isInitialLoad:', isInitialLoad, 'timeSlotMinutes:', timeSlotMinutes)
    
    if (isInitialLoad) {
      console.log('設定ページ: 初期読み込み中のため自動保存をスキップ')
      return // 初期読み込み時は保存しない
    }
    
    console.log('設定ページ: timeSlotMinutes変更検知:', timeSlotMinutes)
    
    // デバウンス処理（500ms後に保存）
    const timeoutId = setTimeout(async () => {
      try {
        console.log('設定ページ: 自動保存開始')
        console.log('設定ページ: timeSlotMinutes保存値:', timeSlotMinutes)
        
        // 数値として保存することを確認
        const numericTimeSlotMinutes = Number(timeSlotMinutes)
        console.log('設定ページ: 数値変換後の値:', numericTimeSlotMinutes)

        await setClinicSetting(DEMO_CLINIC_ID, 'time_slot_minutes', numericTimeSlotMinutes)
        console.log('設定ページ: time_slot_minutes保存完了')

        // メインページに設定変更を通知
        const updateData = {
          timestamp: Date.now(),
          timeSlotMinutes: numericTimeSlotMinutes
        }
        window.localStorage.setItem('clinic_settings_updated', JSON.stringify(updateData))
        console.log('設定ページ: localStorageに設定更新通知を保存:', updateData)

        // カスタムイベントを発火
        const customEvent = new CustomEvent('clinicSettingsUpdated', {
          detail: { timeSlotMinutes: numericTimeSlotMinutes }
        })
        window.dispatchEvent(customEvent)
        console.log('設定ページ: カスタムイベントを発火:', customEvent.detail)

        // postMessageも発火（追加の通知方法）
        window.postMessage({
          type: 'clinicSettingsUpdated',
          data: { timeSlotMinutes: numericTimeSlotMinutes }
        }, window.location.origin)
        console.log('設定ページ: postMessageを発火:', { timeSlotMinutes: numericTimeSlotMinutes })
      } catch (error) {
        console.error('自動保存エラー:', error)
      }
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [timeSlotMinutes, isInitialLoad])

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
      // 休診日がチェックされた場合、その日の診療時間をクリア
      setBusinessHours(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          isOpen: false,
          timeSlots: []
        }
      }))
    } else {
      setHolidays(prev => {
        const newHolidays = prev.filter(d => d !== day)
        console.log('新しい休診日リスト:', newHolidays)
        return newHolidays
      })
      // 休診日がチェック解除された場合、デフォルトの診療時間を設定
      setBusinessHours(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          isOpen: true,
          timeSlots: [
            {
              id: `${day}_morning`,
              start: '09:00',
              end: '13:00',
              period: 'morning' as 'morning'
            },
            {
              id: `${day}_afternoon`,
              start: '14:30',
              end: '18:00',
              period: 'afternoon' as 'afternoon'
            }
          ]
        }
      }))
    }
  }

  // 時間枠の追加
  const addTimeSlot = (day: string) => {
    const currentSlots = businessHours[day]?.timeSlots || []
    const newSlot = {
      id: Date.now().toString(),
      start: '09:00',
      end: '18:00',
      period: 'morning' as 'morning'
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
      }

      console.log('保存データ:', settings)
      console.log('クリニックID:', DEMO_CLINIC_ID)
      console.log('現在の timeSlotMinutes:', timeSlotMinutes)
      console.log('現在の holidays:', holidays)
      console.log('現在の businessHours:', businessHours)

      // Supabaseに保存
      if (selectedCategory === 'clinic') {
        // クリニック設定は個別に保存
        await setClinicSetting(DEMO_CLINIC_ID, 'clinic_info', settings.clinicInfo)
        await setClinicSetting(DEMO_CLINIC_ID, 'business_hours', settings.businessHours)
        await setClinicSetting(DEMO_CLINIC_ID, 'break_times', settings.breakTimes)
        await setClinicSetting(DEMO_CLINIC_ID, 'time_slot_minutes', settings.timeSlotMinutes)
        await setClinicSetting(DEMO_CLINIC_ID, 'holidays', settings.holidays)
        console.log('クリニック設定をclinic_settingsテーブルに保存しました')
        console.log('保存されたholidays:', settings.holidays)
      } else {
        // その他の設定は従来通り
        const result = await updateClinicSettings(DEMO_CLINIC_ID, settings)
        console.log('保存結果:', result)
        console.log('保存結果の詳細:', JSON.stringify(result, null, 2))
        console.log('保存結果のcancel_types:', result.cancel_types)
      }

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
                          <div key={`${day.id}-${slot.id}`} className={`flex items-center space-x-2 rounded-md px-3 py-2 ${
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
                    <div key={`unit-${index}-${unit}`} className="flex items-center space-x-4">
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

    </div>
  )

  // 診療メニュー設定コンテンツ


  // マスタ設定のハンドラー
  const handleAddPosition = async () => {
    try {
      setSaving(true)
      await createStaffPosition(DEMO_CLINIC_ID, newPosition)

      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID)
      setStaffPositions(data)

      setNewPosition({
        name: '',
        sort_order: 0,
        enabled: true
      })
      setShowAddPosition(false)
    } catch (error) {
      console.error('役職追加エラー:', error)
      const errorMessage = error instanceof Error ? error.message : '役職の追加に失敗しました'
      alert(`役職の追加に失敗しました: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePosition = async (positionId: string, updates: any) => {
    try {
      setSaving(true)
      await updateStaffPosition(DEMO_CLINIC_ID, positionId, updates)

      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID)
      setStaffPositions(data)
    } catch (error) {
      console.error('役職更新エラー:', error)
      alert('役職の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm('この役職を削除しますか？')) return
    
    try {
      setSaving(true)
      await deleteStaffPosition(DEMO_CLINIC_ID, positionId)

      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID)
      setStaffPositions(data)
    } catch (error) {
      console.error('役職削除エラー:', error)
      alert('役職の削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNoteType = async () => {
    try {
      setSaving(true)
      await createPatientNoteType(DEMO_CLINIC_ID, newNoteType)

      // データを再読み込み
      const data = await getPatientNoteTypes(DEMO_CLINIC_ID)
      setPatientNoteTypes(data)

      setNewNoteType({
        name: '',
        description: '',
        sort_order: 0,
        is_active: true
      })
      setShowAddNoteType(false)
    } catch (error) {
      console.error('ノートタイプ追加エラー:', error)
      alert('ノートタイプの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

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

  // キャンセル理由追加
  const handleAddCancelReason = async () => {
    try {
      setSaving(true)
      await createCancelReason(DEMO_CLINIC_ID, newCancelReason)

      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID)
      setCancelReasons(data)

      setNewCancelReason({
        name: '',
        is_active: true
      })
      setShowAddCancelReason(false)
    } catch (error) {
      console.error('キャンセル理由追加エラー:', error)
      alert('キャンセル理由の追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCancelReason = async (reasonId: string, updates: any) => {
    try {
      setSaving(true)
      await updateCancelReason(DEMO_CLINIC_ID, reasonId, updates)

      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID)
      setCancelReasons(data)
    } catch (error) {
      console.error('キャンセル理由更新エラー:', error)
      alert('キャンセル理由の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCancelReason = async (reasonId: string) => {
    if (!confirm('このキャンセル理由を削除しますか？')) return
    
    try {
      setSaving(true)
      await deleteCancelReason(DEMO_CLINIC_ID, reasonId)

      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID)
      setCancelReasons(data)
    } catch (error) {
      console.error('キャンセル理由削除エラー:', error)
      alert('キャンセル理由の削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleEditCancelReason = (reason: any) => {
    console.log('編集開始:', reason)
    setEditingCancelReason(reason)
    setShowEditCancelReason(true)
  }

  const handleSaveEditCancelReason = async () => {
    if (!editingCancelReason) {
      console.error('編集するキャンセル理由がありません')
      return
    }
    
    console.log('編集保存開始:', editingCancelReason)
    
    try {
      setSaving(true)
      await updateCancelReason(DEMO_CLINIC_ID, editingCancelReason.id, {
        name: editingCancelReason.name,
        is_active: editingCancelReason.is_active
      })

      console.log('更新完了、データを再読み込み中...')
      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID)
      setCancelReasons(data)
      
      console.log('編集モーダルを閉じます')
      setShowEditCancelReason(false)
      setEditingCancelReason(null)
    } catch (error) {
      console.error('キャンセル理由更新エラー:', error)
      alert('キャンセル理由の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // スタッフ追加
  const handleAddStaff = async () => {
    try {
      console.log('handleAddStaff開始')
      console.log('newStaff:', newStaff)
      
      setStaffLoading(true)
      await createStaff(DEMO_CLINIC_ID, newStaff)
      
      console.log('スタッフ作成成功')
      
      // データを再読み込み
      const data = await getStaff(DEMO_CLINIC_ID)
      console.log('再読み込みしたスタッフデータ:', data)
      setStaff(data)
      
      // シフト表をリフレッシュ
      setRefreshTrigger(prev => prev + 1)
      
      setNewStaff({
        name: '',
        name_kana: '',
        email: '',
        phone: '',
        role: 'staff',
        position_id: ''
      })
      setShowAddStaff(false)
      console.log('モーダルを閉じました')
    } catch (error) {
      console.error('スタッフ追加エラー:', error)
      alert('スタッフの追加に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setStaffLoading(false)
      console.log('staffLoadingをfalseに設定')
    }
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
          <button
            onClick={() => setSelectedMasterTab('cancel')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedMasterTab === 'cancel'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            キャンセル
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
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">スタッフ</h2>
            <p className="text-gray-600">スタッフの設定を管理します</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>役職管理</CardTitle>
                <Button onClick={() => {
                  setNewPosition({
                    name: '',
                    sort_order: staffPositions.length,
                    enabled: true
                  })
                  setShowAddPosition(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  役職追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPositions.map(position => (
                  <div key={position.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{position.name}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const newName = prompt('新しい役職名を入力してください:', position.name)
                          if (newName && newName.trim()) {
                            handleUpdatePosition(position.id, { name: newName.trim() })
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePosition(position.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {staffPositions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">役職が登録されていません</p>
                    <Button 
                      onClick={() => setShowAddPosition(true)}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      最初の役職を追加
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 役職追加モーダル */}
          {showAddPosition && (
            <Modal
              isOpen={showAddPosition}
              onClose={() => setShowAddPosition(false)}
              title="新しい役職を追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="position_name">役職名</Label>
                  <Input
                    id="position_name"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 歯科医師"
                  />
                </div>
                
                <div>
                  <Label htmlFor="position_sort_order">並び順</Label>
                  <Input
                    id="position_sort_order"
                    type="number"
                    value={newPosition.sort_order}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="position_enabled"
                    checked={newPosition.enabled}
                    onCheckedChange={(checked) => setNewPosition(prev => ({ ...prev, enabled: checked as boolean }))}
                  />
                  <Label htmlFor="position_enabled">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPosition(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddPosition}
                    disabled={saving || !newPosition.name.trim()}
                  >
                    {saving ? '追加中...' : '追加'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ファイルタブのコンテンツ */}
      {selectedMasterTab === 'files' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">患者ノートタイプ</h3>
              <p className="text-sm text-gray-500">患者ノートの分類を管理します</p>
            </div>
            <Button onClick={() => setShowAddNoteType(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {patientNoteTypes.map(noteType => (
              <div key={noteType.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{noteType.name}</div>
                  {noteType.description && (
                    <div className="text-sm text-gray-500">{noteType.description}</div>
                  )}
                  <div className="text-sm text-gray-500">
                    並び順: {noteType.sort_order} | ステータス: {noteType.is_active ? '有効' : '無効'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={noteType.is_active}
                    onChange={(e) => {
                      updatePatientNoteType(DEMO_CLINIC_ID, noteType.id, { is_active: e.target.checked })
                        .then(() => {
                          const data = getPatientNoteTypes(DEMO_CLINIC_ID)
                          data.then(d => setPatientNoteTypes(d))
                        })
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <button className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('このノートタイプを削除しますか？')) {
                        deletePatientNoteType(DEMO_CLINIC_ID, noteType.id)
                          .then(() => {
                            const data = getPatientNoteTypes(DEMO_CLINIC_ID)
                            data.then(d => setPatientNoteTypes(d))
                          })
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {patientNoteTypes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">ノートタイプが登録されていません</p>
              </div>
            )}
          </div>

          {/* ノートタイプ追加モーダル */}
          {showAddNoteType && (
            <Modal
              isOpen={showAddNoteType}
              onClose={() => setShowAddNoteType(false)}
              title="新しいノートタイプを追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note_type_name">ノートタイプ名</Label>
                  <Input
                    id="note_type_name"
                    value={newNoteType.name}
                    onChange={(e) => setNewNoteType(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 診療メモ"
                  />
                </div>
                
                <div>
                  <Label htmlFor="note_type_description">説明</Label>
                  <Input
                    id="note_type_description"
                    value={newNoteType.description}
                    onChange={(e) => setNewNoteType(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="例: 診療内容のメモ"
                  />
                </div>
                
                <div>
                  <Label htmlFor="note_type_sort_order">並び順</Label>
                  <Input
                    id="note_type_sort_order"
                    type="number"
                    value={newNoteType.sort_order}
                    onChange={(e) => setNewNoteType(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="note_type_active"
                    checked={newNoteType.is_active}
                    onCheckedChange={(checked) => setNewNoteType(prev => ({ ...prev, is_active: checked as boolean }))}
                  />
                  <Label htmlFor="note_type_active">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddNoteType(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddNoteType}
                    disabled={saving || !newNoteType.name.trim()}
                  >
                    {saving ? '追加中...' : '追加'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* キャンセルタブのコンテンツ */}
      {selectedMasterTab === 'cancel' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">キャンセル理由</h3>
              <p className="text-sm text-gray-500">予約キャンセル時の理由を管理します</p>
            </div>
            <Button onClick={() => setShowAddCancelReason(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {cancelReasons.map(reason => (
              <div key={reason.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{reason.name}</div>
                  <div className="text-sm text-gray-500">
                    ステータス: {reason.is_active ? '有効' : '無効'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reason.is_active}
                    onChange={(e) => {
                      handleUpdateCancelReason(reason.id, { is_active: e.target.checked })
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleEditCancelReason(reason)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCancelReason(reason.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {cancelReasons.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">キャンセル理由が登録されていません</p>
                <Button 
                  onClick={() => setShowAddCancelReason(true)}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  最初のキャンセル理由を追加
                </Button>
              </div>
            )}
          </div>

          {/* キャンセル理由追加モーダル */}
          {showAddCancelReason && (
            <Modal
              isOpen={showAddCancelReason}
              onClose={() => setShowAddCancelReason(false)}
              title="新しいキャンセル理由を追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cancel_reason_name">キャンセル理由名</Label>
                  <Input
                    id="cancel_reason_name"
                    value={newCancelReason.name}
                    onChange={(e) => setNewCancelReason(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 無断キャンセル"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cancel_reason_active"
                    checked={newCancelReason.is_active}
                    onCheckedChange={(checked) => setNewCancelReason(prev => ({ ...prev, is_active: checked as boolean }))}
                  />
                  <Label htmlFor="cancel_reason_active">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddCancelReason(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddCancelReason}
                    disabled={saving || !newCancelReason.name.trim()}
                  >
                    {saving ? '追加中...' : '追加'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* キャンセル理由編集モーダル */}
          {showEditCancelReason && editingCancelReason && (
            <Modal
              isOpen={showEditCancelReason}
              onClose={() => {
                setShowEditCancelReason(false)
                setEditingCancelReason(null)
              }}
              title="キャンセル理由を編集"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_cancel_reason_name">キャンセル理由名</Label>
                  <Input
                    id="edit_cancel_reason_name"
                    value={editingCancelReason.name}
                    onChange={(e) => {
                      console.log('名前変更:', e.target.value)
                      setEditingCancelReason(prev => prev ? { ...prev, name: e.target.value } : null)
                    }}
                    placeholder="例: 無断キャンセル"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_cancel_reason_active"
                    checked={editingCancelReason.is_active}
                    onCheckedChange={(checked) => setEditingCancelReason(prev => prev ? { ...prev, is_active: checked as boolean } : null)}
                  />
                  <Label htmlFor="edit_cancel_reason_active">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditCancelReason(false)
                      setEditingCancelReason(null)
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleSaveEditCancelReason}
                    disabled={saving || !editingCancelReason.name.trim()}
                  >
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  )

  const renderTreatmentSettings = () => (
    <div className="space-y-6">
      {/* 上部ナビゲーションバー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button 
                onClick={() => setSelectedTab('menu1')}
                className="flex items-center space-x-1 hover:bg-gray-50 p-1.5 rounded transition-colors"
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center ${
                  selectedTab === 'menu1' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <FileText className={`w-4 h-4 ${
                    selectedTab === 'menu1' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                      </div>
                <span className={`font-medium text-xs ${
                  selectedTab === 'menu1' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  メニュー1
                </span>
              </button>
                    </div>
            
            <button 
              onClick={() => setSelectedTab('menu2')}
              className="flex items-center space-x-1 hover:bg-gray-50 p-1.5 rounded transition-colors"
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center ${
                selectedTab === 'menu2' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <FolderOpen className={`w-4 h-4 ${
                  selectedTab === 'menu2' ? 'text-blue-600' : 'text-gray-600'
                }`} />
                  </div>
                <span className={`font-medium text-xs ${
                  selectedTab === 'menu2' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  メニュー2
                </span>
            </button>
            
            <button 
              onClick={() => setSelectedTab('submenu')}
              className="flex items-center space-x-1 hover:bg-gray-50 p-1.5 rounded transition-colors"
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center ${
                selectedTab === 'submenu' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Tag className={`w-4 h-4 ${
                  selectedTab === 'submenu' ? 'text-blue-600' : 'text-gray-600'
                }`} />
              </div>
                <span className={`font-medium text-xs ${
                  selectedTab === 'submenu' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  サブメニュー
                </span>
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="p-4">
          {/* タブに応じたメニュー一覧（階層表示） */}
          <div className="space-y-1">
            {getFilteredTreatmentMenus().length > 0 ? (
              <div className="space-y-1">
                {getFilteredTreatmentMenus().map(menu => (
                  <div key={`root-${menu.id}`}>
                    {renderMenuItem(menu, 0)}
                  </div>
                ))}
                
                {/* メニュー-1を追加ボタン */}
                <div className="ml-4 mt-12">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setNewTreatmentMenu(prev => ({
                        ...prev,
                        level: 1
                      }))
                      setShowTreatmentAddForm(true)
                    }}
                    className="flex items-center space-x-1 text-xs px-2 py-1 h-7"
                  >
                    <Plus className="w-3 h-3" />
                    <span>メニュー1を追加</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {selectedTab === 'menu1' && <FileText className="w-8 h-8 text-gray-400" />}
                  {selectedTab === 'menu2' && <FolderOpen className="w-8 h-8 text-gray-400" />}
                  {selectedTab === 'submenu' && <Tag className="w-8 h-8 text-gray-400" />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedTab === 'menu1' && 'メニュー-1が登録されていません'}
                  {selectedTab === 'menu2' && 'メニュー-2が登録されていません'}
                  {selectedTab === 'submenu' && 'サブメニューが登録されていません'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedTab === 'menu1' && '上部の「メニュー-1を追加」ボタンから新しいメニューを追加してください'}
                  {selectedTab === 'menu2' && '上部の「メニュー-2を追加」ボタンから新しいメニューを追加してください'}
                  {selectedTab === 'submenu' && '上部の「サブメニューを追加」ボタンから新しいメニューを追加してください'}
                </p>
                    <Button
                  onClick={() => {
                    setNewTreatmentMenu(prev => ({
                      ...prev,
                      level: selectedTab === 'menu1' ? 1 : selectedTab === 'menu2' ? 2 : 3
                    }))
                    setShowTreatmentAddForm(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {selectedTab === 'menu1' && 'メニュー-1を追加'}
                  {selectedTab === 'menu2' && 'メニュー-2を追加'}
                  {selectedTab === 'submenu' && 'サブメニューを追加'}
                    </Button>
                  </div>
        )}
      </div>

          {/* メニュー追加モーダル */}
          {showTreatmentAddForm && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                setShowTreatmentAddForm(false)
                setParentMenuForChild(null)
                setNewTreatmentMenu({
                  name: '',
                  level: selectedTab === 'menu1' ? 1 : selectedTab === 'menu2' ? 2 : 3,
                  parent_id: '',
                  standard_duration: 30,
                  color: '#3B82F6',
                  sort_order: 0
                })
              }}
            >
              <div 
                className="bg-white rounded-lg p-6 w-96 max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">
                  {parentMenuForChild ? 
                    `「${parentMenuForChild.name}」の子メニューを追加` : 
                    selectedTab === 'menu1' ? '新しいメニュー-1を追加' :
                    selectedTab === 'menu2' ? '新しいメニュー-2を追加' :
                    '新しいサブメニューを追加'
                  }
                </h3>
                
                <div className="space-y-4">
              <div>
                    <Label htmlFor="modal_menu_name">メニュー名</Label>
                <Input
                      id="modal_menu_name"
                      value={newTreatmentMenu.name}
                      onChange={(e) => setNewTreatmentMenu(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例: 虫歯治療"
                      className="mt-1"
                />
              </div>
                  
              <div>
                    <Label htmlFor="modal_standard_duration">標準時間（分）</Label>
                    <Input
                      id="modal_standard_duration"
                      type="number"
                      value={newTreatmentMenu.standard_duration}
                      onChange={(e) => setNewTreatmentMenu(prev => ({ ...prev, standard_duration: parseInt(e.target.value) }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="modal_menu_color">色</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="modal_menu_color"
                        type="color"
                        value={newTreatmentMenu.color}
                        onChange={(e) => setNewTreatmentMenu(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTreatmentMenu.color}
                        onChange={(e) => setNewTreatmentMenu(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTreatmentAddForm(false)
                      setParentMenuForChild(null)
                      setNewTreatmentMenu({
                        name: '',
                        level: selectedTab === 'menu1' ? 1 : selectedTab === 'menu2' ? 2 : 3,
                        parent_id: '',
                        standard_duration: 30,
                        color: '#3B82F6',
                        sort_order: 0
                      })
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={parentMenuForChild ? handleAddChildMenu : handleAddTreatmentMenu}
                    disabled={saving || !newTreatmentMenu.name}
                  >
                    {saving ? '追加中...' : '追加'}
                  </Button>
              </div>
            </div>
            </div>
          )}

          {/* 編集モーダル */}
          {editingTreatmentMenu && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setEditingTreatmentMenu(null)}
            >
              <div 
                className="bg-white rounded-lg p-6 w-96 max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">メニューを編集</h3>
                
                <div className="space-y-4">
              <div>
                    <Label htmlFor="modal_edit_name">メニュー名</Label>
                <Input
                      id="modal_edit_name"
                      value={editingTreatmentMenu.name}
                      onChange={(e) => setEditingTreatmentMenu((prev: any) => prev ? { ...prev, name: e.target.value } : null)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="modal_edit_duration">標準時間（分）</Label>
                    <Input
                      id="modal_edit_duration"
                  type="number"
                      value={editingTreatmentMenu.standard_duration || 30}
                      onChange={(e) => setEditingTreatmentMenu((prev: any) => prev ? { ...prev, standard_duration: parseInt(e.target.value) } : null)}
                      className="mt-1"
                />
              </div>
                  
              <div>
                    <Label htmlFor="modal_edit_color">色</Label>
                    <div className="flex items-center space-x-2 mt-1">
                <Input
                        id="modal_edit_color"
                  type="color"
                        value={editingTreatmentMenu.color || '#3B82F6'}
                        onChange={(e) => setEditingTreatmentMenu((prev: any) => prev ? { ...prev, color: e.target.value } : null)}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={editingTreatmentMenu.color || '#3B82F6'}
                        onChange={(e) => setEditingTreatmentMenu((prev: any) => prev ? { ...prev, color: e.target.value } : null)}
                        placeholder="#3B82F6"
                        className="flex-1"
                />
              </div>
            </div>
            
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                    onClick={() => setEditingTreatmentMenu(null)}
              >
                キャンセル
              </Button>
              <Button
                    onClick={() => editingTreatmentMenu && handleEditTreatmentMenu(editingTreatmentMenu)}
                    disabled={saving}
                  >
                    {saving ? '保存中...' : '保存'}
              </Button>
            </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // 診療メニュー関連の関数
  const handleAddTreatmentMenu = async () => {
    try {
      setSaving(true)
      
      // 選択されたタブに応じてレベルを設定
      const menuData = {
        ...newTreatmentMenu,
        level: selectedTab === 'menu1' ? 1 : selectedTab === 'menu2' ? 2 : 3,
        parent_id: newTreatmentMenu.parent_id || undefined // 空文字列の場合はundefinedに変換
      }
      
      console.log('メニュー追加開始:', menuData)
      console.log('DEMO_CLINIC_ID:', DEMO_CLINIC_ID)
      
      const result = await createTreatmentMenu(DEMO_CLINIC_ID, menuData)
      console.log('メニュー追加成功:', result)
      
      // データを再読み込み
      const data = await getTreatmentMenus(DEMO_CLINIC_ID)
      setTreatmentMenus(data)
      
      setNewTreatmentMenu({
        name: '',
        level: selectedTab === 'menu1' ? 1 : selectedTab === 'menu2' ? 2 : 3,
        parent_id: '',
        standard_duration: 30,
        color: '#3B82F6',
        sort_order: 0
      })
      setShowTreatmentAddForm(false)
      
      alert('メニューを正常に追加しました')
    } catch (error) {
      console.error('メニュー追加エラー:', error)
      console.error('エラーの詳細:', error)
      alert('メニューの追加に失敗しました: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // 子メニュー作成用の関数
  const handleAddChildMenu = async () => {
    try {
      setSaving(true)
      
      if (!parentMenuForChild) return
      
      // 親メニューのレベルに基づいて子メニューのレベルを決定
      const childLevel = parentMenuForChild.level + 1
      if (childLevel > 3) {
        alert('最大3階層までしか作成できません')
        return
      }
      
      const menuData = {
        ...newTreatmentMenu,
        level: childLevel,
        parent_id: parentMenuForChild.id,
        standard_duration: newTreatmentMenu.standard_duration || 30
      }
      
      console.log('子メニュー追加開始:', menuData)
      
      const result = await createTreatmentMenu(DEMO_CLINIC_ID, menuData)
      console.log('子メニュー追加成功:', result)
      
      // データを再読み込み
      const data = await getTreatmentMenus(DEMO_CLINIC_ID)
      setTreatmentMenus(data)
      
      setNewTreatmentMenu({
        name: '',
        level: childLevel,
        parent_id: '',
        standard_duration: 30,
        color: '#3B82F6',
        sort_order: 0
      })
      setParentMenuForChild(null)
      setShowTreatmentAddForm(false)
      
      alert('子メニューを正常に追加しました')
    } catch (error) {
      console.error('子メニュー追加エラー:', error)
      console.error('エラーの詳細:', error)
      alert('子メニューの追加に失敗しました: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleEditTreatmentMenu = async (menu: any) => {
    try {
      setSaving(true)
      await updateTreatmentMenu(DEMO_CLINIC_ID, menu.id, {
        name: menu.name,
        standard_duration: menu.standard_duration,
        color: menu.color,
        sort_order: menu.sort_order,
        is_active: menu.is_active
      })
      
      // データを再読み込み
      const data = await getTreatmentMenus(DEMO_CLINIC_ID)
      setTreatmentMenus(data)
      setEditingTreatmentMenu(null)
    } catch (error) {
      console.error('メニュー編集エラー:', error)
      alert('メニューの編集に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTreatmentMenu = async (menuId: string) => {
    if (!confirm('このメニューを削除しますか？')) return
    
    try {
      setSaving(true)
      await deleteTreatmentMenu(DEMO_CLINIC_ID, menuId)
      
      // データを再読み込み
      const data = await getTreatmentMenus(DEMO_CLINIC_ID)
      setTreatmentMenus(data)
    } catch (error) {
      console.error('メニュー削除エラー:', error)
      alert('メニューの削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // タブに応じたメニューのフィルタリング（階層構造で表示）
  const getFilteredTreatmentMenus = () => {
    const allMenus = treatmentMenus
    
    // レベル1のメニューを取得し、子メニューを追加
    const buildHierarchy = (menus: any[], parentId: string | null = null): any[] => {
      return menus
        .filter(menu => menu.parent_id === parentId)
        .map(menu => ({
          ...menu,
          children: buildHierarchy(menus, menu.id)
        }))
    }
    
    switch (selectedTab) {
      case 'menu1':
        return buildHierarchy(allMenus, null)
      case 'menu2':
        // レベル1のメニューのみ表示（子メニューも含む）
        return buildHierarchy(allMenus, null)
      case 'submenu':
        // 全てのメニューを階層表示
        return buildHierarchy(allMenus, null)
      default:
        return buildHierarchy(allMenus, null)
    }
  }

  // 展開・収縮のトグル関数
  const toggleMenuExpansion = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(menuId)) {
        newSet.delete(menuId)
      } else {
        newSet.add(menuId)
      }
      return newSet
    })
  }

  // メニューアイテムのレンダリング（階層表示）
  const renderMenuItem = (menu: any, level: number = 0) => {
    const indent = level * 24
    const isParent = menu.children && menu.children.length > 0
    const isExpanded = expandedMenus.has(menu.id)
    
    return (
      <div key={menu.id}>
        <div 
          className="border rounded-lg p-3 mb-1 bg-white"
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 cursor-pointer flex-1"
              onClick={() => isParent && toggleMenuExpansion(menu.id)}
            >
              {isParent && (
                <div className="w-4 h-4 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronRight className="w-3 h-3 rotate-90 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  )}
                </div>
              )}
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: menu.color }}
              />
              <div>
                <div className="font-medium">
                  {menu.name}
                </div>
                <div className="text-sm text-gray-500">
                  {menu.standard_duration}分
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {menu.level < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setParentMenuForChild(menu)
                    setNewTreatmentMenu({
                      name: '',
                      level: menu.level + 1,
                      parent_id: menu.id,
                      standard_duration: 30,
                      color: '#3B82F6',
                      sort_order: 0
                    })
                    setShowTreatmentAddForm(true)
                  }}
                  className="text-green-600 hover:text-green-700"
                  title="子メニューを追加"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingTreatmentMenu(menu)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteTreatmentMenu(menu.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
          </Button>
            </div>
          </div>
        </div>
        
        {/* 子メニューを階層表示（展開時のみ） */}
        {isParent && isExpanded && (
          <div className="ml-4">
            {menu.children.map((child: any) => (
              <div key={`${child.id}-${level + 1}`}>
                {renderMenuItem(child, level + 1)}
              </div>
            ))}
        </div>
      )}
    </div>
  )
  }

  // 患者用URLの生成（問診票専用）
  const getPatientUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${baseUrl}/questionnaire`
  }

  // URLをクリップボードにコピー
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('URLをクリップボードにコピーしました')
    } catch (error) {
      console.error('コピーに失敗しました:', error)
      // フォールバック: テキストエリアを使用
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('URLをクリップボードにコピーしました')
    }
  }

  // 問診票設定のレンダリング
  const renderQuestionnaireSettings = () => {
    return (
      <div className="p-6">
        {/* 患者用URL */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 mr-4">
              <ExternalLink className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800 mr-3">患者用URL:</span>
              <span className="text-xs text-blue-700 font-mono break-all">
                {getPatientUrl()}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(getPatientUrl())}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                <Copy className="w-3 h-3 mr-1" />
                コピー
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getPatientUrl(), '_blank')}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                開く
              </Button>
            </div>
          </div>
        </div>

        {/* 問診票一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">問診票一覧</h3>
              <Button
                onClick={() => setShowQuestionnaireModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                新しい問診票を作成
              </Button>
            </div>

            {questionnaires.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>問診票が登録されていません</p>
                <p className="text-sm">「新しい問診票を作成」ボタンから問診票を追加してください</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questionnaires.map((questionnaire) => (
                  <div
                    key={questionnaire.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="text-lg font-medium text-gray-900 mr-3">
                            {questionnaire.name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            questionnaire.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {questionnaire.is_active ? '有効' : '無効'}
                          </span>
                        </div>
                        {questionnaire.description && (
                          <p className="text-gray-600 text-sm mb-3">{questionnaire.description}</p>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <span>質問数: {questionnaire.questions.length}件</span>
                          <span className="mx-2">•</span>
                          <span>作成日: {new Date(questionnaire.created_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedQuestionnaire(questionnaire)
                            setShowQuestionnaireModal(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('この問診票を削除しますか？')) {
                              handleDeleteQuestionnaire(questionnaire.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          削除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 問診票の削除処理
  const handleDeleteQuestionnaire = async (questionnaireId: string) => {
    try {
      await deleteQuestionnaire(questionnaireId)
      setQuestionnaires(prev => prev.filter(q => q.id !== questionnaireId))
    } catch (error) {
      console.error('問診票削除エラー:', error)
      alert('問診票の削除に失敗しました')
    }
  }

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
        {selectedCategory === 'questionnaire' && renderQuestionnaireSettings()}
        {selectedCategory === 'staff' && (
          <div className="space-y-6">

            {/* タブ */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'staff'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                スタッフ管理
              </button>
              <button
                onClick={() => setActiveTab('units')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'units'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ユニット管理
              </button>
            </div>

            {/* スタッフ管理タブ */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-medium">スタッフ一覧</h3>
                  </div>
                  <Button onClick={() => setShowAddStaff(true)} className="rounded-full w-8 h-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* スタッフ一覧表示（役職別グループ化） */}
                <div className="space-y-6">
                  {(() => {
                    // スタッフを役職別にグループ化
                    const staffByPosition = staff.reduce((groups: { [key: string]: any[] }, member) => {
                      const positionName = member.position?.name || 'その他'
                      if (!groups[positionName]) {
                        groups[positionName] = []
                      }
                      groups[positionName].push(member)
                      return groups
                    }, {})

                    // 役職の並び順を決定（マスタ設定のsort_orderに基づく）
                    const sortedPositions = Object.keys(staffByPosition).sort((a, b) => {
                      const positionA = staffPositions.find(p => p.name === a)
                      const positionB = staffPositions.find(p => p.name === b)
                      const orderA = positionA?.sort_order || 999
                      const orderB = positionB?.sort_order || 999
                      return orderA - orderB
                    })

                    return sortedPositions.map(positionName => (
                      <div key={positionName} className="bg-white rounded-lg border border-gray-200">
                        {/* 役職ヘッダー */}
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h4 className="font-medium text-gray-900">{positionName}</h4>
                          <p className="text-sm text-gray-500">
                            {staffByPosition[positionName].length}名
                          </p>
                        </div>
                        
                        {/* スタッフ一覧 */}
                        <div className="divide-y divide-gray-200">
                          {staffByPosition[positionName].map(member => (
                            <div key={member.id} className="p-4 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  className={`${member.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                  {member.is_active ? '在籍' : '退職'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingStaff(member)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (confirm('このスタッフを削除しますか？')) {
                                      try {
                                        await deleteStaff(DEMO_CLINIC_ID, member.id)
                                        const data = await getStaff(DEMO_CLINIC_ID)
                                        setStaff(data)
                                        // シフト表をリフレッシュ
                                        setRefreshTrigger(prev => prev + 1)
                                      } catch (error) {
                                        console.error('スタッフ削除エラー:', error)
                                      }
                                    }
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                  
                  {/* スタッフが登録されていない場合 */}
                  {staff.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">スタッフが登録されていません</p>
                      <Button 
                        onClick={() => setShowAddStaff(true)}
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        最初のスタッフを追加
                      </Button>
                    </div>
                  )}
                </div>

                {/* スタッフ追加モーダル */}
                <Modal
                  isOpen={showAddStaff}
                  onClose={() => setShowAddStaff(false)}
                  title="新しいスタッフを追加"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="staff_name">名前</Label>
                        <Input
                          id="staff_name"
                          value={newStaff.name}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="例: 田中太郎"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff_name_kana">フリガナ</Label>
                        <Input
                          id="staff_name_kana"
                          value={newStaff.name_kana}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, name_kana: e.target.value }))}
                          placeholder="例: タナカタロウ"
                        />
                      </div>
                    </div>

                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="staff_email">メールアドレス</Label>
                        <Input
                          id="staff_email"
                          type="email"
                          value={newStaff.email}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="例: tanaka@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff_phone">電話番号</Label>
                        <Input
                          id="staff_phone"
                          value={newStaff.phone}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="例: 03-1234-5678"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="staff_position">役職</Label>
                      <Select
                        value={newStaff.position_id}
                        onValueChange={(value) => setNewStaff(prev => ({ ...prev, position_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="役職を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffPositions.map(position => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {staffPositions.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          役職が登録されていません。マスタタブで役職を追加してください。
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddStaff(false)}
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={() => {
                          console.log('追加ボタンがクリックされました')
                          console.log('staffLoading:', staffLoading)
                          console.log('newStaff.name:', newStaff.name)
                          console.log('newStaff.position_id:', newStaff.position_id)
                          console.log('newStaff全体:', newStaff)
                          handleAddStaff()
                        }}
                        disabled={staffLoading || !newStaff.name}
                      >
                        {staffLoading ? '追加中...' : '追加'}
                      </Button>
                    </div>
                  </div>
                </Modal>
              </div>
            )}

            {/* ユニット管理タブ */}
            {activeTab === 'units' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">ユニット管理</h2>
                  <p className="text-gray-600">診療台（ユニット）の設定を管理します</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">ユニット管理機能は今後実装予定です</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {selectedCategory === 'shift' && (
          <div className="space-y-6">
            {/* シフト表 */}
            <ShiftTable 
              clinicId={DEMO_CLINIC_ID} 
              refreshTrigger={refreshTrigger}
            />
            
            {/* 勤務時間パターン管理 */}
            <ShiftPatterns clinicId={DEMO_CLINIC_ID} />
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
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">デフォルトテキスト管理</h2>
              <p className="text-gray-600 mb-6">サブカルテで使用するデフォルトテキストを作成・管理できます</p>
              
              <div className="space-y-4">
                {defaultTexts.map((text) => (
                  <div key={text.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{text.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          作成日: {new Date(text.createdAt).toLocaleDateString('ja-JP')}
                          {text.updatedAt !== text.createdAt && (
                            <span className="ml-2">
                              更新日: {new Date(text.updatedAt).toLocaleDateString('ja-JP')}
                            </span>
                          )}
                        </p>
                        <div className="mt-2 bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                          {text.content}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditDefaultText(text)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDefaultText(text.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {defaultTexts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    デフォルトテキストがありません
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowAddDefaultTextModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新規追加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-full">
        {/* 左サイドバー */}
        <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col">
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
                        ? 'bg-blue-50 text-blue-600' 
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

      {/* 問診票編集モーダル */}
      {selectedQuestionnaire && (
        <QuestionnaireEditModal
          isOpen={showQuestionnaireModal && !!selectedQuestionnaire}
          onClose={() => {
            setShowQuestionnaireModal(false)
            setSelectedQuestionnaire(null)
          }}
          questionnaireId={selectedQuestionnaire.id}
          clinicId={DEMO_CLINIC_ID}
          onSave={(updatedQuestionnaire) => {
            console.log('問診票を保存しました:', updatedQuestionnaire)
            // リストを更新
            setQuestionnaires(prev => 
              prev.map(q => q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q)
            )
            setShowQuestionnaireModal(false)
            setSelectedQuestionnaire(null)
          }}
        />
      )}

      {/* デフォルトテキスト追加・編集モーダル */}
      {showAddDefaultTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingDefaultText ? 'デフォルトテキスト編集' : 'デフォルトテキスト追加'}
              </h3>
              <button
                onClick={() => {
                  setShowAddDefaultTextModal(false)
                  setEditingDefaultText(null)
                  setNewDefaultText({ title: '', content: '' })
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <Input
                  value={newDefaultText.title}
                  onChange={(e) => setNewDefaultText({ ...newDefaultText, title: e.target.value })}
                  placeholder="デフォルトテキストのタイトル"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  内容
                </label>
                <textarea
                  value={newDefaultText.content}
                  onChange={(e) => setNewDefaultText({ ...newDefaultText, content: e.target.value })}
                  placeholder="デフォルトテキストの内容"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDefaultTextModal(false)
                  setEditingDefaultText(null)
                  setNewDefaultText({ title: '', content: '' })
                }}
              >
                キャンセル
              </Button>
              <Button 
                onClick={editingDefaultText ? handleEditDefaultTextSave : handleAddDefaultText}
              >
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}