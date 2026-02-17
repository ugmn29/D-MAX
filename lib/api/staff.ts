// Migrated to Prisma API Routes
import { MOCK_MODE, getMockStaff, addMockStaff, removeMockStaff, updateMockStaff, getMockStaffPositions, initializeMockData } from '@/lib/utils/mock-mode'

export interface Staff {
  id: string
  name: string
  name_kana?: string
  email?: string
  phone?: string
  position_id?: string
  position?: StaffPosition
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  clinic_id: string
}

export interface StaffPosition {
  id: string
  name: string
  sort_order: number
  clinic_id: string
  created_at: string
  updated_at: string
}

export interface CreateStaffData {
  name: string
  name_kana?: string
  email?: string
  phone?: string
  position_id?: string
  role: string
  is_active?: boolean
}

export interface CreateStaffPositionData {
  name: string
  sort_order: number
}

export interface UpdateStaffData {
  name?: string
  name_kana?: string
  email?: string
  phone?: string
  position_id?: string
  role?: string
  is_active?: boolean
}

export interface UpdateStaffPositionData {
  name?: string
  sort_order?: number
}

// スタッフ一覧取得（全スタッフ - 退職者含む）
export async function getAllStaff(clinicId: string): Promise<Staff[]> {
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: 全スタッフデータを返します')

    // モックデータを初期化
    initializeMockData()

    const staffData = getMockStaff().filter(item => item.clinic_id === clinicId)
    const positions = getMockStaffPositions()

    console.log('取得した全スタッフデータ:', staffData)
    console.log('取得した役職データ:', positions)

    // スタッフデータに役職情報を追加
    return staffData.map(staff => ({
      ...staff,
      position: positions.find(pos => pos.id === staff.position_id) || {
        id: staff.position_id || '',
        name: '未設定',
        sort_order: 999
      }
    }))
  }

  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff?clinic_id=${clinicId}&active_only=false`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('全スタッフ取得エラー (API):', errorData)
      throw new Error(errorData.error || '全スタッフ取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('全スタッフ取得エラー:', error)
    throw error
  }
}

// スタッフ一覧取得（アクティブなスタッフのみ）
export async function getStaff(clinicId: string): Promise<Staff[]> {
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: スタッフデータを返します')

    // モックデータを初期化
    initializeMockData()

    const staffData = getMockStaff().filter(item => item.clinic_id === clinicId && item.is_active)
    const positions = getMockStaffPositions()

    console.log('取得したスタッフデータ:', staffData)
    console.log('取得した役職データ:', positions)

    // スタッフデータに役職情報を追加
    return staffData.map(staff => ({
      ...staff,
      position: positions.find(pos => pos.id === staff.position_id) || {
        id: staff.position_id || '',
        name: '未設定',
        sort_order: 999
      }
    }))
  }

  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff?clinic_id=${clinicId}&active_only=true`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('スタッフ取得エラー (API):', errorData)
      throw new Error(errorData.error || 'スタッフ取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ取得エラー:', error)
    throw error
  }
}

// スタッフ作成
export async function createStaff(clinicId: string, data: CreateStaffData): Promise<Staff> {
  // モックモードの場合はモックデータを生成して返す
  if (MOCK_MODE) {
    console.log('モックモード: スタッフを作成します', { clinicId, data })
    const newStaff: Staff = {
      id: `mock-staff-${Date.now()}`,
      clinic_id: clinicId,
      name: data.name,
      name_kana: data.name_kana,
      email: data.email,
      phone: data.phone,
      position_id: data.position_id,
      role: data.role,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    addMockStaff(newStaff)
    return newStaff
  }

  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('スタッフ作成エラー (API):', errorData)
      throw new Error(errorData.error || 'スタッフ作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ作成エラー:', error)
    throw error
  }
}

// スタッフ更新
export async function updateStaff(clinicId: string, staffId: string, data: UpdateStaffData): Promise<Staff> {
  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff/${staffId}?clinic_id=${clinicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('スタッフ更新エラー (API):', errorData)
      throw new Error(errorData.error || 'スタッフ更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ更新エラー:', error)
    throw error
  }
}

// スタッフ削除（論理削除）
export async function deleteStaff(clinicId: string, staffId: string): Promise<void> {
  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff/${staffId}?clinic_id=${clinicId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('スタッフ削除エラー (API):', errorData)
      throw new Error(errorData.error || 'スタッフ削除に失敗しました')
    }
  } catch (error) {
    console.error('スタッフ削除エラー:', error)
    throw error
  }
}

// スタッフ役職一覧取得
export async function getStaffPositions(clinicId: string): Promise<StaffPosition[]> {
  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff-positions?clinic_id=${clinicId}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('スタッフ役職取得エラー (API):', errorData)
      throw new Error(errorData.error || 'スタッフ役職取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ役職取得エラー:', error)
    throw error
  }
}

// スタッフ役職作成
export async function createStaffPosition(clinicId: string, data: CreateStaffPositionData): Promise<StaffPosition> {
  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff-positions?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('スタッフ役職作成エラー (API):', errorData)
      throw new Error(errorData.error || 'スタッフ役職作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ役職作成エラー:', error)
    throw error
  }
}

// スタッフ役職更新
export async function updateStaffPosition(clinicId: string, positionId: string, data: UpdateStaffPositionData): Promise<StaffPosition> {
  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff-positions/${positionId}?clinic_id=${clinicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('スタッフ役職更新エラー (API):', errorData)
      throw new Error(errorData.error || 'スタッフ役職更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ役職更新エラー:', error)
    throw error
  }
}

// スタッフ役職削除
export async function deleteStaffPosition(clinicId: string, positionId: string): Promise<void> {
  // API Route経由でPrismaを使用（サーバーサイド・クライアントサイド両方）
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : '' // クライアントサイドでは相対パスを使用
    const response = await fetch(`${baseUrl}/api/staff-positions/${positionId}?clinic_id=${clinicId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('スタッフ役職削除エラー (API):', errorData)
      throw new Error(errorData.error || 'スタッフ役職削除に失敗しました')
    }
  } catch (error) {
    console.error('スタッフ役職削除エラー:', error)
    throw error
  }
}

// 固定シフトパターンの型定義
export interface WeeklySchedule {
  monday: string | null
  tuesday: string | null
  wednesday: string | null
  thursday: string | null
  friday: string | null
  saturday: string | null
  sunday: string | null
}

// 固定シフトパターンを保存（localStorageに保存）
export function saveStaffWeeklySchedule(clinicId: string, staffId: string, weeklySchedule: WeeklySchedule): void {
  try {
    const key = `staff_weekly_schedule_${clinicId}_${staffId}`
    localStorage.setItem(key, JSON.stringify(weeklySchedule))
    console.log('固定シフトパターンを保存しました:', { staffId, weeklySchedule })
  } catch (error) {
    console.error('固定シフトパターン保存エラー:', error)
    throw error
  }
}

// 固定シフトパターンを取得（localStorageから取得）
export function getStaffWeeklySchedule(clinicId: string, staffId: string): WeeklySchedule | null {
  try {
    const key = `staff_weekly_schedule_${clinicId}_${staffId}`
    const data = localStorage.getItem(key)
    if (!data) return null

    const schedule = JSON.parse(data) as WeeklySchedule
    console.log('固定シフトパターンを取得しました:', { staffId, schedule })
    return schedule
  } catch (error) {
    console.error('固定シフトパターン取得エラー:', error)
    return null
  }
}
