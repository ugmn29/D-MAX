import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, convertArrayDatesToStrings } from '@/lib/prisma-helpers'
import { MOCK_MODE } from '@/lib/utils/mock-mode'
import type { TreatmentMenu, TreatmentMenuInsert, TreatmentMenuUpdate } from '@/types/database'

/**
 * 診療メニューを取得 - Prisma版
 */
export async function getTreatmentMenus(clinicId: string): Promise<TreatmentMenu[]> {
  if (MOCK_MODE) {
    return []
  }

  const prisma = getPrismaClient()

  const menus = await prisma.treatment_menus.findMany({
    where: {
      clinic_id: clinicId,
      is_active: true
    },
    orderBy: [
      { level: 'asc' },
      { sort_order: 'asc' }
    ]
  })

  return convertArrayDatesToStrings(menus, ['created_at']) as any
}

/**
 * 診療メニューを新規作成 - Prisma版
 */
export async function createTreatmentMenu(
  clinicId: string,
  menuData: Omit<TreatmentMenuInsert, 'clinic_id'>
): Promise<TreatmentMenu> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const menu = await prisma.treatment_menus.create({
    data: {
      clinic_id: clinicId,
      name: menuData.name,
      standard_duration: menuData.standard_duration || 30,
      color: menuData.color || '#bfbfbf',
      level: menuData.level || 1,
      parent_id: menuData.parent_id || null,
      sort_order: menuData.sort_order || 0,
      is_active: menuData.is_active ?? true,
      web_booking_enabled: menuData.web_booking_enabled || false,
      web_booking_staff_ids: menuData.web_booking_staff_ids || [],
      web_booking_duration: menuData.web_booking_duration || null,
      web_booking_new_patient: menuData.web_booking_new_patient ?? true,
      web_booking_returning: menuData.web_booking_returning ?? true
    }
  })

  return convertDatesToStrings(menu, ['created_at']) as any
}

/**
 * 診療メニューを更新 - Prisma版
 */
export async function updateTreatmentMenu(
  clinicId: string,
  menuId: string,
  menuData: TreatmentMenuUpdate
): Promise<TreatmentMenu> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const updateData: any = {}

  if (menuData.name !== undefined) updateData.name = menuData.name
  if (menuData.standard_duration !== undefined) updateData.standard_duration = menuData.standard_duration
  if (menuData.color !== undefined) updateData.color = menuData.color
  if (menuData.level !== undefined) updateData.level = menuData.level
  if (menuData.parent_id !== undefined) updateData.parent_id = menuData.parent_id || null
  if (menuData.sort_order !== undefined) updateData.sort_order = menuData.sort_order
  if (menuData.is_active !== undefined) updateData.is_active = menuData.is_active
  if (menuData.web_booking_enabled !== undefined) updateData.web_booking_enabled = menuData.web_booking_enabled
  if (menuData.web_booking_staff_ids !== undefined) updateData.web_booking_staff_ids = menuData.web_booking_staff_ids
  if (menuData.web_booking_duration !== undefined) updateData.web_booking_duration = menuData.web_booking_duration
  if (menuData.web_booking_new_patient !== undefined) updateData.web_booking_new_patient = menuData.web_booking_new_patient
  if (menuData.web_booking_returning !== undefined) updateData.web_booking_returning = menuData.web_booking_returning

  const menu = await prisma.treatment_menus.update({
    where: {
      id: menuId,
      clinic_id: clinicId
    },
    data: updateData
  })

  return convertDatesToStrings(menu, ['created_at']) as any
}

/**
 * 診療メニューを削除（論理削除） - Prisma版
 */
export async function deleteTreatmentMenu(
  clinicId: string,
  menuId: string
): Promise<void> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  await prisma.treatment_menus.update({
    where: {
      id: menuId,
      clinic_id: clinicId
    },
    data: {
      is_active: false
    }
  })
}
