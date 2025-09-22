// モックモードの設定
export const MOCK_MODE = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

// モックデータ（localStorageで永続化）
const STORAGE_KEYS = {
  PATIENT_NOTE_TYPES: 'mock_patient_note_types',
  STAFF_POSITIONS: 'mock_staff_positions',
  STAFF: 'mock_staff',
  TREATMENT_MENUS: 'mock_treatment_menus',
  SHIFT_PATTERNS: 'mock_shift_patterns',
  STAFF_SHIFTS: 'mock_staff_shifts'
}

// localStorageからデータを読み込む関数
const loadFromStorage = (key: string): any[] => {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error)
    return []
  }
}

// localStorageにデータを保存する関数
const saveToStorage = (key: string, data: any[]) => {
  if (typeof window === 'undefined') return
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

export const getMockTreatmentMenus = () => loadFromStorage(STORAGE_KEYS.TREATMENT_MENUS)
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
  const index = data.findIndex(item => item.id === id)
  if (index !== -1) {
    data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() }
    saveToStorage(PATIENTS_KEY, data)
  }
}
export const removeMockPatient = (id: string) => {
  const data = getMockPatients()
  const filtered = data.filter(item => item.id !== id)
  saveToStorage(PATIENTS_KEY, filtered)
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
  }
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
  cell_height: 40
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
  }
]

// デフォルトのスタッフデータ
const DEFAULT_STAFF = [
  {
    id: 'staff-1',
    clinic_id: '11111111-1111-1111-1111-111111111111',
    name: '福永',
    name_kana: 'フクナガ',
    position_id: 'position-1',
    role: 'doctor',
    is_active: true,
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

// 初期化時にデフォルトデータを設定
export const initializeMockData = () => {
  if (typeof window === 'undefined') return
  
  // 診療メニューが空の場合はデフォルトデータを設定
  const existingMenus = getMockTreatmentMenus()
  if (existingMenus.length === 0) {
    saveToStorage(STORAGE_KEYS.TREATMENT_MENUS, DEFAULT_TREATMENT_MENUS)
  }
  
  // スタッフが空の場合はデフォルトデータを設定
  const existingStaff = getMockStaff()
  if (existingStaff.length === 0) {
    saveToStorage('mock_staff', DEFAULT_STAFF)
  }
  
  // スタッフシフトが空の場合はデフォルトデータを設定
  const existingShifts = getMockStaffShifts()
  if (existingShifts.length === 0) {
    saveToStorage(STORAGE_KEYS.STAFF_SHIFTS, DEFAULT_STAFF_SHIFTS)
  }
}

// 後方互換性のための定数（空配列）
export const MOCK_PATIENT_NOTE_TYPES = []
export const MOCK_STAFF_POSITIONS = []
export const MOCK_STAFF = []
export const MOCK_TREATMENT_MENUS = []
