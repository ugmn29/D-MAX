import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { MOCK_MODE, getMockStaffPositions, addMockStaffPosition, updateMockStaffPosition, removeMockStaffPosition } from '@/lib/utils/mock-mode'

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
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: スタッフ役職データを返します')
    return getMockStaffPositions().filter(item => item.clinic_id === clinicId)
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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
  // モックモードの場合はモックデータを生成して返す
  if (MOCK_MODE) {
    console.log('モックモード: スタッフ役職を作成します', { clinicId, positionData })
    const newPosition: StaffPosition = {
      id: `mock-pos-${Date.now()}`,
      clinic_id: clinicId,
      name: positionData.name,
      sort_order: positionData.sort_order || 0,
      enabled: positionData.enabled ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    addMockStaffPosition(newPosition)
    return newPosition
  }

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

  const client = getSupabaseClient()
  const { data, error } = await client
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
  // モックモードの場合はモックデータを更新
  if (MOCK_MODE) {
    console.log('モックモード: スタッフ役職を更新します', { clinicId, positionId, updates })
    updateMockStaffPosition(positionId, updates)
    const data = getMockStaffPositions().find(item => item.id === positionId)
    if (!data) {
      throw new Error('スタッフ役職が見つかりません')
    }
    return data
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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
  // モックモードの場合はモックデータから削除
  if (MOCK_MODE) {
    console.log('モックモード: スタッフ役職を削除します', { clinicId, positionId })
    removeMockStaffPosition(positionId)
    return
  }

  const client = getSupabaseClient()
  const { error } = await client
    .from('staff_positions')
    .delete()
    .eq('id', positionId)
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('スタッフ役職削除エラー:', error)
    throw new Error('スタッフ役職の削除に失敗しました')
  }
}
