// モックモードの設定
// 環境変数 USE_DATABASE=true でデータベース使用を強制
// デフォルトは開発環境ではモック、本番環境ではデータベース
// 一時的にデータベースを使用する場合は false に設定
export const MOCK_MODE = true // process.env.USE_DATABASE === 'true' ? false : process.env.NODE_ENV === 'development'

// 問診票のみデータベースを使用するフラグ
export const USE_DATABASE_FOR_QUESTIONNAIRES = process.env.USE_DATABASE_QUESTIONNAIRES === 'true'

// モックデータ（localStorageで永続化）
const STORAGE_KEYS = {
  PATIENT_NOTE_TYPES: 'mock_patient_note_types',
  STAFF_POSITIONS: 'mock_staff_positions',
  STAFF: 'mock_staff',
  TREATMENT_MENUS: 'mock_treatment_menus',
  SHIFT_PATTERNS: 'mock_shift_patterns',
  STAFF_SHIFTS: 'mock_staff_shifts',
  STAFF_UNIT_PRIORITIES: 'mock_staff_unit_priorities',
  UNITS: 'mock_units'
}

// サーバーサイド用のメモリストレージ
const serverMemoryStorage: Record<string, any[]> = {}

// localStorageからデータを読み込む関数
const loadFromStorage = (key: string): any[] => {
  if (typeof window === 'undefined') {
    // サーバーサイドではメモリストレージを使用
    return serverMemoryStorage[key] || []
  }
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error)
    return []
  }
}

// localStorageからデータを読み込む関数（デフォルト値付き）
const getFromStorage = (key: string, defaultValue: any[] = []): any[] => {
  if (typeof window === 'undefined') {
    // サーバーサイドではメモリストレージを使用
    return serverMemoryStorage[key] || defaultValue
  }
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error)
    return defaultValue
  }
}

// localStorageにデータを保存する関数
export const saveToStorage = (key: string, data: any[]) => {
  if (typeof window === 'undefined') {
    // サーバーサイドではメモリストレージを使用
    serverMemoryStorage[key] = data
    return
  }
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error)
  }
}

// モックデータの管理関数
export const getMockPatientNoteTypes = () => loadFromStorage(STORAGE_KEYS.PATIENT_NOTE_TYPES)
export const addMockPatientNoteType = (item: any) => {
  const data = getMockPatientNoteTypes()
  data.push(item)
  saveToStorage(STORAGE_KEYS.PATIENT_NOTE_TYPES, data)
  return item
}

export const getMockStaffPositions = () => loadFromStorage(STORAGE_KEYS.STAFF_POSITIONS)
export const addMockStaffPosition = (item: any) => {
  const data = getMockStaffPositions()
  data.push(item)
  saveToStorage(STORAGE_KEYS.STAFF_POSITIONS, data)
  return item
}

export const getMockStaff = () => loadFromStorage(STORAGE_KEYS.STAFF)
export const addMockStaff = (item: any) => {
  const data = getMockStaff()
  data.push(item)
  saveToStorage(STORAGE_KEYS.STAFF, data)
  return item
}

export const getMockTreatmentMenus = () => {
  const data = loadFromStorage(STORAGE_KEYS.TREATMENT_MENUS)
  console.log('getMockTreatmentMenus: 取得したデータ数', data.length)
  console.log('getMockTreatmentMenus: 取得したデータ', data)
  return data
}
export const addMockTreatmentMenu = (item: any) => {
  const data = getMockTreatmentMenus()
  data.push(item)
  saveToStorage(STORAGE_KEYS.TREATMENT_MENUS, data)
  return item
}

// データを削除する関数
export const removeMockStaffPosition = (id: string) => {
  const data = getMockStaffPositions()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(STORAGE_KEYS.STAFF_POSITIONS, filtered)
}

export const removeMockStaff = (id: string) => {
  const data = getMockStaff()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(STORAGE_KEYS.STAFF, filtered)
}

export const removeMockPatientNoteType = (id: string) => {
  const data = getMockPatientNoteTypes()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(STORAGE_KEYS.PATIENT_NOTE_TYPES, filtered)
}

export const removeMockTreatmentMenu = (id: string) => {
  const data = getMockTreatmentMenus()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(STORAGE_KEYS.TREATMENT_MENUS, filtered)
}

// データを更新する関数
export const updateMockStaffPosition = (id: string, updates: any) => {
  const data = getMockStaffPositions()
  const index = data.findIndex(item => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() }
    saveToStorage(STORAGE_KEYS.STAFF_POSITIONS, data)
  }
}

export const updateMockStaff = (id: string, updates: any) => {
  const data = getMockStaff()
  const index = data.findIndex(item => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() }
    saveToStorage(STORAGE_KEYS.STAFF, data)
  }
}

// シフトパターンの管理関数
export const getMockShiftPatterns = () => loadFromStorage(STORAGE_KEYS.SHIFT_PATTERNS)
export const addMockShiftPattern = (item: any) => {
  const data = getMockShiftPatterns()
  data.push(item)
  saveToStorage(STORAGE_KEYS.SHIFT_PATTERNS, data)
  return item
}
export const updateMockShiftPattern = (id: string, updates: any) => {
  const data = getMockShiftPatterns()
  const index = data.findIndex(item => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() }
    saveToStorage(STORAGE_KEYS.SHIFT_PATTERNS, data)
  }
}
export const removeMockShiftPattern = (id: string) => {
  const data = getMockShiftPatterns()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(STORAGE_KEYS.SHIFT_PATTERNS, filtered)
}

// スタッフシフトの管理関数
export const getMockStaffShifts = () => loadFromStorage(STORAGE_KEYS.STAFF_SHIFTS)
export const addMockStaffShift = (item: any) => {
  const data = getMockStaffShifts()
  data.push(item)
  saveToStorage(STORAGE_KEYS.STAFF_SHIFTS, data)
  return item
}
export const removeMockStaffShift = (id: string) => {
  const data = getMockStaffShifts()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(STORAGE_KEYS.STAFF_SHIFTS, filtered)
}

// スタッフユニット優先順位の管理関数
export const getMockStaffUnitPriorities = () => loadFromStorage(STORAGE_KEYS.STAFF_UNIT_PRIORITIES)
export const addMockStaffUnitPriority = (item: any) => {
  const data = getMockStaffUnitPriorities()
  data.push(item)
  saveToStorage(STORAGE_KEYS.STAFF_UNIT_PRIORITIES, data)
  return item
}
export const removeMockStaffUnitPriority = (id: string) => {
  const data = getMockStaffUnitPriorities()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(STORAGE_KEYS.STAFF_UNIT_PRIORITIES, filtered)
}

// デフォルトユニットデータ
const DEFAULT_UNITS = [
  {
    id: '1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: 'ユニット1',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: 'ユニット2',
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: 'ユニット3',
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// ユニットの管理関数
export const getMockUnits = () => loadFromStorage(STORAGE_KEYS.UNITS)
export const addMockUnit = (item: any) => {
  const data = getMockUnits()
  data.push(item)
  saveToStorage(STORAGE_KEYS.UNITS, data)
  return item
}
export const updateMockUnit = (id: string, updates: any) => {
  const data = getMockUnits()
  const updatedData = data.map(item => 
    item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
  )
  saveToStorage(STORAGE_KEYS.UNITS, updatedData)
  return updatedData.find(item => item.id === id)
}
export const removeMockUnit = (id: string) => {
  const data = getMockUnits()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(STORAGE_KEYS.UNITS, filtered)
}

// 患者の管理関数
const PATIENTS_KEY = 'mock_patients'

export const getMockPatients = () => loadFromStorage(PATIENTS_KEY)
export const addMockPatient = (item: any) => {
  const data = getMockPatients()
  data.push(item)
  saveToStorage(PATIENTS_KEY, data)
  return item
}
export const updateMockPatient = (id: string, updates: any) => {
  const data = getMockPatients()
  console.log('updateMockPatient: 検索対象ID:', id)
  console.log('updateMockPatient: 既存患者IDリスト:', data.map(p => p.id))
  const index = data.findIndex(item => item.id === id)
  console.log('updateMockPatient: 見つかったindex:', index)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() }
    saveToStorage(PATIENTS_KEY, data)
    console.log('updateMockPatient: 更新成功:', data[index])
    return data[index]
  }
  console.log('updateMockPatient: 患者が見つかりませんでした')
  return null
}
export const removeMockPatient = (id: string) => {
  const data = getMockPatients()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(PATIENTS_KEY, filtered)
}

// 問診表の管理関数
const QUESTIONNAIRES_KEY = 'mock_questionnaires'

export const getMockQuestionnaires = () => loadFromStorage(QUESTIONNAIRES_KEY)
export const addMockQuestionnaire = (item: any) => {
  const data = getMockQuestionnaires()
  data.push(item)
  saveToStorage(QUESTIONNAIRES_KEY, data)
  return item
}
export const updateMockQuestionnaire = (id: string, updates: any) => {
  const data = getMockQuestionnaires()
  const index = data.findIndex(item => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() }
    saveToStorage(QUESTIONNAIRES_KEY, data)
    return data[index]
  }
  return null
}
export const removeMockQuestionnaire = (id: string) => {
  const data = getMockQuestionnaires()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(QUESTIONNAIRES_KEY, filtered)
}

// 予約の管理関数
const APPOINTMENTS_KEY = 'mock_appointments'

export const getMockAppointments = () => loadFromStorage(APPOINTMENTS_KEY)
export const addMockAppointment = (item: any) => {
  const data = getMockAppointments()
  data.push(item)
  saveToStorage(APPOINTMENTS_KEY, data)
  return item
}
export const updateMockAppointment = (id: string, updates: any) => {
  const data = getMockAppointments()
  const index = data.findIndex(item => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() }
    saveToStorage(APPOINTMENTS_KEY, data)
    return data[index] // 更新されたアイテムを返す
  }
  return null // 見つからない場合はnullを返す
}
export const removeMockAppointment = (id: string) => {
  const data = getMockAppointments()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(APPOINTMENTS_KEY, filtered)
}

// モックデータ
export const MOCK_CLINIC_SETTINGS = {
  time_slot_minutes: 15,
  display_items: [],
  cell_height: 40,
  cancel_types: ['no_show', 'advance_notice', 'same_day', 'clinic_reason'],
  penalty_settings: {
    noShowThreshold: 3,
    webReservationLimit: true,
    penaltyPeriod: 30
  }
}

// デフォルトの診療メニューデータ
const DEFAULT_TREATMENT_MENUS = [
  {
    id: 'menu-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '初診',
    level: 1,
    parent_id: null,
    color: '#3B82F6',
    standard_duration: 30,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'menu-1-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '一般初診',
    level: 2,
    parent_id: 'menu-1',
    color: '#3B82F6',
    standard_duration: 30,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'menu-1-2',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '緊急初診',
    level: 2,
    parent_id: 'menu-1',
    color: '#3B82F6',
    standard_duration: 45,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'menu-2',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '定期健診',
    level: 1,
    parent_id: null,
    color: '#10B981',
    standard_duration: 30,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'menu-2-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '一般健診',
    level: 2,
    parent_id: 'menu-2',
    color: '#10B981',
    standard_duration: 30,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'menu-2-2',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '精密健診',
    level: 2,
    parent_id: 'menu-2',
    color: '#10B981',
    standard_duration: 60,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'menu-3',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '治療',
    level: 1,
    parent_id: null,
    color: '#F59E0B',
    standard_duration: 60,
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'menu-3-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '虫歯治療',
    level: 2,
    parent_id: 'menu-3',
    color: '#F59E0B',
    standard_duration: 60,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'menu-3-2',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '歯周病治療',
    level: 2,
    parent_id: 'menu-3',
    color: '#F59E0B',
    standard_duration: 60,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'menu-3-3',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '歯が痛い',
    level: 2,
    parent_id: 'menu-3',
    color: '#F59E0B',
    standard_duration: 30,
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// デフォルトのスタッフデータ
const DEFAULT_STAFF = [
  {
    id: 'staff-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '田中太郎',
    name_kana: 'タナカタロウ',
    position_id: 'position-1',
    role: 'doctor',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'staff-2',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '佐藤花子',
    name_kana: 'サトウハナコ',
    position_id: 'position-2',
    role: 'hygienist',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'staff-3',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '山田次郎',
    name_kana: 'ヤマダジロウ',
    position_id: 'position-3',
    role: 'staff',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// デフォルトのスタッフ役職データ
const DEFAULT_STAFF_POSITIONS = [
  {
    id: 'position-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '歯科医師',
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'position-2',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '歯科衛生士',
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'position-3',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '受付',
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// デフォルトのスタッフシフトデータ
const DEFAULT_STAFF_SHIFTS = [
  {
    id: 'shift-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    staff_id: 'staff-1',
    date: new Date().toISOString().split('T')[0], // 今日の日付
    shift_pattern_id: 'pattern-1',
    start_time: '09:00',
    end_time: '18:00',
    break_start: '12:00',
    break_end: '13:00',
    memo: '',
    is_holiday: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// キャンセル理由のデフォルトデータ
const DEFAULT_CANCEL_REASONS = [
  {
    id: 'cancel-reason-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '無断キャンセル',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cancel-reason-2',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '事前キャンセル',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cancel-reason-3',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '当日キャンセル',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cancel-reason-4',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '医院都合',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// キャンセル理由を取得
export const getMockCancelReasons = () => {
  console.log('getMockCancelReasons: 呼び出し')
  const reasons = getFromStorage('mock_cancel_reasons', DEFAULT_CANCEL_REASONS)
  console.log('getMockCancelReasons: 取得した理由:', reasons)
  console.log('getMockCancelReasons: 理由の数:', reasons.length)
  return reasons
}

// 初期化時にデフォルトデータを設定
export const initializeMockData = () => {
  console.log('モックデータ初期化: 開始', { window: typeof window })
  
  if (typeof window === 'undefined') {
    console.log('モックデータ初期化: windowがundefinedのためスキップ')
    return
  }
  
  console.log('モックデータを初期化中...')
  
  // 強制的に診療メニューデータを初期化（デバッグ用）
  console.log('モックデータ初期化: 診療メニューデータを強制初期化します', DEFAULT_TREATMENT_MENUS.length, '個のメニュー')
  saveToStorage(STORAGE_KEYS.TREATMENT_MENUS, DEFAULT_TREATMENT_MENUS)
  console.log('診療メニューデータを強制初期化しました')
  
  // 初期化後の確認
  const afterInit = getMockTreatmentMenus()
  console.log('モックデータ初期化: 初期化後の診療メニュー数', afterInit.length)
  console.log('モックデータ初期化: 初期化後の診療メニュー', afterInit)
  
  // スタッフ役職が空の場合はデフォルトデータを設定
  const existingPositions = getMockStaffPositions()
  if (existingPositions.length === 0) {
    saveToStorage(STORAGE_KEYS.STAFF_POSITIONS, DEFAULT_STAFF_POSITIONS)
    console.log('スタッフ役職データを初期化しました')
  }
  
  // スタッフが空の場合はデフォルトデータを設定
  const existingStaff = getMockStaff()
  if (existingStaff.length === 0) {
    saveToStorage(STORAGE_KEYS.STAFF, DEFAULT_STAFF)
    console.log('スタッフデータを初期化しました')
  }
  
  // ユニットが空の場合はデフォルトデータを設定
  const existingUnits = getMockUnits()
  if (existingUnits.length === 0) {
    saveToStorage(STORAGE_KEYS.UNITS, DEFAULT_UNITS)
    console.log('ユニットデータを初期化しました')
  }
  
  // スタッフシフトが空の場合はデフォルトデータを設定
  const existingShifts = getMockStaffShifts()
  if (existingShifts.length === 0) {
    saveToStorage(STORAGE_KEYS.STAFF_SHIFTS, DEFAULT_STAFF_SHIFTS)
    console.log('スタッフシフトデータを初期化しました')
  }
  
  // キャンセル理由が空の場合はデフォルトデータを設定
  const existingCancelReasons = getMockCancelReasons()
  if (existingCancelReasons.length === 0) {
    saveToStorage('mock_cancel_reasons', DEFAULT_CANCEL_REASONS)
    console.log('キャンセル理由データを初期化しました')
  }
  
  console.log('モックデータの初期化が完了しました')
}

// 後方互換性のための定数（空配列）
export const MOCK_PATIENT_NOTE_TYPES = []
export const MOCK_STAFF_POSITIONS = []
export const MOCK_STAFF = []
export const MOCK_TREATMENT_MENUS = []
