import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { MOCK_MODE, initializeMockData } from '@/lib/utils/mock-mode'

export interface Unit {
  id: string
  clinic_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
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
    return [
      {
        id: '1',
        clinic_id: clinicId,
        name: 'ユニット1',
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        clinic_id: clinicId,
        name: 'ユニット2',
        sort_order: 2,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        clinic_id: clinicId,
        name: 'ユニット3',
        sort_order: 3,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]
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
      created_at: new Date().toISOString()
    }
    return newUnit
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
    return {
      id: unitId,
      clinic_id: clinicId,
      name: data.name || 'ユニット1',
      sort_order: data.sort_order || 1,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString()
    }
  }

  try {
    const client = getSupabaseClient()
    const { data: updatedUnit, error } = await client
      .from('units')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
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
    return [
      {
        id: '1',
        clinic_id: clinicId,
        staff_id: 'staff-1',
        unit_id: 'unit-1',
        priority_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        staff: { id: 'staff-1', name: '田中太郎' },
        unit: { id: 'unit-1', name: 'ユニット1' }
      }
    ]
  }

  try {
    const client = getSupabaseClient()
    let query = client
      .from('staff_unit_priorities')
      .select(`
        *,
        staff:staff_id(id, name),
        unit:unit_id(id, name)
      `)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    const { data, error } = await query.order('staff_id, priority_order')

    if (error) {
      console.error('スタッフユニット優先順位取得エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('スタッフユニット優先順位取得エラー:', error)
    return []
  }
}

// スタッフユニット優先順位作成
export async function createStaffUnitPriority(clinicId: string, data: CreateStaffUnitPriorityData): Promise<StaffUnitPriority> {
  if (MOCK_MODE) {
    console.log('モックモード: スタッフユニット優先順位を作成します', { clinicId, data })
    return {
      id: `mock-priority-${Date.now()}`,
      clinic_id: clinicId,
      staff_id: data.staff_id,
      unit_id: data.unit_id,
      priority_order: data.priority_order,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
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
      .select(`
        *,
        staff:staff_id(id, name),
        unit:unit_id(id, name)
      `)
      .single()

    if (error) {
      console.error('スタッフユニット優先順位作成エラー:', error)
      throw error
    }

    return newPriority
  } catch (error) {
    console.error('スタッフユニット優先順位作成エラー:', error)
    throw error
  }
}

// スタッフユニット優先順位更新
export async function updateStaffUnitPriority(clinicId: string, priorityId: string, data: UpdateStaffUnitPriorityData): Promise<StaffUnitPriority> {
  if (MOCK_MODE) {
    console.log('モックモード: スタッフユニット優先順位を更新します', { clinicId, priorityId, data })
    return {
      id: priorityId,
      clinic_id: clinicId,
      staff_id: 'staff-1',
      unit_id: 'unit-1',
      priority_order: data.priority_order || 1,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
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
      .select(`
        *,
        staff:staff_id(id, name),
        unit:unit_id(id, name)
      `)
      .single()

    if (error) {
      console.error('スタッフユニット優先順位更新エラー:', error)
      throw error
    }

    return updatedPriority
  } catch (error) {
    console.error('スタッフユニット優先順位更新エラー:', error)
    throw error
  }
}

// スタッフユニット優先順位削除
export async function deleteStaffUnitPriority(clinicId: string, priorityId: string): Promise<void> {
  if (MOCK_MODE) {
    console.log('モックモード: スタッフユニット優先順位を削除します', { clinicId, priorityId })
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
      throw error
    }
  } catch (error) {
    console.error('スタッフユニット優先順位削除エラー:', error)
    throw error
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
      throw error
    }
  } catch (error) {
    console.error('スタッフユニット優先順位一括更新エラー:', error)
    throw error
  }
}
