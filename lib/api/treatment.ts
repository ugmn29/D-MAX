// Migrated to Prisma API Routes
import { TreatmentMenu, TreatmentMenuInsert, TreatmentMenuUpdate } from '@/types/database'

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * 診療メニューを取得
 */
export async function getTreatmentMenus(clinicId: string): Promise<TreatmentMenu[]> {
  try {
    const response = await fetch(`${baseUrl}/api/treatment-menus?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '診療メニューの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('診療メニュー取得エラー:', error)
    throw error
  }
}

/**
 * 診療メニューを新規作成
 */
export async function createTreatmentMenu(
  clinicId: string,
  menuData: Omit<TreatmentMenuInsert, 'clinic_id'>
): Promise<TreatmentMenu> {
  try {
    const response = await fetch(`${baseUrl}/api/treatment-menus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clinic_id: clinicId, ...menuData })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '診療メニューの作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('診療メニュー作成エラー:', error)
    throw error
  }
}

/**
 * 診療メニューを更新
 */
export async function updateTreatmentMenu(
  clinicId: string,
  menuId: string,
  menuData: TreatmentMenuUpdate
): Promise<TreatmentMenu> {
  try {
    const response = await fetch(`${baseUrl}/api/treatment-menus/${menuId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clinic_id: clinicId, ...menuData })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '診療メニューの更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('診療メニュー更新エラー:', error)
    throw error
  }
}

/**
 * 診療メニューを削除（論理削除）
 */
export async function deleteTreatmentMenu(
  clinicId: string,
  menuId: string
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/treatment-menus/${menuId}?clinic_id=${clinicId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '診療メニューの削除に失敗しました')
    }
  } catch (error) {
    console.error('診療メニュー削除エラー:', error)
    throw error
  }
}
