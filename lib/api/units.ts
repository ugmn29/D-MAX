import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { MOCK_MODE, initializeMockData, getMockStaffUnitPriorities, addMockStaffUnitPriority, removeMockStaffUnitPriority, getMockUnits, addMockUnit, updateMockUnit, removeMockUnit } from '@/lib/utils/mock-mode'

export interface Unit {
  id: string
  clinic_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface StaffUnitPriority {
  id: string
  clinic_id: string
  staff_id: string
  unit_id: string
  priority_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  staff?: {
    id: string
    name: string
  }
  unit?: {
    id: string
    name: string
  }
}

export interface CreateUnitData {
  name: string
  sort_order?: number
  is_active?: boolean
}

export interface UpdateUnitData {
  name?: string
  sort_order?: number
  is_active?: boolean
}

export interface CreateStaffUnitPriorityData {
  staff_id: string
  unit_id: string
  priority_order: number
  is_active?: boolean
}

export interface UpdateStaffUnitPriorityData {
  priority_order?: number
  is_active?: boolean
}

// ユニット一覧取得
export async function getUnits(clinicId: string): Promise<Unit[]> {
  if (MOCK_MODE) {
    console.log('モックモード: ユニット一覧を取得します', { clinicId })
    const units = getMockUnits()
    return units.filter(unit => unit.clinic_id === clinicId)
  }

  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('units')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order')

    if (error) {
      console.error('ユニット取得エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('ユニット取得エラー:', error)
    return []
  }
}

// ユニット作成
export async function createUnit(clinicId: string, data: CreateUnitData): Promise<Unit> {
  if (MOCK_MODE) {
    console.log('モックモード: ユニットを作成します', { clinicId, data })
    const newUnit: Unit = {
      id: `mock-unit-${Date.now()}`,
      clinic_id: clinicId,
      name: data.name,
      sort_order: data.sort_order || 999,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    return addMockUnit(newUnit)
  }

  try {
    const client = getSupabaseClient()
    const { data: newUnit, error } = await client
      .from('units')
      .insert({
        ...data,
        clinic_id: clinicId,
        is_active: data.is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('ユニット作成エラー:', error)
      throw error
    }

    return newUnit
  } catch (error) {
    console.error('ユニット作成エラー:', error)
    throw error
  }
}

// ユニット更新
export async function updateUnit(clinicId: string, unitId: string, data: UpdateUnitData): Promise<Unit> {
  if (MOCK_MODE) {
    console.log('モックモード: ユニットを更新します', { clinicId, unitId, data })
    return updateMockUnit(unitId, data)
  }

  try {
    const client = getSupabaseClient()
    const { data: updatedUnit, error } = await client
      .from('units')
      .update(data)
      .eq('id', unitId)
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (error) {
      console.error('ユニット更新エラー:', error)
      throw error
    }

    return updatedUnit
  } catch (error) {
    console.error('ユニット更新エラー:', error)
    throw error
  }
}

// ユニット削除（既存予約がある場合はエラー）
export async function deleteUnit(clinicId: string, unitId: string): Promise<void> {
  if (MOCK_MODE) {
    console.log('モックモード: ユニットを削除します', { clinicId, unitId })
    removeMockUnit(unitId)
    return
  }

  try {
    const client = getSupabaseClient()
    
    // 既存予約の確認
    const { data: appointments, error: appointmentError } = await client
      .from('appointments')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('unit_id', unitId)
      .limit(1)

    if (appointmentError) {
      console.error('予約確認エラー:', appointmentError)
      throw appointmentError
    }

    if (appointments && appointments.length > 0) {
      throw new Error('このユニットに関連する予約が存在するため削除できません')
    }

    // ユニット削除
    const { error } = await client
      .from('units')
      .delete()
      .eq('id', unitId)
      .eq('clinic_id', clinicId)

    if (error) {
      console.error('ユニット削除エラー:', error)
      throw error
    }
  } catch (error) {
    console.error('ユニット削除エラー:', error)
    throw error
  }
}

// スタッフユニット優先順位一覧取得
export async function getStaffUnitPriorities(clinicId: string, staffId?: string): Promise<StaffUnitPriority[]> {
  if (MOCK_MODE) {
    console.log('モックモード: スタッフユニット優先順位を取得します', { clinicId, staffId })
    const priorities = getMockStaffUnitPriorities()
    return priorities.filter(p => p.clinic_id === clinicId)
  }

  try {
    const client = getSupabaseClient()

    let query = client
      .from('staff_unit_priorities')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    const { data, error } = await query.order('priority_order')

    // エラーがある場合でも、単に空配列を返す（テーブルが存在しない可能性がある）
    if (error) {
      console.warn('スタッフユニット優先順位テーブルが見つかりません。空配列を返します。', error.message)
      return []
    }

    // データがない場合は空配列を返す
    if (!data || data.length === 0) {
      return []
    }

    // スタッフとユニットの情報を個別に取得して結合
    const enrichedData = await Promise.all(
      data.map(async (priority) => {
        const [staffResult, unitResult] = await Promise.all([
          client.from('staff').select('id, name').eq('id', priority.staff_id).single(),
          client.from('units').select('id, name').eq('id', priority.unit_id).single()
        ])

        return {
          ...priority,
          staff: staffResult.data || undefined,
          unit: unitResult.data || undefined
        }
      })
    )

    return enrichedData
  } catch (error) {
    // エラーが発生しても空配列を返す（機能を壊さない）
    console.warn('スタッフユニット優先順位の取得中にエラーが発生しました。空配列を返します。')
    return []
  }
}

// スタッフユニット優先順位作成
export async function createStaffUnitPriority(clinicId: string, data: CreateStaffUnitPriorityData): Promise<StaffUnitPriority> {
  if (MOCK_MODE) {
    console.log('モックモード: スタッフユニット優先順位を作成します', { clinicId, data })
    
    // モックスタッフデータから該当スタッフを取得
    const mockStaff = [
      { id: 'staff-1', name: '田中太郎' },
      { id: 'staff-2', name: '佐藤花子' },
      { id: 'staff-3', name: '山田次郎' }
    ]
    
    // モックユニットデータから該当ユニットを取得
    const mockUnits = [
      { id: '1', name: 'ユニット1' },
      { id: '2', name: 'ユニット2' },
      { id: '3', name: 'ユニット3' }
    ]
    
    const staff = mockStaff.find(s => s.id === data.staff_id)
    const unit = mockUnits.find(u => u.id === data.unit_id)
    
    const newPriority = {
      id: `mock-priority-${Date.now()}`,
      clinic_id: clinicId,
      staff_id: data.staff_id,
      unit_id: data.unit_id,
      priority_order: data.priority_order,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      staff: staff,
      unit: unit
    }
    return addMockStaffUnitPriority(newPriority)
  }

  try {
    const client = getSupabaseClient()
    const { data: newPriority, error } = await client
      .from('staff_unit_priorities')
      .insert({
        ...data,
        clinic_id: clinicId,
        is_active: data.is_active ?? true
      })
      .select('*')
      .single()

    if (error) {
      console.error('スタッフユニット優先順位作成エラー:', error)
      throw new Error(`スタッフユニット優先順位の作成に失敗しました: ${error.message || 'テーブルが存在しないか、アクセス権限がありません'}`)
    }

    // スタッフとユニットの情報を個別に取得
    const [staffResult, unitResult] = await Promise.all([
      client.from('staff').select('id, name').eq('id', newPriority.staff_id).single(),
      client.from('units').select('id, name').eq('id', newPriority.unit_id).single()
    ])

    return {
      ...newPriority,
      staff: staffResult.data || undefined,
      unit: unitResult.data || undefined
    }
  } catch (error) {
    console.error('スタッフユニット優先順位作成エラー:', error)
    throw error instanceof Error ? error : new Error('スタッフユニット優先順位の作成に失敗しました')
  }
}

// スタッフユニット優先順位更新
export async function updateStaffUnitPriority(clinicId: string, priorityId: string, data: { priority_order?: number; is_active?: boolean }): Promise<StaffUnitPriority> {
  if (MOCK_MODE) {
    console.log('モックモード: スタッフユニット優先順位を更新します', { clinicId, priorityId, data })
    const priorities = getMockStaffUnitPriorities()
    const priority = priorities.find(p => p.id === priorityId)
    if (priority) {
      Object.assign(priority, data, { updated_at: new Date().toISOString() })
      // localStorageに保存
      const updatedPriorities = priorities.map(p => p.id === priorityId ? priority : p)
      localStorage.setItem('mock_staff_unit_priorities', JSON.stringify(updatedPriorities))
    }
    return priority
  }

  try {
    const client = getSupabaseClient()
    const { data: updatedPriority, error } = await client
      .from('staff_unit_priorities')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', priorityId)
      .eq('clinic_id', clinicId)
      .select('*')
      .single()

    if (error) {
      console.error('スタッフユニット優先順位更新エラー:', error)
      throw new Error(`スタッフユニット優先順位の更新に失敗しました: ${error.message || 'テーブルが存在しないか、アクセス権限がありません'}`)
    }

    // スタッフとユニットの情報を個別に取得
    const [staffResult, unitResult] = await Promise.all([
      client.from('staff').select('id, name').eq('id', updatedPriority.staff_id).single(),
      client.from('units').select('id, name').eq('id', updatedPriority.unit_id).single()
    ])

    return {
      ...updatedPriority,
      staff: staffResult.data || undefined,
      unit: unitResult.data || undefined
    }
  } catch (error) {
    console.error('スタッフユニット優先順位更新エラー:', error)
    throw error instanceof Error ? error : new Error('スタッフユニット優先順位の更新に失敗しました')
  }
}

// スタッフユニット優先順位削除
export async function deleteStaffUnitPriority(clinicId: string, priorityId: string): Promise<void> {
  if (MOCK_MODE) {
    console.log('モックモード: スタッフユニット優先順位を削除します', { clinicId, priorityId })
    removeMockStaffUnitPriority(priorityId)
    return
  }

  try {
    const client = getSupabaseClient()
    const { error } = await client
      .from('staff_unit_priorities')
      .delete()
      .eq('id', priorityId)
      .eq('clinic_id', clinicId)

    if (error) {
      console.error('スタッフユニット優先順位削除エラー:', error)
      throw new Error(`スタッフユニット優先順位の削除に失敗しました: ${error.message || 'テーブルが存在しないか、アクセス権限がありません'}`)
    }
  } catch (error) {
    console.error('スタッフユニット優先順位削除エラー:', error)
    throw error instanceof Error ? error : new Error('スタッフユニット優先順位の削除に失敗しました')
  }
}

// スタッフのユニット優先順位を一括更新（ドラッグ&ドロップ用）
export async function updateStaffUnitPriorities(clinicId: string, staffId: string, priorities: { unitId: string; priorityOrder: number }[]): Promise<void> {
  if (MOCK_MODE) {
    console.log('モックモード: スタッフユニット優先順位を一括更新します', { clinicId, staffId, priorities })
    return
  }

  try {
    const client = getSupabaseClient()
    
    // 既存の優先順位を削除
    await client
      .from('staff_unit_priorities')
      .delete()
      .eq('clinic_id', clinicId)
      .eq('staff_id', staffId)

    // 新しい優先順位を作成
    const insertData = priorities.map(p => ({
      clinic_id: clinicId,
      staff_id: staffId,
      unit_id: p.unitId,
      priority_order: p.priorityOrder,
      is_active: true
    }))

    const { error } = await client
      .from('staff_unit_priorities')
      .insert(insertData)

    if (error) {
      console.error('スタッフユニット優先順位一括更新エラー:', error)
      throw new Error(`スタッフユニット優先順位の一括更新に失敗しました: ${error.message || 'テーブルが存在しないか、アクセス権限がありません'}`)
    }
  } catch (error) {
    console.error('スタッフユニット優先順位一括更新エラー:', error)
    throw error instanceof Error ? error : new Error('スタッフユニット優先順位の一括更新に失敗しました')
  }
}
