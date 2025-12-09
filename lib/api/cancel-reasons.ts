import { supabase } from '@/lib/utils/supabase-client'

export interface CancelReason {
  id: string
  clinic_id: string
  name: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// キャンセル理由一覧を取得
export async function getCancelReasons(clinicId: string): Promise<CancelReason[]> {
  // モックモードの場合は設定画面で選択されたキャンセル理由のみを返す
  const { MOCK_MODE } = await import('@/lib/utils/mock-mode')
  if (MOCK_MODE) {
    console.log('モックモード: キャンセル理由を取得します')
    
    const { getMockCancelReasons } = await import('@/lib/utils/mock-mode')
    const reasons = getMockCancelReasons()
    
    console.log('モックモード: 取得したキャンセル理由:', reasons)
    return reasons
  }

  const { data, error } = await supabase
    .from('cancel_reasons')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('キャンセル理由取得エラー:', error)
    throw error
  }

  return data || []
}

// キャンセル理由を作成
export async function createCancelReason(clinicId: string, reasonData: {
  name: string
  is_active?: boolean
}): Promise<CancelReason> {
  // モックモードの場合は設定画面で選択されたキャンセル理由のみを返す
  const { MOCK_MODE } = await import('@/lib/utils/mock-mode')
  if (MOCK_MODE) {
    console.log('モックモード: キャンセル理由を作成します')
    
    const { getMockCancelReasons, saveToStorage } = await import('@/lib/utils/mock-mode')
    const existingReasons = getMockCancelReasons()
    
    const newReason = {
      id: `cancel-reason-${Date.now()}`,
      clinic_id: clinicId,
      name: reasonData.name,
      is_active: reasonData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const updatedReasons = [...existingReasons, newReason]
    saveToStorage('mock_cancel_reasons', updatedReasons)
    
    return newReason
  }

  const { data, error } = await supabase
    .from('cancel_reasons')
    .insert({
      clinic_id: clinicId,
      ...reasonData
    })
    .select()
    .single()

  if (error) {
    console.error('キャンセル理由作成エラー:', error)
    throw error
  }

  return data
}

// キャンセル理由を更新
export async function updateCancelReason(clinicId: string, id: string, reasonData: {
  name?: string
  is_active?: boolean
}): Promise<CancelReason> {
  // モックモードの場合は設定画面で選択されたキャンセル理由のみを返す
  const { MOCK_MODE } = await import('@/lib/utils/mock-mode')
  if (MOCK_MODE) {
    console.log('モックモード: キャンセル理由を更新します')
    
    const { getMockCancelReasons, saveToStorage } = await import('@/lib/utils/mock-mode')
    const existingReasons = getMockCancelReasons()
    
    const updatedReasons = existingReasons.map(reason => 
      reason.id === id 
        ? { ...reason, ...reasonData, updated_at: new Date().toISOString() }
        : reason
    )
    
    saveToStorage('mock_cancel_reasons', updatedReasons)
    
    const updatedReason = updatedReasons.find(reason => reason.id === id)
    if (!updatedReason) {
      throw new Error('キャンセル理由が見つかりません')
    }
    
    return updatedReason
  }

  const { data, error } = await supabase
    .from('cancel_reasons')
    .update(reasonData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('キャンセル理由更新エラー:', error)
    throw error
  }

  return data
}

// キャンセル理由を削除（論理削除）
export async function deleteCancelReason(clinicId: string, id: string): Promise<void> {
  // モックモードの場合は設定画面で選択されたキャンセル理由のみを返す
  const { MOCK_MODE } = await import('@/lib/utils/mock-mode')
  if (MOCK_MODE) {
    console.log('モックモード: キャンセル理由を削除します')
    
    const { getMockCancelReasons, saveToStorage } = await import('@/lib/utils/mock-mode')
    const existingReasons = getMockCancelReasons()
    
    const updatedReasons = existingReasons.filter(reason => reason.id !== id)
    saveToStorage('mock_cancel_reasons', updatedReasons)
    
    return
  }

  const { error } = await supabase
    .from('cancel_reasons')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('キャンセル理由削除エラー:', error)
    throw error
  }
}
