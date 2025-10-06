import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { TreatmentMenu, TreatmentMenuInsert, TreatmentMenuUpdate } from '@/types/database'
import { MOCK_MODE, getMockTreatmentMenus, addMockTreatmentMenu, removeMockTreatmentMenu } from '@/lib/utils/mock-mode'

/**
 * 診療メニューを取得
 */
export async function getTreatmentMenus(clinicId: string): Promise<TreatmentMenu[]> {
  // モックモードの場合はモックデータを返す
  if (MOCK_MODE) {
    console.log('モックモード: 診療メニューデータを返します')
    const allMenus = getMockTreatmentMenus()
    const filteredMenus = allMenus.filter(item => item.clinic_id === clinicId)
    console.log('モックモード: 全メニュー数', allMenus.length, 'フィルタ後', filteredMenus.length)
    console.log('モックモード: Level 1メニュー', allMenus.filter(m => m.level === 1))
    console.log('モックモード: Level 2メニュー', allMenus.filter(m => m.level === 2))
    return filteredMenus
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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
  console.log('createTreatmentMenu呼び出し:', { clinicId, menuData })

  // モックモードの場合はモックデータを生成して返す
  if (MOCK_MODE) {
    console.log('モックモード: 診療メニューを作成します', { clinicId, menuData })
    const newMenu: TreatmentMenu = {
      id: `mock-treatment-${Date.now()}`,
      clinic_id: clinicId,
      name: menuData.name,
      description: menuData.description,
      duration_minutes: menuData.duration_minutes || 30,
      color: menuData.color || '#bfbfbf',
      level: menuData.level || 1,
      parent_id: menuData.parent_id || null,
      sort_order: menuData.sort_order || 0,
      is_active: menuData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    addMockTreatmentMenu(newMenu)
    return newMenu
  }

  const newMenu: TreatmentMenuInsert = {
    ...menuData,
    clinic_id: clinicId
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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
  console.log('updateTreatmentMenu呼び出し:', { clinicId, menuId, menuData })

  // モックモードの場合はモックデータを更新
  if (MOCK_MODE) {
    console.log('モックモード: 診療メニューを更新します', { clinicId, menuId, menuData })
    const menus = getMockTreatmentMenus()
    const menuIndex = menus.findIndex(menu => menu.id === menuId && menu.clinic_id === clinicId)
    
    if (menuIndex === -1) {
      throw new Error('診療メニューが見つかりません')
    }

    const updatedMenu: TreatmentMenu = {
      ...menus[menuIndex],
      ...menuData,
      updated_at: new Date().toISOString()
    }
    
    menus[menuIndex] = updatedMenu
    localStorage.setItem('mock_treatment_menus', JSON.stringify(menus))
    
    return updatedMenu
  }

  const client = getSupabaseClient()
  const { data, error } = await client
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
  console.log('deleteTreatmentMenu呼び出し:', { clinicId, menuId })

  // モックモードの場合はモックデータから削除
  if (MOCK_MODE) {
    console.log('モックモード: 診療メニューを削除します', { clinicId, menuId })
    removeMockTreatmentMenu(menuId)
    return
  }

  const client = getSupabaseClient()
  const { error } = await client
    .from('treatment_menus')
    .update({ is_active: false })
    .eq('clinic_id', clinicId)
    .eq('id', menuId)

  if (error) {
    console.error('診療メニュー削除エラー:', error)
    throw new Error('診療メニューの削除に失敗しました')
  }
}
