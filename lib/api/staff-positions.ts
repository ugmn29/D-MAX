import { supabase } from '@/lib/supabase'

export interface StaffPosition {
  id: string
  clinic_id: string
  name: string
  sort_order: number
  enabled?: boolean
  created_at: string
  updated_at: string
}

export interface StaffPositionInsert {
  clinic_id: string
  name: string
  sort_order: number
  enabled?: boolean
}

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

  // enabledフィールドが存在しない場合のデフォルト値を設定
  return (data || []).map(position => ({
    ...position,
    enabled: position.enabled ?? true
  }))
}

export async function createStaffPosition(
  clinicId: string,
  positionData: Omit<StaffPositionInsert, 'clinic_id'>
): Promise<StaffPosition> {
  // enabledカラムが存在しない場合に備えて、必要なフィールドのみを送信
  const newPosition: any = {
    clinic_id: clinicId,
    name: positionData.name,
    sort_order: positionData.sort_order || 0
  }

  // enabledカラムが存在する場合のみ追加
  if (positionData.enabled !== undefined) {
    newPosition.enabled = positionData.enabled
  }

  const { data, error } = await supabase
    .from('staff_positions')
    .insert(newPosition)
    .select()
    .single()

  if (error) {
    console.error('スタッフ役職作成エラー:', error)
    console.error('エラー詳細:', error)
    throw new Error(`スタッフ役職の作成に失敗しました: ${error.message}`)
  }

  // レスポンスにenabledフィールドがない場合のデフォルト値を設定
  return {
    ...data,
    enabled: data.enabled ?? true
  }
}

export async function updateStaffPosition(
  clinicId: string,
  positionId: string,
  updates: Partial<Omit<StaffPositionInsert, 'clinic_id'>>
): Promise<StaffPosition> {
  const { data, error } = await supabase
    .from('staff_positions')
    .update(updates)
    .eq('id', positionId)
    .eq('clinic_id', clinicId)
    .select()
    .single()

  if (error) {
    console.error('スタッフ役職更新エラー:', error)
    throw new Error('スタッフ役職の更新に失敗しました')
  }

  return {
    ...data,
    enabled: data.enabled ?? true
  }
}

export async function deleteStaffPosition(
  clinicId: string,
  positionId: string
): Promise<void> {
  const { error } = await supabase
    .from('staff_positions')
    .delete()
    .eq('id', positionId)
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('スタッフ役職削除エラー:', error)
    throw new Error('スタッフ役職の削除に失敗しました')
  }
}
