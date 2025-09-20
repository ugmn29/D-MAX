import { supabase } from '@/lib/supabase'
import { TreatmentMenu, TreatmentMenuInsert, TreatmentMenuUpdate } from '@/types/database'

/**
 * 診療メニューを取得
 */
export async function getTreatmentMenus(clinicId: string): Promise<TreatmentMenu[]> {
  const { data, error } = await supabase
    .from('treatment_menus')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('level', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('診療メニュー取得エラー:', error)
    throw new Error('診療メニューの取得に失敗しました')
  }

  return data || []
}

/**
 * 診療メニューを新規作成
 */
export async function createTreatmentMenu(
  clinicId: string,
  menuData: Omit<TreatmentMenuInsert, 'clinic_id'>
): Promise<TreatmentMenu> {
  const newMenu: TreatmentMenuInsert = {
    ...menuData,
    clinic_id: clinicId
  }

  console.log('createTreatmentMenu呼び出し:', { clinicId, menuData, newMenu })

  const { data, error } = await supabase
    .from('treatment_menus')
    .insert(newMenu)
    .select()
    .single()

  console.log('createTreatmentMenuレスポンス:', { data, error })

  if (error) {
    console.error('診療メニュー作成エラー:', error)
    console.error('エラーの詳細:', JSON.stringify(error, null, 2))
    throw new Error(`診療メニューの作成に失敗しました: ${error.message || error.details || JSON.stringify(error)}`)
  }

  return data
}

/**
 * 診療メニューを更新
 */
export async function updateTreatmentMenu(
  clinicId: string,
  menuId: string,
  menuData: TreatmentMenuUpdate
): Promise<TreatmentMenu> {
  const { data, error } = await supabase
    .from('treatment_menus')
    .update(menuData)
    .eq('clinic_id', clinicId)
    .eq('id', menuId)
    .select()
    .single()

  if (error) {
    console.error('診療メニュー更新エラー:', error)
    throw new Error('診療メニューの更新に失敗しました')
  }

  return data
}

/**
 * 診療メニューを削除（論理削除）
 */
export async function deleteTreatmentMenu(
  clinicId: string,
  menuId: string
): Promise<void> {
  const { error } = await supabase
    .from('treatment_menus')
    .update({ is_active: false })
    .eq('clinic_id', clinicId)
    .eq('id', menuId)

  if (error) {
    console.error('診療メニュー削除エラー:', error)
    throw new Error('診療メニューの削除に失敗しました')
  }
}
