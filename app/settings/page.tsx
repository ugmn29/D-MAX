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
import { Textarea } from '@/components/ui/textarea'
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
  Grid3X3,
  Edit,
  Trash2,
  Plus,
  Clock,
  ChevronRight,
  ChevronLeft,
  Save,
  FolderOpen,
  X,
  Tag,
  Edit3,
  User,
  CheckCircle,
  AlertCircle,
  Heart,
  Zap,
  Receipt,
  Accessibility,
  Frown,
  GripVertical,
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
import { 
  getUnits, 
  createUnit, 
  updateUnit, 
  deleteUnit,
  getStaffUnitPriorities,
  createStaffUnitPriority,
  updateStaffUnitPriorities,
  deleteStaffUnitPriority,
  Unit,
  StaffUnitPriority,
  CreateUnitData,
  UpdateUnitData
} from '@/lib/api/units'

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
  { id: 'treatment_content', name: '診療内容', description: '診療メニューの全階層を表示（大分類/中分類/詳細）' },
  { id: 'staff', name: '担当者', description: '担当者の全階層を表示（主担当者/副担当者1/副担当者2）' }
]


const settingCategories = [
  {
    id: 'clinic',
    name: 'クリニック',
    icon: Building2,
    href: '/settings/clinic'
  },
  {
    id: 'calendar',
    name: 'カレンダー',
    icon: Calendar,
    href: '/settings/calendar'
  },
  {
    id: 'treatment',
    name: '診療メニュー',
    icon: Stethoscope,
    href: '/settings/treatment'
  },
  {
    id: 'questionnaire',
    name: '問診表',
    icon: MessageSquare,
    href: '/settings/questionnaire'
  },
  {
    id: 'staff',
    name: 'スタッフ',
    icon: Users,
    href: '/settings/staff'
  },
  {
    id: 'shift',
    name: 'シフト',
    icon: Clock,
    href: '/settings/shift'
  },
  {
    id: 'web',
    name: 'Web予約',
    icon: Globe,
    href: '/settings/web'
  },
  {
    id: 'notification',
    name: '通知',
    icon: Bell,
    href: '/settings/notification'
  },
  {
    id: 'master',
    name: 'マスタ',
    icon: Database,
    href: '/settings/master'
  },
  {
    id: 'subkarte',
    name: 'サブカルテ',
    icon: BarChart3,
    href: '/settings/subkarte'
  },
  {
    id: 'units',
    name: 'ユニット',
    icon: Grid3X3,
    href: '/settings/units'
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

  // ユニット管理の状態
  const [unitsData, setUnitsData] = useState<any[]>([])
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [unitFormData, setUnitFormData] = useState({
    name: '',
    sort_order: 0,
    is_active: true
  })

  // スタッフユニット優先順位の状態
  const [staffUnitPriorities, setStaffUnitPriorities] = useState<any[]>([])
  const [draggedPriority, setDraggedPriority] = useState<any>(null)
  const [unitsActiveTab, setUnitsActiveTab] = useState<'units' | 'priorities'>('units')

  // ユニット管理の関数
  const loadUnitsData = async () => {
    try {
      const data = await getUnits(DEMO_CLINIC_ID)
      setUnitsData(data)
    } catch (error) {
      console.error('ユニットデータ読み込みエラー:', error)
    }
  }

  const handleAddUnit = () => {
    setEditingUnit(null)
    setUnitFormData({
      name: '',
      sort_order: unitsData.length + 1,
      is_active: true
    })
    setShowUnitModal(true)
  }

  const handleEditUnit = (unit: any) => {
    setEditingUnit(unit)
    setUnitFormData({
      name: unit.name,
      sort_order: unit.sort_order,
      is_active: unit.is_active
    })
    setShowUnitModal(true)
  }

  const handleSaveUnit = async () => {
    try {
      setSaving(true)
      
      if (editingUnit) {
        // 更新
        const updatedUnit = await updateUnit(DEMO_CLINIC_ID, editingUnit.id, unitFormData)
        setUnitsData(unitsData.map(u => u.id === editingUnit.id ? updatedUnit : u))
      } else {
        // 新規作成
        const newUnit = await createUnit(DEMO_CLINIC_ID, unitFormData)
        setUnitsData([...unitsData, newUnit])
      }
      
      setShowUnitModal(false)
    } catch (error) {
      console.error('ユニット保存エラー:', error)
      alert('ユニットの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUnit = async (unit: any) => {
    if (!confirm(`ユニット「${unit.name}」を削除しますか？`)) return
    
    try {
      setSaving(true)
      await deleteUnit(DEMO_CLINIC_ID, unit.id)
      setUnitsData(unitsData.filter(u => u.id !== unit.id))
    } catch (error) {
      console.error('ユニット削除エラー:', error)
      if (error instanceof Error && error.message.includes('予約が存在する')) {
        alert('このユニットに関連する予約が存在するため削除できません')
      } else {
        alert('ユニットの削除に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  // スタッフユニット優先順位の関数
  const loadStaffUnitPriorities = async () => {
    try {
      const priorities = await getStaffUnitPriorities(DEMO_CLINIC_ID)
      setStaffUnitPriorities(priorities)
    } catch (error) {
      console.error('スタッフユニット優先順位読み込みエラー:', error)
    }
  }

  const handleAddStaffToUnit = async (unitId: string, staffId: string) => {
    try {
      // そのユニットの現在の最大優先順位を取得
      const unitPriorities = staffUnitPriorities.filter(p => p.unit_id === unitId)
      const maxPriority = Math.max(0, ...unitPriorities.map(p => p.priority_order))
      
      await createStaffUnitPriority(DEMO_CLINIC_ID, {
        staff_id: staffId,
        unit_id: unitId,
        priority_order: maxPriority + 1,
        is_active: true
      })
      loadStaffUnitPriorities()
    } catch (error) {
      console.error('スタッフ割り当てエラー:', error)
      alert('スタッフの割り当てに失敗しました')
    }
  }

  const handleDeletePriority = async (priorityId: string) => {
    try {
      await deleteStaffUnitPriority(DEMO_CLINIC_ID, priorityId)
      loadStaffUnitPriorities()
    } catch (error) {
      console.error('優先順位削除エラー:', error)
      alert('優先順位の削除に失敗しました')
    }
  }

  // ドラッグ&ドロップ処理
  const handleDragStart = (e: React.DragEvent, priority: any) => {
    setDraggedPriority(priority)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetPriority: any) => {
    e.preventDefault()
    
    if (!draggedPriority || draggedPriority.id === targetPriority.id) {
      setDraggedPriority(null)
      return
    }

    try {
      // 優先順位を再計算
      const priorities = [...staffUnitPriorities]
      const draggedIndex = priorities.findIndex(p => p.id === draggedPriority.id)
      const targetIndex = priorities.findIndex(p => p.id === targetPriority.id)
      
      // 配列を並び替え
      const [draggedItem] = priorities.splice(draggedIndex, 1)
      priorities.splice(targetIndex, 0, draggedItem)
      
      // 新しい優先順位を設定
      const newPriorities = priorities.map((p, index) => ({
        unitId: p.unit_id,
        priorityOrder: index + 1
      }))
      
      await updateStaffUnitPriorities(DEMO_CLINIC_ID, selectedStaff, newPriorities)
      loadStaffUnitPriorities()
    } catch (error) {
      console.error('優先順位更新エラー:', error)
      alert('優先順位の更新に失敗しました')
    } finally {
      setDraggedPriority(null)
    }
  }

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

  // Web予約設定の状態
  const [webSettings, setWebSettings] = useState({
    isEnabled: false,
    reservationPeriod: 30,
    allowCurrentTime: true,
    openAllSlots: false,
    allowStaffSelection: true,
    webPageUrl: '',
    showCancelPolicy: false,
    cancelPolicyText: `◆当院のキャンセルポリシー◆

数ある歯科医院の中から駒沢公園通り　西垣歯科・矯正歯科をお選びいただき誠にありがとうございます。
当クリニックでは患者さま一人一人により良い医療を提供するため、30〜45分の長い治療時間を確保してお待ちしております。尚かつ適切な処置時間を確保するために予約制となっております。

予約時間に遅れての来院は十分な時間が確保できず、予定通りの処置が行えない場合があります。
また、予定時間に遅れが生じる事で、次に来院予定の患者さまに多大なご迷惑をおかけする恐れがありますので、予約時間前の来院にご協力をお願い致します。
止むを得ず遅れる場合や、体調不良などでキャンセルを希望される場合は早めのご連絡をお願い致します。
予約の際には確実に来院できる日にちと時間をご確認下さい。`,
    patientInfoFields: {
      phoneRequired: true,
      phoneEnabled: true,
      emailRequired: false,
      emailEnabled: true
    },
    flow: {
      initialSelection: true,
      menuSelection: true,
      calendarDisplay: true,
      patientInfo: true,
      confirmation: true
    }
  })

  // Web予約メニュー
  const [webBookingMenus, setWebBookingMenus] = useState<any[]>([])

  // Web予約メニュー追加ダイアログ
  const [isAddWebMenuDialogOpen, setIsAddWebMenuDialogOpen] = useState(false)
  const [isEditWebMenuDialogOpen, setIsEditWebMenuDialogOpen] = useState(false)
  const [editingWebMenu, setEditingWebMenu] = useState<any>(null)
  
  // キャンセルポリシー編集ダイアログ
  const [isCancelPolicyDialogOpen, setIsCancelPolicyDialogOpen] = useState(false)
  const [tempCancelPolicyText, setTempCancelPolicyText] = useState('')

  // 患者情報フィールド設定ダイアログ
  const [isPatientInfoFieldsDialogOpen, setIsPatientInfoFieldsDialogOpen] = useState(false)
  const [tempPatientInfoFields, setTempPatientInfoFields] = useState({
    phoneRequired: true,
    phoneEnabled: true,
    emailRequired: false,
    emailEnabled: true
  })
  
  type StaffAssignment = {
    staff_id: string
    priority: number
    is_required: boolean
  }
  
  type BookingStep = {
    id: string
    step_order: number
    start_time: number
    end_time: number
    duration: number
    type: 'serial' | 'parallel'
    description: string
    staff_assignments: StaffAssignment[]
  }
  
  const [newWebMenu, setNewWebMenu] = useState({
    treatment_menu_id: '',
    treatment_menu_level2_id: '',
    treatment_menu_level3_id: '',
    display_name: '',
    duration: 30,
    steps: [] as BookingStep[],
    allow_new_patient: true,
    allow_returning: true
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
  const [useParentColor, setUseParentColor] = useState(true) // 親の色を使用するかどうか
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
    // クリニックタブが選択された場合は、基本情報タブを自動選択
    if (categoryId === 'clinic') {
      setActiveTab('basic')
    }
    // カレンダータブが選択された場合は、基本設定タブを自動選択
    else if (categoryId === 'calendar') {
      setActiveTab('basic')
    }
    // スタッフタブが選択された場合は、スタッフ管理タブを自動選択
    else if (categoryId === 'staff') {
      setActiveTab('staff')
    }
    // シフトタブが選択された場合は、シフト表タブを自動選択
    else if (categoryId === 'shift') {
      setActiveTab('shiftTable')
    }
    // Web予約タブが選択された場合は、基本設定タブを自動選択
    else if (categoryId === 'web') {
      setActiveTab('basic')
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

  // ユニットデータの読み込み
  useEffect(() => {
    if (selectedCategory === 'units') {
      loadUnitsData()
    }
  }, [selectedCategory])

  // スタッフユニット優先順位を読み込み
  useEffect(() => {
    if (selectedCategory === 'units' && unitsActiveTab === 'priorities') {
      loadStaffUnitPriorities()
    }
  }, [selectedCategory, unitsActiveTab])

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

        // カレンダー設定を読み込み
        if (settings.display_items) {
          console.log('displayItems読み込み:', settings.display_items)
          setDisplayItems(settings.display_items)
        }

        if (settings.cell_height) {
          setCellHeight(settings.cell_height)
        }

        if (settings.unit_count) {
          setUnitCount(settings.unit_count)
        }

        if (settings.units) {
          setUnits(settings.units)
        }

        // Web予約設定を読み込み
        if (settings.web_reservation) {
          const webReservationSettings = {
            ...settings.web_reservation,
            // デフォルト値でpatientInfoFieldsを設定
            patientInfoFields: {
              phoneRequired: settings.web_reservation.patientInfoFields?.phoneRequired ?? true,
              phoneEnabled: settings.web_reservation.patientInfoFields?.phoneEnabled ?? true,
              emailRequired: settings.web_reservation.patientInfoFields?.emailRequired ?? false,
              emailEnabled: settings.web_reservation.patientInfoFields?.emailEnabled ?? true
            }
          }
          setWebSettings(webReservationSettings)
          setWebBookingMenus(settings.web_reservation.booking_menus || [])
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

  // 診療メニューのWeb予約設定を更新
  const handleMenuUpdate = async (menuId: string, updates: any) => {
    try {
      await updateTreatmentMenu(DEMO_CLINIC_ID, menuId, updates)
      // ローカル状態を更新
      setTreatmentMenus(prev => prev.map(menu =>
        menu.id === menuId ? { ...menu, ...updates } : menu
      ))
    } catch (error) {
      console.error('診療メニュー更新エラー:', error)
      alert('診療メニューの更新に失敗しました')
    }
  }

  // スタッフ選択の切り替え
  const toggleStaffForMenu = (menuId: string, staffId: string) => {
    const menu = treatmentMenus.find(m => m.id === menuId)
    if (!menu) return

    const currentStaffIds = menu.web_booking_staff_ids || []
    const newStaffIds = currentStaffIds.includes(staffId)
      ? currentStaffIds.filter((id: string) => id !== staffId)
      : [...currentStaffIds, staffId]

    handleMenuUpdate(menuId, { web_booking_staff_ids: newStaffIds })
  }

  // ステップを追加
  const handleAddStep = () => {
    const lastStep = newWebMenu.steps[newWebMenu.steps.length - 1]
    const startTime = lastStep ? lastStep.end_time : 0
    
    const newStep: BookingStep = {
      id: `step_${Date.now()}`,
      step_order: newWebMenu.steps.length + 1,
      start_time: startTime,
      end_time: startTime + 30,
      duration: 30,
      type: 'serial',
      description: '',
      staff_assignments: []
    }
    
    setNewWebMenu(prev => ({
      ...prev,
      steps: [...prev.steps, newStep],
      duration: newStep.end_time
    }))
  }

  // ステップを削除
  const handleRemoveStep = (stepId: string) => {
    const updatedSteps = newWebMenu.steps
      .filter(s => s.id !== stepId)
      .map((step, index) => {
        // ステップ順序を再計算
        let startTime = 0
        if (index > 0) {
          const prevStep = newWebMenu.steps[index - 1]
          startTime = prevStep.type === 'serial' ? prevStep.end_time : prevStep.start_time
        }
        return {
          ...step,
          step_order: index + 1,
          start_time: startTime,
          end_time: startTime + step.duration
        }
      })
    
    const totalDuration = updatedSteps.length > 0 
      ? Math.max(...updatedSteps.map(s => s.end_time))
      : 30
    
    setNewWebMenu(prev => ({
      ...prev,
      steps: updatedSteps,
      duration: totalDuration
    }))
  }

  // ステップの時間を更新
  const handleUpdateStepTime = (stepId: string, endTime: number) => {
    const stepIndex = newWebMenu.steps.findIndex(s => s.id === stepId)
    if (stepIndex === -1) return
    
    const updatedSteps = [...newWebMenu.steps]
    const step = updatedSteps[stepIndex]
    step.end_time = endTime
    step.duration = endTime - step.start_time
    
    // 後続のステップの時間を再計算
    for (let i = stepIndex + 1; i < updatedSteps.length; i++) {
      const prevStep = updatedSteps[i - 1]
      if (prevStep.type === 'serial') {
        updatedSteps[i].start_time = prevStep.end_time
        updatedSteps[i].end_time = updatedSteps[i].start_time + updatedSteps[i].duration
      }
    }
    
    const totalDuration = Math.max(...updatedSteps.map(s => s.end_time))
    
    setNewWebMenu(prev => ({
      ...prev,
      steps: updatedSteps,
      duration: totalDuration
    }))
  }

  // ステップのタイプを変更
  const handleToggleStepType = (stepId: string) => {
    const updatedSteps = newWebMenu.steps.map(step => {
      if (step.id === stepId) {
        return { ...step, type: step.type === 'serial' ? 'parallel' as const : 'serial' as const }
      }
      return step
    })
    
    setNewWebMenu(prev => ({
      ...prev,
      steps: updatedSteps
    }))
  }

  // 担当者を追加
  const handleAddStaffToStep = (stepId: string, staffId: string) => {
    const updatedSteps = newWebMenu.steps.map(step => {
      if (step.id === stepId) {
        const exists = step.staff_assignments.find(sa => sa.staff_id === staffId)
        if (!exists) {
          const newAssignment: StaffAssignment = {
            staff_id: staffId,
            priority: step.staff_assignments.length + 1,
            is_required: step.type === 'parallel'
          }
          return {
            ...step,
            staff_assignments: [...step.staff_assignments, newAssignment]
          }
        }
      }
      return step
    })
    
    setNewWebMenu(prev => ({
      ...prev,
      steps: updatedSteps
    }))
  }

  // 担当者を削除
  const handleRemoveStaffFromStep = (stepId: string, staffId: string) => {
    const updatedSteps = newWebMenu.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          staff_assignments: step.staff_assignments
            .filter(sa => sa.staff_id !== staffId)
            .map((sa, index) => ({ ...sa, priority: index + 1 }))
        }
      }
      return step
    })
    
    setNewWebMenu(prev => ({
      ...prev,
      steps: updatedSteps
    }))
  }

  // 担当者の優先順位を変更
  const handleMoveStaffPriority = (stepId: string, staffId: string, direction: 'up' | 'down') => {
    const updatedSteps = newWebMenu.steps.map(step => {
      if (step.id === stepId) {
        const currentIndex = step.staff_assignments.findIndex(sa => sa.staff_id === staffId)
        if (currentIndex === -1) return step
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
        if (newIndex < 0 || newIndex >= step.staff_assignments.length) return step
        
        const newAssignments = [...step.staff_assignments]
        const temp = newAssignments[currentIndex]
        newAssignments[currentIndex] = newAssignments[newIndex]
        newAssignments[newIndex] = temp
        
        // 優先順位を再設定
        return {
          ...step,
          staff_assignments: newAssignments.map((sa, index) => ({ ...sa, priority: index + 1 }))
        }
      }
      return step
    })
    
    setNewWebMenu(prev => ({
      ...prev,
      steps: updatedSteps
    }))
  }

  // Web予約メニューを追加
  const handleAddWebBookingMenu = () => {
    if (!newWebMenu.treatment_menu_id) {
      alert('診療メニューを選択してください')
      return
    }
    if (newWebMenu.steps.length === 0) {
      alert('少なくとも1つのステップを追加してください')
      return
    }

    // 最終的に選択されたメニューを取得（レベル3 > レベル2 > レベル1の順）
    const selectedMenuId = newWebMenu.treatment_menu_level3_id || newWebMenu.treatment_menu_level2_id || newWebMenu.treatment_menu_id
    const menu = treatmentMenus.find(m => m.id === selectedMenuId)
    if (!menu) return

    // メニュー階層の名前を構築
    const level1Menu = treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_id)
    const level2Menu = newWebMenu.treatment_menu_level2_id ? treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_level2_id) : null
    const level3Menu = newWebMenu.treatment_menu_level3_id ? treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_level3_id) : null
    
    const menuNameParts = [level1Menu?.name, level2Menu?.name, level3Menu?.name].filter(Boolean)
    const fullMenuName = menuNameParts.join(' > ')

    const webMenu = {
      id: `web_${Date.now()}`,
      treatment_menu_id: newWebMenu.treatment_menu_id,
      treatment_menu_level2_id: newWebMenu.treatment_menu_level2_id,
      treatment_menu_level3_id: newWebMenu.treatment_menu_level3_id,
      treatment_menu_name: fullMenuName,
      display_name: newWebMenu.display_name || fullMenuName,
      treatment_menu_color: menu.color,
      duration: newWebMenu.duration,
      steps: newWebMenu.steps,
      allow_new_patient: newWebMenu.allow_new_patient,
      allow_returning: newWebMenu.allow_returning
    }

    setWebBookingMenus([...webBookingMenus, webMenu])
    setIsAddWebMenuDialogOpen(false)
    setNewWebMenu({
      treatment_menu_id: '',
      treatment_menu_level2_id: '',
      treatment_menu_level3_id: '',
      display_name: '',
      duration: 30,
      steps: [],
      allow_new_patient: true,
      allow_returning: true
    })
  }

  // Web予約メニューを削除
  const handleRemoveWebBookingMenu = (id: string) => {
    setWebBookingMenus(webBookingMenus.filter(m => m.id !== id))
  }

  // Web予約メニューを編集開始
  const handleEditWebMenu = (menu: any) => {
    setEditingWebMenu(menu)
    setNewWebMenu({
      treatment_menu_id: menu.treatment_menu_id || '',
      treatment_menu_level2_id: menu.treatment_menu_level2_id || '',
      treatment_menu_level3_id: menu.treatment_menu_level3_id || '',
      display_name: menu.display_name || '',
      duration: menu.duration || 30,
      steps: menu.steps || [],
      allow_new_patient: menu.allow_new_patient !== undefined ? menu.allow_new_patient : true,
      allow_returning: menu.allow_returning !== undefined ? menu.allow_returning : true
    })
    setIsEditWebMenuDialogOpen(true)
  }

  // Web予約メニューの編集を保存
  const handleSaveEditWebMenu = () => {
    if (!editingWebMenu) return
    if (!newWebMenu.treatment_menu_id) {
      alert('診療メニューを選択してください')
      return
    }
    if (newWebMenu.steps.length === 0) {
      alert('少なくとも1つのステップを追加してください')
      return
    }

    // 最終的に選択されたメニューを取得
    const selectedMenuId = newWebMenu.treatment_menu_level3_id || newWebMenu.treatment_menu_level2_id || newWebMenu.treatment_menu_id
    const menu = treatmentMenus.find(m => m.id === selectedMenuId)
    if (!menu) return

    // メニュー階層の名前を構築
    const level1Menu = treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_id)
    const level2Menu = newWebMenu.treatment_menu_level2_id ? treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_level2_id) : null
    const level3Menu = newWebMenu.treatment_menu_level3_id ? treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_level3_id) : null
    
    const menuNameParts = [level1Menu?.name, level2Menu?.name, level3Menu?.name].filter(Boolean)
    const fullMenuName = menuNameParts.join(' > ')

    const updatedMenu = {
      ...editingWebMenu,
      treatment_menu_id: newWebMenu.treatment_menu_id,
      treatment_menu_level2_id: newWebMenu.treatment_menu_level2_id,
      treatment_menu_level3_id: newWebMenu.treatment_menu_level3_id,
      treatment_menu_name: fullMenuName,
      display_name: newWebMenu.display_name || fullMenuName,
      treatment_menu_color: menu.color,
      duration: newWebMenu.duration,
      steps: newWebMenu.steps,
      allow_new_patient: newWebMenu.allow_new_patient,
      allow_returning: newWebMenu.allow_returning
    }

    setWebBookingMenus(webBookingMenus.map(m => m.id === editingWebMenu.id ? updatedMenu : m))
    setIsEditWebMenuDialogOpen(false)
    setEditingWebMenu(null)
    setNewWebMenu({
      treatment_menu_id: '',
      treatment_menu_level2_id: '',
      treatment_menu_level3_id: '',
      display_name: '',
      duration: 30,
      steps: [],
      allow_new_patient: true,
      allow_returning: true
    })
  }

  // キャンセルポリシー編集ダイアログを開く
  const handleOpenCancelPolicyDialog = () => {
    setTempCancelPolicyText(webSettings.cancelPolicyText)
    setIsCancelPolicyDialogOpen(true)
  }

  // キャンセルポリシーを保存
  const handleSaveCancelPolicy = () => {
    setWebSettings(prev => ({
      ...prev,
      cancelPolicyText: tempCancelPolicyText
    }))
    setIsCancelPolicyDialogOpen(false)
  }

  // キャンセルポリシー編集をキャンセル
  const handleCancelPolicyDialogClose = () => {
    setIsCancelPolicyDialogOpen(false)
  }

  // 患者情報フィールド設定ダイアログの関数
  const handleOpenPatientInfoFieldsDialog = () => {
    setTempPatientInfoFields(webSettings.patientInfoFields)
    setIsPatientInfoFieldsDialogOpen(true)
  }

  const handleSavePatientInfoFields = () => {
    setWebSettings(prev => ({
      ...prev,
      patientInfoFields: tempPatientInfoFields
    }))
    setIsPatientInfoFieldsDialogOpen(false)
  }

  const handlePatientInfoFieldsDialogClose = () => {
    setIsPatientInfoFieldsDialogOpen(false)
    setTempPatientInfoFields(webSettings.patientInfoFields)
  }

  // Web予約設定を保存
  const handleSaveWebSettings = async () => {
    try {
      console.log('Web予約設定保存開始')
      console.log('保存するwebSettings:', webSettings)
      console.log('保存するwebBookingMenus:', webBookingMenus)
      
      const settingsToSave = {
        ...webSettings,
        booking_menus: webBookingMenus
      }
      
      console.log('保存データ:', settingsToSave)
      await setClinicSetting(DEMO_CLINIC_ID, 'web_reservation', settingsToSave)
      
      // 保存後にデータを再読み込み
      const reloadedSettings = await getClinicSettings(DEMO_CLINIC_ID)
      console.log('再読み込みした設定:', reloadedSettings)
      
      if (reloadedSettings.web_reservation) {
        setWebSettings(reloadedSettings.web_reservation)
        setWebBookingMenus(reloadedSettings.web_reservation.booking_menus || [])
        console.log('Web予約メニュー再読み込み完了:', reloadedSettings.web_reservation.booking_menus)
      }
      
      alert('Web予約設定を保存しました')
    } catch (error) {
      console.error('Web予約設定保存エラー:', error)
      alert('Web予約設定の保存に失敗しました')
    }
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
    <div className="space-y-6">
      {/* タブ */}
      <div className="flex space-x-0 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            activeTab === 'basic'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          基本情報
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            activeTab === 'hours'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          診療時間
        </button>
      </div>

      {/* クリニック情報タブ */}
      {activeTab === 'basic' && (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
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
      )}

      {/* 診療時間設定タブ */}
      {activeTab === 'hours' && (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-3">
              {WEEKDAYS.map(day => {
                const isHoliday = holidays.includes(day.id)
                const timeSlots = businessHours[day.id]?.timeSlots || []
                
                return (
                  <div key={day.id} className={`flex items-center p-2 rounded-lg border ${
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
      )}
    </div>
  )

  // カレンダー設定コンテンツ
  const renderCalendarSettings = () => (
    <div className="space-y-6">
      {/* タブ */}
      <div className="flex space-x-0 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            activeTab === 'basic'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          基本設定
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            activeTab === 'units'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          ユニット設定
        </button>
        <button
          onClick={() => setActiveTab('display')}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            activeTab === 'display'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          表示設定
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
        </div>
      )}

      {/* ユニット設定タブ */}
      {activeTab === 'units' && (
        <div className="space-y-8">
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
        </div>
      )}

      {/* 表示設定タブ */}
      {activeTab === 'display' && (
        <div className="space-y-8">
          {/* 表示項目 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">表示項目</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {DISPLAY_ITEMS.map(item => (
                  <div key={item.id} className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50">
                    <Checkbox
                      id={item.id}
                      checked={displayItems.includes(item.id)}
                      onCheckedChange={(checked) => 
                        handleDisplayItemChange(item.id, checked as boolean)
                      }
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={item.id} className="text-sm font-medium text-gray-900 cursor-pointer block truncate">
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
                      setParentMenuForChild(null)
                      setUseParentColor(true)
                      setNewTreatmentMenu(prev => ({
                        ...prev,
                        level: 1,
                        color: '#3B82F6'
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
                    setParentMenuForChild(null)
                    setUseParentColor(true)
                    setNewTreatmentMenu(prev => ({
                      ...prev,
                      level: selectedTab === 'menu1' ? 1 : selectedTab === 'menu2' ? 2 : 3,
                      color: '#3B82F6'
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
                setUseParentColor(true)
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
                    {parentMenuForChild && (
                      <div className="flex items-center space-x-2 mt-2 mb-2">
                        <Checkbox
                          id="use_parent_color"
                          checked={useParentColor}
                          onCheckedChange={(checked) => {
                            setUseParentColor(checked as boolean)
                            if (checked && parentMenuForChild) {
                              setNewTreatmentMenu(prev => ({ ...prev, color: parentMenuForChild.color || '#3B82F6' }))
                            }
                          }}
                        />
                        <Label htmlFor="use_parent_color" className="text-sm flex items-center space-x-2 cursor-pointer">
                          <span>親メニューの色を使用</span>
                          {parentMenuForChild.color && (
                            <div
                              className="w-5 h-5 rounded border border-gray-300"
                              style={{ backgroundColor: parentMenuForChild.color }}
                            />
                          )}
                        </Label>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="modal_menu_color"
                        type="color"
                        value={newTreatmentMenu.color}
                        onChange={(e) => {
                          setNewTreatmentMenu(prev => ({ ...prev, color: e.target.value }))
                          setUseParentColor(false)
                        }}
                        disabled={useParentColor && parentMenuForChild}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTreatmentMenu.color}
                        onChange={(e) => {
                          setNewTreatmentMenu(prev => ({ ...prev, color: e.target.value }))
                          setUseParentColor(false)
                        }}
                        disabled={useParentColor && parentMenuForChild}
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
                      setUseParentColor(true)
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
      setUseParentColor(true)
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
      setUseParentColor(true)
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
                  setUseParentColor(true)
                    setNewTreatmentMenu({
                      name: '',
                      level: menu.level + 1,
                      parent_id: menu.id,
                      standard_duration: 30,
                    color: menu.color || '#3B82F6',
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

  // ユニット設定のレンダリング
  const renderUnitsSettings = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ユニット設定</h2>
          <p className="text-gray-600">ユニットの管理とスタッフの優先順位設定</p>
        </div>

        {/* タブ */}
        <div className="flex space-x-0 mb-6 border-b border-gray-200">
          <button
            onClick={() => setUnitsActiveTab('units')}
            className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
              unitsActiveTab === 'units'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Grid3X3 className="w-4 h-4 inline mr-2" />
            ユニット管理
          </button>
          <button
            onClick={() => setUnitsActiveTab('priorities')}
            className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
              unitsActiveTab === 'priorities'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            スタッフ優先順位
          </button>
        </div>

        {/* ユニット管理タブ */}
        {unitsActiveTab === 'units' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {unitsData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      ユニットが登録されていません
                    </div>
                  ) : (
                    unitsData.map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Grid3X3 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{unit.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditUnit(unit)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUnit(unit)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* 新規追加ボタン */}
                  <div className="pt-3">
                    <Button 
                      onClick={() => setShowUnitModal(true)} 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      新規追加
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* スタッフ優先順位タブ */}
        {unitsActiveTab === 'priorities' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>ユニット別スタッフ割り当て</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {unitsData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      ユニットが登録されていません
                    </div>
                  ) : (
                    unitsData.map((unit) => (
                      <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Grid3X3 className="w-4 h-4 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">{unit.name}</h3>
                        </div>
                        
                        {/* このユニットのスタッフ優先順位 */}
                        <div className="space-y-2">
                          {staffUnitPriorities
                            .filter(priority => priority.unit_id === unit.id)
                            .sort((a, b) => a.priority_order - b.priority_order)
                            .map((priority) => (
                              <div
                                key={priority.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, priority)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, priority)}
                                className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:bg-gray-50"
                              >
                                <GripVertical className="w-4 h-4 text-gray-400" />
                                <div className="flex-1">
                                  <div className="font-medium">{priority.staff?.name}</div>
                                  <div className="text-sm text-gray-500">優先順位: {priority.priority_order}</div>
                                </div>
                                <button
                                  onClick={() => handleDeletePriority(priority.id)}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          
                          {/* 未割り当てスタッフ */}
                          <div className="mt-4">
                            <Label className="text-sm font-medium text-gray-700">未割り当てスタッフ</Label>
                            <div className="space-y-2 mt-2">
                              {staff
                                .filter(s => !staffUnitPriorities.some(p => p.unit_id === unit.id && p.staff_id === s.id))
                                .map((staffMember) => (
                                  <div key={staffMember.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="font-medium text-gray-700">{staffMember.name}</div>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddStaffToUnit(unit.id, staffMember.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      追加
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ユニット編集モーダル */}
        {showUnitModal && (
          <Modal isOpen={showUnitModal} onClose={() => setShowUnitModal(false)}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingUnit ? 'ユニット編集' : 'ユニット新規作成'}
                </h3>
                <button
                  onClick={() => setShowUnitModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unit-name">ユニット名</Label>
                  <Input
                    id="unit-name"
                    value={unitFormData.name}
                    onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                    placeholder="ユニット名を入力"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sort-order">並び順</Label>
                  <Input
                    id="sort-order"
                    type="number"
                    value={unitFormData.sort_order}
                    onChange={(e) => setUnitFormData({ ...unitFormData, sort_order: parseInt(e.target.value) || 0 })}
                    placeholder="並び順を入力"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowUnitModal(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSaveUnit} disabled={saving || !unitFormData.name.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    )
  }

  // 問診票設定のレンダリング
  const renderQuestionnaireSettings = () => {
    return (
      <div className="p-6">

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
          <div className="flex items-center space-x-3">
            {selectedCategory === 'questionnaire' && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-800">URL:</span>
                <span className="text-xs text-blue-700 font-mono">
                  {getPatientUrl()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(getPatientUrl())}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100 h-6 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>

        {/* コンテンツ */}
        {selectedCategory === 'clinic' && renderClinicSettings()}
        {selectedCategory === 'calendar' && renderCalendarSettings()}
        {selectedCategory === 'treatment' && renderTreatmentSettings()}
        {selectedCategory === 'questionnaire' && renderQuestionnaireSettings()}
        {selectedCategory === 'units' && renderUnitsSettings()}
        {selectedCategory === 'staff' && (
          <div className="space-y-6">

            {/* タブ */}
            <div className="flex space-x-0 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  activeTab === 'staff'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                スタッフ管理
              </button>
              <button
                onClick={() => setActiveTab('units')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  activeTab === 'units'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
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
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">ユニット管理機能は別ページで実装されています</p>
                    <p className="text-sm mt-2">
                      <a href="/settings/units" className="text-blue-600 hover:text-blue-800 underline">
                        ユニット設定ページへ移動
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {selectedCategory === 'shift' && (
          <div className="space-y-6">
            {/* タブ */}
            <div className="flex space-x-0 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('shiftTable')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  activeTab === 'shiftTable'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                シフト表
              </button>
              <button
                onClick={() => setActiveTab('patterns')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  activeTab === 'patterns'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                パターン
              </button>
            </div>

            {/* シフト表タブ */}
            {activeTab === 'shiftTable' && (
              <div>
            <ShiftTable 
              clinicId={DEMO_CLINIC_ID} 
              refreshTrigger={refreshTrigger}
            />
              </div>
            )}
            
            {/* パターンタブ */}
            {activeTab === 'patterns' && (
              <div>
            <ShiftPatterns clinicId={DEMO_CLINIC_ID} />
              </div>
            )}
          </div>
        )}
        {selectedCategory === 'web' && (
          <div className="space-y-6">
            {/* タブ */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-0 border-b border-gray-200 flex-1">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                    activeTab === 'basic'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  基本設定
                </button>
                <button
                  onClick={() => setActiveTab('flow')}
                  className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                    activeTab === 'flow'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  フロー設定
                </button>
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                    activeTab === 'menu'
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  メニュー設定
                </button>
              </div>
              <Button onClick={handleSaveWebSettings} size="sm" className="ml-4">
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                </div>

            {/* 基本設定タブ */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="is_enabled"
                    checked={webSettings.isEnabled}
                    onCheckedChange={(checked) =>
                      setWebSettings(prev => ({ ...prev, isEnabled: checked as boolean }))
                    }
                  />
                  <Label htmlFor="is_enabled" className="font-medium">
                    Web予約機能を有効にする
                  </Label>
                </div>

                {webSettings.isEnabled && (
                  <>
                    <div>
                      <Label htmlFor="reservation_period">予約可能期間（日）</Label>
                      <Input
                        id="reservation_period"
                        type="number"
                        min="1"
                        max="365"
                        value={webSettings.reservationPeriod}
                        onChange={(e) =>
                          setWebSettings(prev => ({
                            ...prev,
                            reservationPeriod: parseInt(e.target.value) || 30
                          }))
                        }
                        className="max-w-xs"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="allow_current_time"
                        checked={webSettings.allowCurrentTime}
                        onCheckedChange={(checked) =>
                          setWebSettings(prev => ({ ...prev, allowCurrentTime: checked as boolean }))
                        }
                      />
                      <Label htmlFor="allow_current_time">
                        現在時刻・日付以降のみ予約可
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="open_all_slots"
                        checked={webSettings.openAllSlots}
                        onCheckedChange={(checked) =>
                          setWebSettings(prev => ({ ...prev, openAllSlots: checked as boolean }))
                        }
                      />
                      <Label htmlFor="open_all_slots">
                        全空き枠開放
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="allow_staff_selection"
                        checked={webSettings.allowStaffSelection}
                        onCheckedChange={(checked) =>
                          setWebSettings(prev => ({ ...prev, allowStaffSelection: checked as boolean }))
                        }
                      />
                      <Label htmlFor="allow_staff_selection">
                        担当者指定を許可
                      </Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Web予約ページ設定 */}
            <Card>
              <CardHeader>
                <CardTitle>Web予約ページ設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="web_page_url">予約ページURL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="web_page_url"
                      value={typeof window !== 'undefined' ? `${window.location.origin}/web-booking` : '/web-booking'}
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const url = typeof window !== 'undefined' ? `${window.location.origin}/web-booking` : '/web-booking'
                        navigator.clipboard.writeText(url)
                        alert('URLをコピーしました')
                      }}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      コピー
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    患者がアクセスする予約ページのURLです。このURLを患者に共有してください。
                  </p>
                </div>
              </CardContent>
            </Card>
              </div>
            )}

            {/* フロー設定タブ */}
            {activeTab === 'flow' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側: フロー設定 */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>予約フロー設定</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* キャンセルポリシー設定 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_cancel_policy"
                            checked={webSettings.showCancelPolicy}
                            onCheckedChange={(checked) => 
                              setWebSettings(prev => ({
                                ...prev,
                                showCancelPolicy: checked as boolean
                              }))
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="flow_cancel_policy" className="font-medium">
                                キャンセルポリシー表示
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenCancelPolicyDialog}
                                className="p-1 h-auto"
                              >
                                <Edit3 className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* 初診/再診選択 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_initial"
                            checked={webSettings.flow.initialSelection}
                            onCheckedChange={(checked) =>
                              setWebSettings(prev => ({
                                ...prev,
                                flow: { ...prev.flow, initialSelection: checked as boolean }
                              }))
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="flow_initial" className="font-medium">
                              初診/再診選択
                            </Label>
                          </div>
                        </div>

                        {/* 診療メニュー選択 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_menu"
                            checked={webSettings.flow.menuSelection}
                            onCheckedChange={(checked) =>
                              setWebSettings(prev => ({
                                ...prev,
                                flow: { ...prev.flow, menuSelection: checked as boolean }
                              }))
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="flow_menu" className="font-medium">
                              診療メニュー選択
                            </Label>
                          </div>
                        </div>

                        {/* カレンダー表示 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_calendar"
                            checked={webSettings.flow.calendarDisplay}
                            onCheckedChange={(checked) =>
                              setWebSettings(prev => ({
                                ...prev,
                                flow: { ...prev.flow, calendarDisplay: checked as boolean }
                              }))
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="flow_calendar" className="font-medium">
                              カレンダー表示
                            </Label>
                          </div>
                        </div>

                        {/* 患者情報入力 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_patient"
                            checked={webSettings.flow.patientInfo}
                            onCheckedChange={(checked) =>
                              setWebSettings(prev => ({
                                ...prev,
                                flow: { ...prev.flow, patientInfo: checked as boolean }
                              }))
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="flow_patient" className="font-medium">
                                患者情報入力
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenPatientInfoFieldsDialog}
                                className="p-1 h-auto"
                              >
                                <Edit3 className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* 確認・確定 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_confirmation"
                            checked={webSettings.flow.confirmation}
                            onCheckedChange={(checked) =>
                              setWebSettings(prev => ({
                                ...prev,
                                flow: { ...prev.flow, confirmation: checked as boolean }
                              }))
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="flow_confirmation" className="font-medium">
                              確認・確定
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 右側: プレビュー */}
                <div className="space-y-6">
                  <Card className="h-[600px] flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle>プレビュー</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                      {/* 実際のWeb予約ページと全く同じプレビュー */}
                      <div className="min-h-screen bg-gray-50 py-8">
                        <div className="max-w-4xl mx-auto px-4">
                          {/* ヘッダー */}
                          <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Web予約</h1>
                            <p className="text-gray-600">簡単にオンラインで予約できます</p>
                          </div>

                          <div className="max-w-2xl mx-auto space-y-6">
                            {/* キャンセルポリシー表示 */}
                            {webSettings.showCancelPolicy && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>医院からのメッセージ</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {webSettings.cancelPolicyText}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ1: 初診/再診選択 */}
                            {webSettings.flow.initialSelection && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>初診/再診の選択</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                      <button
                                        className="w-full p-4 border-2 border-blue-500 bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <div className="text-left">
                                          <h3 className="font-medium">初診</h3>
                                          <p className="text-sm text-gray-600">初めてご来院される方</p>
                                        </div>
                                      </button>
                                      <button
                                        className="w-full p-4 border-2 border-gray-200 hover:border-blue-300 rounded-lg transition-colors"
                                      >
                                        <div className="text-left">
                                          <h3 className="font-medium">再診</h3>
                                          <p className="text-sm text-gray-600">過去にご来院されたことがある方</p>
                                        </div>
                                      </button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ2: 診療メニュー選択 */}
                            {webSettings.flow.menuSelection && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>診療メニューの選択</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <button className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 shadow-md transition-all text-left">
                                        <div>
                                          <h3 className="font-medium text-gray-900 mb-1">
                                            一般診療
                                          </h3>
                                          <p className="text-sm text-gray-600">
                                            所要時間: 30分
                                          </p>
                                        </div>
                                      </button>
                                      <button className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all text-left">
                                        <div>
                                          <h3 className="font-medium text-gray-900 mb-1">
                                            矯正相談
                                          </h3>
                                          <p className="text-sm text-gray-600">
                                            所要時間: 60分
                                          </p>
                                        </div>
                                      </button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ3: カレンダー表示 */}
                            {webSettings.flow.calendarDisplay && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>日時選択</CardTitle>
                                    <p className="text-sm text-gray-600">
                                      ⭕️をクリックして予約日時を選択してください
                                    </p>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {/* 週ナビゲーション */}
                                    <div className="flex items-center justify-between gap-2">
                                      <Button variant="outline" size="sm" className="px-2 py-1 text-xs shrink-0">
                                        <ChevronLeft className="w-3 h-3 mr-1" />
                                        先週
                                      </Button>
                                      <div className="text-sm font-medium text-center flex-1">
                                        01月15日 - 01月21日
                                      </div>
                                      <Button variant="outline" size="sm" className="px-2 py-1 text-xs shrink-0">
                                        次週
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                      </Button>
                                    </div>

                                    {/* 1週間分のカレンダー */}
                                    <div className="-mx-2 sm:mx-0">
                                      {/* ヘッダー（固定） */}
                                      <div className="overflow-hidden">
                                        <table className="w-full border-collapse text-xs sm:text-sm" style={{ tableLayout: 'fixed' }}>
                                          <colgroup>
                                            <col style={{ width: '40px' }} className="sm:w-16" />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                          </colgroup>
                                          <thead>
                                            <tr>
                                              <th className="border p-1 sm:p-2 bg-gray-50 font-medium">時間</th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                                <div className="text-[10px] sm:text-xs leading-tight">月</div>
                                                <div className="text-[9px] sm:text-xs text-gray-600">01/15</div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                                <div className="text-[10px] sm:text-xs leading-tight">火</div>
                                                <div className="text-[9px] sm:text-xs text-gray-600">01/16</div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                                <div className="text-[10px] sm:text-xs leading-tight">水</div>
                                                <div className="text-[9px] sm:text-xs text-gray-600">01/17</div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                                <div className="text-[10px] sm:text-xs leading-tight">木</div>
                                                <div className="text-[9px] sm:text-xs text-gray-600">01/18</div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                                <div className="text-[10px] sm:text-xs leading-tight">金</div>
                                                <div className="text-[9px] sm:text-xs text-gray-600">01/19</div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                                <div className="text-[10px] sm:text-xs leading-tight">土</div>
                                                <div className="text-[9px] sm:text-xs text-gray-600">01/20</div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                                <div className="text-[10px] sm:text-xs leading-tight">日</div>
                                                <div className="text-[9px] sm:text-xs text-gray-600">01/21</div>
                                              </th>
                                            </tr>
                                          </thead>
                                        </table>
                                      </div>

                                      {/* ボディ（スクロール可能） */}
                                      <div className="overflow-y-auto max-h-96 scrollbar-hide">
                                        <table className="w-full border-collapse text-xs sm:text-sm" style={{ tableLayout: 'fixed' }}>
                                          <colgroup>
                                            <col style={{ width: '40px' }} className="sm:w-16" />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                          </colgroup>
                                          <tbody>
                                            {/* 時間ごとの行を生成 */}
                                            {['9:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(time => (
                                              <tr key={time}>
                                                <td className="border p-0.5 sm:p-1 text-[10px] sm:text-sm text-gray-600 text-center">{time}</td>
                                                <td className="border p-0.5 sm:p-1">
                                                  <button
                                                    className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200"
                                                  >
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                  <button
                                                    className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200"
                                                  >
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                  <button
                                                    className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200"
                                                  >
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                  <button
                                                    className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200"
                                                  >
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                  <button
                                                    className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200"
                                                  >
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                  <button
                                                    className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200"
                                                  >
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                  <button
                                                    className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-red-100 text-red-800"
                                                    disabled
                                                  >
                                                    ❌
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ4: 患者情報入力 */}
                            {webSettings.flow.patientInfo && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>患者情報入力</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className={`grid gap-4 ${webSettings.patientInfoFields.phoneEnabled ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                      <div>
                                        <Label htmlFor="patientName">お名前 *</Label>
                                        <Input
                                          id="patientName"
                                          placeholder="例: 田中太郎"
                                          readOnly
                                        />
                                      </div>
                                      {webSettings.patientInfoFields.phoneEnabled && (
                                        <div>
                                          <Label htmlFor="patientPhone">
                                            電話番号 {webSettings.patientInfoFields.phoneRequired ? '*' : ''}
                                          </Label>
                                          <Input
                                            id="patientPhone"
                                            placeholder="例: 03-1234-5678"
                                            readOnly
                                          />
                                        </div>
                                      )}
                                    </div>
                                    {webSettings.patientInfoFields.emailEnabled && (
                                      <div>
                                        <Label htmlFor="patientEmail">
                                          メールアドレス {webSettings.patientInfoFields.emailRequired ? '*' : ''}
                                        </Label>
                                        <Input
                                          id="patientEmail"
                                          type="email"
                                          placeholder="例: tanaka@example.com"
                                          readOnly
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <Label htmlFor="patientRequest">ご要望・ご相談など（任意）</Label>
                                      <textarea
                                        id="patientRequest"
                                        placeholder="ご要望やご相談がございましたらご記入ください"
                                        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                                        readOnly
                                      />
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ5: 確認・確定 */}
                            {webSettings.flow.confirmation && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>予約内容確認</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">予約日時:</span>
                                        <span>2024-01-15 10:00</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">診療メニュー:</span>
                                        <span>一般診療</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">診療時間:</span>
                                        <span>30分</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">患者名:</span>
                                        <span>田中太郎</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">電話番号:</span>
                                        <span>03-1234-5678</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium">診療種別:</span>
                                        <span>初診</span>
                                      </div>
                                    </div>

                                    <div className="flex justify-center">
                                      <Button size="lg" className="w-full max-w-xs">
                                        予約確定
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* メニュー設定タブ */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
            {/* Web予約メニュー設定 */}
            {webSettings.isEnabled ? (
            <Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Web予約メニュー</CardTitle>
                    </div>
                    <Button onClick={() => setIsAddWebMenuDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      メニューを追加
                    </Button>
                  </div>
              </CardHeader>
              <CardContent>
                  {webBookingMenus.length === 0 ? (
                  <p className="text-sm text-gray-500">
                      Web予約メニューが登録されていません。「メニューを追加」ボタンから追加してください。
                  </p>
                ) : (
                    <div className="space-y-4">
                      {webBookingMenus.map(menu => (
                        <div key={menu.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                          {/* メニュー名とカラー */}
                              <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-6 h-6 rounded"
                                    style={{ backgroundColor: menu.treatment_menu_color || '#bfbfbf' }}
                                  />
                                  <h4 className="font-medium text-lg">{menu.display_name || menu.treatment_menu_name}</h4>
                                </div>
                                {menu.display_name && menu.display_name !== menu.treatment_menu_name && (
                                  <p className="text-xs text-gray-500 ml-9">
                                    元のメニュー: {menu.treatment_menu_name}
                                  </p>
                                )}
                              </div>

                              {/* 診療時間 */}
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className="font-medium">診療時間:</span>
                                <span>{menu.duration}分</span>
                              </div>

                              {/* ステップ情報 */}
                              {menu.steps && menu.steps.length > 0 ? (
                                <div className="space-y-2">
                                  <span className="font-medium text-sm text-gray-700">処置ステップ:</span>
                                  {menu.steps.map((step: any, index: number) => (
                                    <div key={step.id} className="bg-gray-50 p-2 rounded text-sm">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-700">
                                          ステップ{index + 1}: {step.description || '未設定'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {step.start_time}分～{step.end_time}分 ({step.type === 'serial' ? '順番' : '同時'})
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {step.staff_assignments?.map((assignment: any) => {
                                          const s = staff.find(st => st.id === assignment.staff_id)
                                          return s ? (
                                            <span key={assignment.staff_id} className="bg-white px-2 py-0.5 rounded text-xs border">
                                              {s.name}
                                              {step.type === 'serial' && ` (優先度: ${assignment.priority})`}
                                            </span>
                                          ) : null
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  ステップが設定されていません
                                </div>
                              )}

                              {/* 受付可能な患者 */}
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className="font-medium">受付:</span>
                                <span>
                                  {menu.allow_new_patient && menu.allow_returning && '初診・再診'}
                                  {menu.allow_new_patient && !menu.allow_returning && '初診のみ'}
                                  {!menu.allow_new_patient && menu.allow_returning && '再診のみ'}
                                  {!menu.allow_new_patient && !menu.allow_returning && 'なし'}
                                </span>
                              </div>
                            </div>

                            {/* 編集・削除ボタン */}
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditWebMenu(menu)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveWebBookingMenu(menu.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ Web予約機能が無効になっています。基本設定タブで「Web予約機能を有効にする」をチェックしてください。
                </p>
              </div>
            )}
              </div>
            )}

            {/* Web予約メニュー追加ダイアログ */}
            <Modal
              isOpen={isAddWebMenuDialogOpen}
              onClose={() => {
                setIsAddWebMenuDialogOpen(false)
                setNewWebMenu({
                  treatment_menu_id: '',
                  treatment_menu_level2_id: '',
                  treatment_menu_level3_id: '',
                  display_name: '',
                  duration: 30,
                  steps: [],
                  allow_new_patient: true,
                  allow_returning: true
                })
              }}
              title="Web予約メニューを追加"
              size="large"
            >
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 診療メニュー選択（階層的） */}
                <div className="space-y-3">
                  {/* メニュー1選択 */}
                  <div>
                    <Label htmlFor="web_treatment_menu_level1">診療メニュー1</Label>
                    <Select
                      value={newWebMenu.treatment_menu_id}
                      onValueChange={(value) =>
                        setNewWebMenu(prev => ({ 
                          ...prev, 
                          treatment_menu_id: value,
                          treatment_menu_level2_id: '',
                          treatment_menu_level3_id: ''
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="メニュー1を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentMenus.filter(m => m.level === 1).map(menu => (
                          <SelectItem key={menu.id} value={menu.id}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded"
                              style={{ backgroundColor: menu.color || '#bfbfbf' }}
                            />
                              <span>{menu.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                          </div>

                  {/* メニュー2選択（メニュー1が選択されている場合のみ表示） */}
                  {newWebMenu.treatment_menu_id && (() => {
                    const childMenus = treatmentMenus.filter(m => m.parent_id === newWebMenu.treatment_menu_id)
                    return childMenus.length > 0 ? (
                      <div>
                        <Label htmlFor="web_treatment_menu_level2">診療メニュー2（オプション）</Label>
                        <Select
                          value={newWebMenu.treatment_menu_level2_id || undefined}
                          onValueChange={(value) =>
                            setNewWebMenu(prev => ({ 
                              ...prev, 
                              treatment_menu_level2_id: value,
                              treatment_menu_level3_id: ''
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="メニュー2を選択（任意）" />
                          </SelectTrigger>
                          <SelectContent>
                            {childMenus.map(menu => (
                              <SelectItem key={menu.id} value={menu.id}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: menu.color || '#bfbfbf' }}
                                  />
                                  <span>{menu.name}</span>
                          </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null
                  })()}

                  {/* メニュー3選択（メニュー2が選択されている場合のみ表示） */}
                  {newWebMenu.treatment_menu_level2_id && (() => {
                    const childMenus = treatmentMenus.filter(m => m.parent_id === newWebMenu.treatment_menu_level2_id)
                    return childMenus.length > 0 ? (
                              <div>
                        <Label htmlFor="web_treatment_menu_level3">サブメニュー（オプション）</Label>
                        <Select
                          value={newWebMenu.treatment_menu_level3_id || undefined}
                          onValueChange={(value) =>
                            setNewWebMenu(prev => ({ 
                              ...prev, 
                              treatment_menu_level3_id: value
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="サブメニューを選択（任意）" />
                          </SelectTrigger>
                          <SelectContent>
                            {childMenus.map(menu => (
                              <SelectItem key={menu.id} value={menu.id}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: menu.color || '#bfbfbf' }}
                                  />
                                  <span>{menu.name}</span>
                                    </div>
                              </SelectItem>
                                  ))}
                          </SelectContent>
                        </Select>
                                </div>
                    ) : null
                  })()}
                              </div>

                {/* Web予約時の表示名 */}
                {newWebMenu.treatment_menu_id && (
                              <div>
                    <Label htmlFor="web_display_name">Web予約時の表示名</Label>
                                <Input
                      id="web_display_name"
                      value={newWebMenu.display_name}
                                  onChange={(e) =>
                        setNewWebMenu(prev => ({ ...prev, display_name: e.target.value }))
                      }
                      placeholder={(() => {
                        const level1Menu = treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_id)
                        const level2Menu = newWebMenu.treatment_menu_level2_id ? treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_level2_id) : null
                        const level3Menu = newWebMenu.treatment_menu_level3_id ? treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_level3_id) : null
                        const menuNameParts = [level1Menu?.name, level2Menu?.name, level3Menu?.name].filter(Boolean)
                        return menuNameParts.join(' > ') || '例: 初診検査'
                      })()}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      空欄の場合は、選択した診療メニュー名が使用されます
                                </p>
                              </div>
                )}

                {/* 全体の診療時間表示 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">
                    全体の診療時間: {newWebMenu.duration}分
                  </p>
                </div>

                {/* ステップ一覧 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">処置ステップ</Label>
                    <Button 
                      onClick={handleAddStep}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      ステップを追加
                    </Button>
                  </div>

                  {newWebMenu.steps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm">ステップが登録されていません</p>
                      <p className="text-xs mt-1">「ステップを追加」ボタンから処置ステップを追加してください</p>
                    </div>
                  ) : (
                    newWebMenu.steps.map((step, index) => (
                      <div key={step.id}>
                        {/* ステップカード */}
                        <div className="border border-gray-300 rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">ステップ {step.step_order}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStep(step.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* 時間設定 */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                              <Label className="text-xs">開始時間</Label>
                              <Input
                                type="number"
                                value={step.start_time}
                                disabled
                                className="text-sm bg-gray-50"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">終了時間</Label>
                              <Input
                                type="number"
                                value={step.end_time}
                                onChange={(e) => handleUpdateStepTime(step.id, parseInt(e.target.value) || step.start_time)}
                                className="text-sm"
                                min={step.start_time + 5}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">所要時間</Label>
                              <Input
                                type="number"
                                value={step.duration}
                                disabled
                                className="text-sm bg-gray-50"
                              />
                            </div>
                          </div>

                          {/* 処置内容 */}
                          <div className="mb-3">
                            <Label className="text-xs">処置内容</Label>
                            <Input
                              value={step.description}
                              onChange={(e) => {
                                const updatedSteps = newWebMenu.steps.map(s =>
                                  s.id === step.id ? { ...s, description: e.target.value } : s
                                )
                                setNewWebMenu(prev => ({ ...prev, steps: updatedSteps }))
                              }}
                              placeholder="例: 準備・検査"
                              className="text-sm"
                            />
                          </div>

                          {/* 配置タイプ */}
                          <div className="mb-3">
                            <Label className="text-xs mb-2 block">配置タイプ</Label>
                            <div className="flex space-x-4">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={step.type === 'serial'}
                                  onChange={() => handleToggleStepType(step.id)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">順番（直列）</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={step.type === 'parallel'}
                                  onChange={() => handleToggleStepType(step.id)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">同時（並列）</span>
                              </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {step.type === 'serial' 
                                ? '選択した担当者のいずれか1人が自動割り当てされます' 
                                : '選択した全ての担当者が同時に必要です'}
                            </p>
                          </div>

                          {/* 担当者選択 */}
                          <div>
                            <Label className="text-xs mb-2 block">担当者</Label>
                            <div className="border rounded-lg p-3 bg-gray-50">
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {staff.map(s => (
                                  <label key={s.id} className="flex items-center space-x-2 cursor-pointer">
                                    <Checkbox
                                      checked={step.staff_assignments.some(sa => sa.staff_id === s.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          handleAddStaffToStep(step.id, s.id)
                                        } else {
                                          handleRemoveStaffFromStep(step.id, s.id)
                                        }
                                      }}
                                    />
                                    <span className="text-sm">{s.name}</span>
                                  </label>
                                ))}
                              </div>

                              {/* 選択された担当者の優先順位 */}
                              {step.staff_assignments.length > 0 && step.type === 'serial' && (
                                <div className="border-t pt-3 mt-3">
                                  <p className="text-xs font-medium text-gray-700 mb-2">優先順位（上から順に割り当て）</p>
                                  <div className="space-y-1">
                                    {step.staff_assignments.map((assignment, idx) => {
                                      const staffMember = staff.find(s => s.id === assignment.staff_id)
                                      return (
                                        <div key={assignment.staff_id} className="flex items-center justify-between bg-white px-2 py-1 rounded">
                                          <span className="text-sm">
                                            {idx + 1}. {staffMember?.name}
                                          </span>
                                          <div className="flex space-x-1">
                                            <button
                                              onClick={() => handleMoveStaffPriority(step.id, assignment.staff_id, 'up')}
                                              disabled={idx === 0}
                                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                            >
                                              <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                                            </button>
                                            <button
                                              onClick={() => handleMoveStaffPriority(step.id, assignment.staff_id, 'down')}
                                              disabled={idx === step.staff_assignments.length - 1}
                                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                            >
                                              <ChevronRight className="w-3 h-3 rotate-90" />
                                            </button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ステップ間の矢印 */}
                        {index < newWebMenu.steps.length - 1 && (
                          <div className="flex justify-center py-2">
                            {step.type === 'serial' && newWebMenu.steps[index + 1].type === 'serial' && (
                              <div className="text-gray-400">
                                <ChevronRight className="w-5 h-5 rotate-90" />
                                <p className="text-xs">順番</p>
                              </div>
                            )}
                            {step.type === 'parallel' || newWebMenu.steps[index + 1].type === 'parallel' ? (
                              <div className="text-gray-400">
                                <div className="flex items-center">
                                  <ChevronRight className="w-5 h-5 rotate-90" />
                                  <ChevronRight className="w-5 h-5 rotate-[-90deg] -ml-2" />
                                </div>
                                <p className="text-xs text-center">同時</p>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* 受付可能な患者 */}
                <div>
                  <Label className="mb-2 block">受付可能な患者</Label>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                        id="web_menu_allow_new"
                        checked={newWebMenu.allow_new_patient}
                                      onCheckedChange={(checked) =>
                          setNewWebMenu(prev => ({
                            ...prev,
                            allow_new_patient: checked as boolean
                          }))
                                      }
                                    />
                      <Label htmlFor="web_menu_allow_new">初診</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                        id="web_menu_allow_returning"
                        checked={newWebMenu.allow_returning}
                                      onCheckedChange={(checked) =>
                          setNewWebMenu(prev => ({
                            ...prev,
                            allow_returning: checked as boolean
                          }))
                                      }
                                    />
                      <Label htmlFor="web_menu_allow_returning">再診</Label>
                                  </div>
                                </div>
                              </div>

                {/* フッター */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Button variant="outline" onClick={() => {
                    setIsAddWebMenuDialogOpen(false)
                    setNewWebMenu({
                      treatment_menu_id: '',
                      treatment_menu_level2_id: '',
                      treatment_menu_level3_id: '',
                      display_name: '',
                      duration: 30,
                      steps: [],
                      allow_new_patient: true,
                      allow_returning: true
                    })
                  }}>
                    キャンセル
                  </Button>
                  <Button onClick={handleAddWebBookingMenu}>
                    追加
                  </Button>
                </div>
                        </div>
            </Modal>

            {/* Web予約メニュー編集ダイアログ */}
            <Modal
              isOpen={isEditWebMenuDialogOpen}
              onClose={() => {
                setIsEditWebMenuDialogOpen(false)
                setEditingWebMenu(null)
                setNewWebMenu({
                  treatment_menu_id: '',
                  treatment_menu_level2_id: '',
                  treatment_menu_level3_id: '',
                  duration: 30,
                  steps: [],
                  allow_new_patient: true,
                  allow_returning: true
                })
              }}
              title="Web予約メニューを編集"
              size="large"
            >
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 診療メニュー選択（階層的） */}
                <div className="space-y-3">
                  {/* メニュー1選択 */}
                  <div>
                    <Label htmlFor="edit_web_treatment_menu_level1">診療メニュー1</Label>
                    <Select
                      value={newWebMenu.treatment_menu_id}
                      onValueChange={(value) =>
                        setNewWebMenu(prev => ({ 
                          ...prev, 
                          treatment_menu_id: value,
                          treatment_menu_level2_id: '',
                          treatment_menu_level3_id: ''
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="メニュー1を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentMenus.filter(m => m.level === 1).map(menu => (
                          <SelectItem key={menu.id} value={menu.id}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: menu.color || '#bfbfbf' }}
                              />
                              <span>{menu.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* メニュー2選択 */}
                  {newWebMenu.treatment_menu_id && (() => {
                    const childMenus = treatmentMenus.filter(m => m.parent_id === newWebMenu.treatment_menu_id)
                    return childMenus.length > 0 ? (
                      <div>
                        <Label htmlFor="edit_web_treatment_menu_level2">診療メニュー2（オプション）</Label>
                        <Select
                          value={newWebMenu.treatment_menu_level2_id || undefined}
                          onValueChange={(value) =>
                            setNewWebMenu(prev => ({ 
                              ...prev, 
                              treatment_menu_level2_id: value,
                              treatment_menu_level3_id: ''
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="メニュー2を選択（任意）" />
                          </SelectTrigger>
                          <SelectContent>
                            {childMenus.map(menu => (
                              <SelectItem key={menu.id} value={menu.id}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: menu.color || '#bfbfbf' }}
                                  />
                                  <span>{menu.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null
                  })()}

                  {/* メニュー3選択 */}
                  {newWebMenu.treatment_menu_level2_id && (() => {
                    const childMenus = treatmentMenus.filter(m => m.parent_id === newWebMenu.treatment_menu_level2_id)
                    return childMenus.length > 0 ? (
                      <div>
                        <Label htmlFor="edit_web_treatment_menu_level3">サブメニュー（オプション）</Label>
                        <Select
                          value={newWebMenu.treatment_menu_level3_id || undefined}
                          onValueChange={(value) =>
                            setNewWebMenu(prev => ({ 
                              ...prev, 
                              treatment_menu_level3_id: value
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="サブメニューを選択（任意）" />
                          </SelectTrigger>
                          <SelectContent>
                            {childMenus.map(menu => (
                              <SelectItem key={menu.id} value={menu.id}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: menu.color || '#bfbfbf' }}
                                  />
                                  <span>{menu.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null
                  })()}
                </div>

                {/* Web予約時の表示名 */}
                {newWebMenu.treatment_menu_id && (
                  <div>
                    <Label htmlFor="edit_web_display_name">Web予約時の表示名</Label>
                    <Input
                      id="edit_web_display_name"
                      value={newWebMenu.display_name}
                      onChange={(e) =>
                        setNewWebMenu(prev => ({ ...prev, display_name: e.target.value }))
                      }
                      placeholder={(() => {
                        const level1Menu = treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_id)
                        const level2Menu = newWebMenu.treatment_menu_level2_id ? treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_level2_id) : null
                        const level3Menu = newWebMenu.treatment_menu_level3_id ? treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_level3_id) : null
                        const menuNameParts = [level1Menu?.name, level2Menu?.name, level3Menu?.name].filter(Boolean)
                        return menuNameParts.join(' > ') || '例: 初診検査'
                      })()}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      空欄の場合は、選択した診療メニュー名が使用されます
                    </p>
                            </div>
                          )}

                {/* 全体の診療時間表示 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">
                    全体の診療時間: {newWebMenu.duration}分
                  </p>
                        </div>

                {/* ステップ一覧 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">処置ステップ</Label>
                    <Button 
                      onClick={handleAddStep}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      ステップを追加
                    </Button>
                  </div>

                  {newWebMenu.steps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm">ステップが登録されていません</p>
                      <p className="text-xs mt-1">「ステップを追加」ボタンから処置ステップを追加してください</p>
                    </div>
                  ) : (
                    newWebMenu.steps.map((step, index) => (
                      <div key={step.id}>
                        {/* ステップカード */}
                        <div className="border border-gray-300 rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">ステップ {step.step_order}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStep(step.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* 時間設定 */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <Label className="text-xs">開始時間</Label>
                              <Input
                                type="number"
                                value={step.start_time}
                                disabled
                                className="text-sm bg-gray-50"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">終了時間</Label>
                              <Input
                                type="number"
                                value={step.end_time}
                                onChange={(e) => handleUpdateStepTime(step.id, parseInt(e.target.value) || step.start_time)}
                                className="text-sm"
                                min={step.start_time + 5}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">所要時間</Label>
                              <Input
                                type="number"
                                value={step.duration}
                                disabled
                                className="text-sm bg-gray-50"
                              />
                            </div>
                          </div>

                          {/* 処置内容 */}
                          <div className="mb-3">
                            <Label className="text-xs">処置内容</Label>
                            <Input
                              value={step.description}
                              onChange={(e) => {
                                const updatedSteps = newWebMenu.steps.map(s =>
                                  s.id === step.id ? { ...s, description: e.target.value } : s
                                )
                                setNewWebMenu(prev => ({ ...prev, steps: updatedSteps }))
                              }}
                              placeholder="例: 準備・検査"
                              className="text-sm"
                            />
                          </div>

                          {/* 配置タイプ */}
                          <div className="mb-3">
                            <Label className="text-xs mb-2 block">配置タイプ</Label>
                            <div className="flex space-x-4">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={step.type === 'serial'}
                                  onChange={() => handleToggleStepType(step.id)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">順番（直列）</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={step.type === 'parallel'}
                                  onChange={() => handleToggleStepType(step.id)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">同時（並列）</span>
                              </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {step.type === 'serial' 
                                ? '選択した担当者のいずれか1人が自動割り当てされます' 
                                : '選択した全ての担当者が同時に必要です'}
                            </p>
                          </div>

                          {/* 担当者選択 */}
                          <div>
                            <Label className="text-xs mb-2 block">担当者</Label>
                            <div className="border rounded-lg p-3 bg-gray-50">
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {staff.map(s => (
                                  <label key={s.id} className="flex items-center space-x-2 cursor-pointer">
                                    <Checkbox
                                      checked={step.staff_assignments.some(sa => sa.staff_id === s.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          handleAddStaffToStep(step.id, s.id)
                                        } else {
                                          handleRemoveStaffFromStep(step.id, s.id)
                                        }
                                      }}
                                    />
                                    <span className="text-sm">{s.name}</span>
                                  </label>
                                ))}
                              </div>

                              {/* 選択された担当者の優先順位 */}
                              {step.staff_assignments.length > 0 && step.type === 'serial' && (
                                <div className="border-t pt-3 mt-3">
                                  <p className="text-xs font-medium text-gray-700 mb-2">優先順位（上から順に割り当て）</p>
                                  <div className="space-y-1">
                                    {step.staff_assignments.map((assignment, idx) => {
                                      const staffMember = staff.find(s => s.id === assignment.staff_id)
                                      return (
                                        <div key={assignment.staff_id} className="flex items-center justify-between bg-white px-2 py-1 rounded">
                                          <span className="text-sm">
                                            {idx + 1}. {staffMember?.name}
                                          </span>
                                          <div className="flex space-x-1">
                                            <button
                                              onClick={() => handleMoveStaffPriority(step.id, assignment.staff_id, 'up')}
                                              disabled={idx === 0}
                                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                            >
                                              <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                                            </button>
                                            <button
                                              onClick={() => handleMoveStaffPriority(step.id, assignment.staff_id, 'down')}
                                              disabled={idx === step.staff_assignments.length - 1}
                                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                            >
                                              <ChevronRight className="w-3 h-3 rotate-90" />
                                            </button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                    </div>
                  )}
                            </div>
                          </div>
                        </div>

                        {/* ステップ間の矢印 */}
                        {index < newWebMenu.steps.length - 1 && (
                          <div className="flex justify-center py-2">
                            {step.type === 'serial' && newWebMenu.steps[index + 1].type === 'serial' && (
                              <div className="text-gray-400">
                                <ChevronRight className="w-5 h-5 rotate-90" />
                                <p className="text-xs">順番</p>
                              </div>
                            )}
                            {step.type === 'parallel' || newWebMenu.steps[index + 1].type === 'parallel' ? (
                              <div className="text-gray-400">
                                <div className="flex items-center">
                                  <ChevronRight className="w-5 h-5 rotate-90" />
                                  <ChevronRight className="w-5 h-5 rotate-[-90deg] -ml-2" />
                                </div>
                                <p className="text-xs text-center">同時</p>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* 受付可能な患者 */}
                <div>
                  <Label className="mb-2 block">受付可能な患者</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit_web_menu_allow_new"
                        checked={newWebMenu.allow_new_patient}
                        onCheckedChange={(checked) =>
                          setNewWebMenu(prev => ({
                            ...prev,
                            allow_new_patient: checked as boolean
                          }))
                        }
                      />
                      <Label htmlFor="edit_web_menu_allow_new">初診</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit_web_menu_allow_returning"
                        checked={newWebMenu.allow_returning}
                        onCheckedChange={(checked) =>
                          setNewWebMenu(prev => ({
                            ...prev,
                            allow_returning: checked as boolean
                          }))
                        }
                      />
                      <Label htmlFor="edit_web_menu_allow_returning">再診</Label>
                    </div>
                  </div>
                </div>

                {/* フッター */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Button variant="outline" onClick={() => {
                    setIsEditWebMenuDialogOpen(false)
                    setEditingWebMenu(null)
                    setNewWebMenu({
                      treatment_menu_id: '',
                      treatment_menu_level2_id: '',
                      treatment_menu_level3_id: '',
                      display_name: '',
                      duration: 30,
                      steps: [],
                      allow_new_patient: true,
                      allow_returning: true
                    })
                  }}>
                    キャンセル
                  </Button>
                  <Button onClick={handleSaveEditWebMenu}>
                    保存
                  </Button>
                </div>
              </div>
            </Modal>
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

      {/* キャンセルポリシー編集ダイアログ */}
      <Modal
        isOpen={isCancelPolicyDialogOpen}
        onClose={handleCancelPolicyDialogClose}
        title="キャンセルポリシー編集"
        size="large"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="cancel_policy_text">キャンセルポリシーテキスト</Label>
            <Textarea
              id="cancel_policy_text"
              value={tempCancelPolicyText}
              onChange={(e) => setTempCancelPolicyText(e.target.value)}
              rows={12}
              className="mt-2"
              placeholder="キャンセルポリシーの内容を入力してください"
            />
            <p className="text-sm text-gray-500 mt-1">
              患者に表示されるキャンセルポリシーの内容を編集できます
            </p>
          </div>

          {/* フッター */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={handleCancelPolicyDialogClose}>
              キャンセル
            </Button>
            <Button onClick={handleSaveCancelPolicy}>
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* 患者情報フィールド設定モーダル */}
      <Modal
        isOpen={isPatientInfoFieldsDialogOpen}
        onClose={handlePatientInfoFieldsDialogClose}
        title="メールアドレス、電話番号を表示する"
        size="medium"
      >
        <div className="space-y-6">
          {/* 電話番号設定 */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="modal_phone_enabled"
                checked={tempPatientInfoFields.phoneEnabled}
                onCheckedChange={(checked) =>
                  setTempPatientInfoFields(prev => ({
                    ...prev,
                    phoneEnabled: checked as boolean,
                    // 電話番号を無効にする場合は必須も無効にする
                    phoneRequired: checked ? prev.phoneRequired : false
                  }))
                }
              />
              <div>
                <Label htmlFor="modal_phone_enabled" className="font-medium text-base">
                  電話番号
                </Label>
                <p className="text-sm text-gray-500">
                  患者情報入力で電話番号を表示
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="modal_phone_required" className="text-sm font-medium text-gray-600">
                必須
              </Label>
              <Checkbox
                id="modal_phone_required"
                checked={tempPatientInfoFields.phoneRequired}
                disabled={!tempPatientInfoFields.phoneEnabled}
                onCheckedChange={(checked) =>
                  setTempPatientInfoFields(prev => ({
                    ...prev,
                    phoneRequired: checked as boolean
                  }))
                }
              />
            </div>
          </div>

          {/* メールアドレス設定 */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="modal_email_enabled"
                checked={tempPatientInfoFields.emailEnabled}
                onCheckedChange={(checked) =>
                  setTempPatientInfoFields(prev => ({
                    ...prev,
                    emailEnabled: checked as boolean,
                    // メールアドレスを無効にする場合は必須も無効にする
                    emailRequired: checked ? prev.emailRequired : false
                  }))
                }
              />
              <div>
                <Label htmlFor="modal_email_enabled" className="font-medium text-base">
                  メールアドレス
                </Label>
                <p className="text-sm text-gray-500">
                  患者情報入力でメールアドレスを表示
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="modal_email_required" className="text-sm font-medium text-gray-600">
                必須
              </Label>
              <Checkbox
                id="modal_email_required"
                checked={tempPatientInfoFields.emailRequired}
                disabled={!tempPatientInfoFields.emailEnabled}
                onCheckedChange={(checked) =>
                  setTempPatientInfoFields(prev => ({
                    ...prev,
                    emailRequired: checked as boolean
                  }))
                }
              />
            </div>
          </div>

          {/* プレビュー */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">プレビュー</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">お名前 *</Label>
                <div className="w-full h-8 border border-gray-300 rounded px-3 bg-gray-50 flex items-center text-gray-500 text-sm">
                  例: 田中太郎
                </div>
              </div>
              {tempPatientInfoFields.phoneEnabled && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号 {tempPatientInfoFields.phoneRequired ? '*' : ''}
                  </Label>
                  <div className="w-full h-8 border border-gray-300 rounded px-3 bg-gray-50 flex items-center text-gray-500 text-sm">
                    例: 03-1234-5678
                  </div>
                </div>
              )}
              {tempPatientInfoFields.emailEnabled && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス {tempPatientInfoFields.emailRequired ? '*' : ''}
                  </Label>
                  <div className="w-full h-8 border border-gray-300 rounded px-3 bg-gray-50 flex items-center text-gray-500 text-sm">
                    例: tanaka@example.com
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* フッター */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={handlePatientInfoFieldsDialogClose}>
              キャンセル
            </Button>
            <Button onClick={handleSavePatientInfoFields}>
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}