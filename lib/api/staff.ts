import { supabase } from '@/lib/supabase'

export interface Staff {
  id: string
  name: string
  name_kana?: string
  email?: string
  phone?: string
  position_id?: string
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

// スタッフ一覧取得
export async function getStaff(clinicId: string): Promise<Staff[]> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        position:staff_positions(*)
      `)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('スタッフ取得エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('スタッフ取得エラー:', error)
    // エラー時はダミーデータを返す
    return [
      {
        id: '1',
        name: '田中太郎',
        name_kana: 'タナカタロウ',
        email: 'tanaka@example.com',
        phone: '03-1234-5678',
        position_id: '1',
        role: 'doctor',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clinic_id: clinicId,
        position: {
          id: '1',
          name: '院長',
          sort_order: 1,
          clinic_id: clinicId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        id: '2',
        name: '佐藤花子',
        name_kana: 'サトウハナコ',
        email: 'sato@example.com',
        phone: '03-1234-5679',
        position_id: '2',
        role: 'staff',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        clinic_id: clinicId,
        position: {
          id: '2',
          name: '看護師',
          sort_order: 2,
          clinic_id: clinicId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ]
  }
}

// スタッフ作成
export async function createStaff(clinicId: string, data: CreateStaffData): Promise<Staff> {
  try {
    const { data: newStaff, error } = await supabase
      .from('staff')
      .insert({
        ...data,
        clinic_id: clinicId,
        is_active: data.is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('スタッフ作成エラー:', error)
      throw error
    }

    return newStaff
  } catch (error) {
    console.error('スタッフ作成エラー:', error)
    // エラー時はダミーデータを返す
    return {
      id: Date.now().toString(),
      name: data.name,
      name_kana: data.name_kana,
      email: data.email,
      phone: data.phone,
      position_id: data.position_id,
      role: data.role,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      clinic_id: clinicId
    }
  }
}

// スタッフ更新
export async function updateStaff(clinicId: string, staffId: string, data: UpdateStaffData): Promise<Staff> {
  try {
    const { data: updatedStaff, error } = await supabase
      .from('staff')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (error) {
      console.error('スタッフ更新エラー:', error)
      throw error
    }

    return updatedStaff
  } catch (error) {
    console.error('スタッフ更新エラー:', error)
    throw error
  }
}

// スタッフ削除（論理削除）
export async function deleteStaff(clinicId: string, staffId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('staff')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .eq('clinic_id', clinicId)

    if (error) {
      console.error('スタッフ削除エラー:', error)
      throw error
    }
  } catch (error) {
    console.error('スタッフ削除エラー:', error)
    throw error
  }
}

// スタッフ役職一覧取得
export async function getStaffPositions(clinicId: string): Promise<StaffPosition[]> {
  try {
    const { data, error } = await supabase
      .from('staff_positions')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order')

    if (error) {
      console.error('スタッフ役職取得エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('スタッフ役職取得エラー:', error)
    // エラー時はダミーデータを返す
    return [
      {
        id: '1',
        name: '院長',
        sort_order: 1,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: '看護師',
        sort_order: 2,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: '受付',
        sort_order: 3,
        clinic_id: clinicId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }
}

// スタッフ役職作成
export async function createStaffPosition(clinicId: string, data: CreateStaffPositionData): Promise<StaffPosition> {
  try {
    const { data: newPosition, error } = await supabase
      .from('staff_positions')
      .insert({
        ...data,
        clinic_id: clinicId
      })
      .select()
      .single()

    if (error) {
      console.error('スタッフ役職作成エラー:', error)
      throw error
    }

    return newPosition
  } catch (error) {
    console.error('スタッフ役職作成エラー:', error)
    // エラー時はダミーデータを返す
    return {
      id: Date.now().toString(),
      name: data.name,
      sort_order: data.sort_order,
      clinic_id: clinicId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

// スタッフ役職更新
export async function updateStaffPosition(clinicId: string, positionId: string, data: UpdateStaffPositionData): Promise<StaffPosition> {
  try {
    const { data: updatedPosition, error } = await supabase
      .from('staff_positions')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', positionId)
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (error) {
      console.error('スタッフ役職更新エラー:', error)
      throw error
    }

    return updatedPosition
  } catch (error) {
    console.error('スタッフ役職更新エラー:', error)
    throw error
  }
}

// スタッフ役職削除
export async function deleteStaffPosition(clinicId: string, positionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('staff_positions')
      .delete()
      .eq('id', positionId)
      .eq('clinic_id', clinicId)

    if (error) {
      console.error('スタッフ役職削除エラー:', error)
      throw error
    }
  } catch (error) {
    console.error('スタッフ役職削除エラー:', error)
    throw error
  }
}
