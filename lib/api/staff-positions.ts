import { supabase } from '@/lib/supabase'
import { StaffPosition, StaffPositionInsert, StaffPositionUpdate } from '@/types/database'

/**
 * スタッフ役職を取得
 */
export async function getStaffPositions(clinicId: string): Promise<StaffPosition[]> {
  const { data, error } = await supabase
    .from('staff_positions')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('スタッフ役職取得エラー:', error)
    throw new Error('スタッフ役職の取得に失敗しました')
  }

  return data || []
}

/**
 * スタッフ役職を新規作成
 */
export async function createStaffPosition(
  clinicId: string,
  positionData: Omit<StaffPositionInsert, 'clinic_id'>
): Promise<StaffPosition> {
  const newPosition: StaffPositionInsert = {
    ...positionData,
    clinic_id: clinicId
  }

  const { data, error } = await supabase
    .from('staff_positions')
    .insert(newPosition)
    .select()
    .single()

  if (error) {
    console.error('スタッフ役職作成エラー:', error)
    throw new Error('スタッフ役職の作成に失敗しました')
  }

  return data
}

/**
 * スタッフ役職を更新
 */
export async function updateStaffPosition(
  clinicId: string,
  positionId: string,
  positionData: StaffPositionUpdate
): Promise<StaffPosition> {
  const { data, error } = await supabase
    .from('staff_positions')
    .update(positionData)
    .eq('clinic_id', clinicId)
    .eq('id', positionId)
    .select()
    .single()

  if (error) {
    console.error('スタッフ役職更新エラー:', error)
    throw new Error('スタッフ役職の更新に失敗しました')
  }

  return data
}

/**
 * スタッフ役職を削除
 */
export async function deleteStaffPosition(
  clinicId: string,
  positionId: string
): Promise<void> {
  const { error } = await supabase
    .from('staff_positions')
    .delete()
    .eq('clinic_id', clinicId)
    .eq('id', positionId)

  if (error) {
    console.error('スタッフ役職削除エラー:', error)
    throw new Error('スタッフ役職の削除に失敗しました')
  }
}
