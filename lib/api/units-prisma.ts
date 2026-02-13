import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, convertArrayDatesToStrings } from '@/lib/prisma-helpers'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

export interface Unit {
  id: string
  clinic_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at?: string
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

/**
 * ユニット一覧取得 - Prisma版
 */
export async function getUnits(clinicId: string): Promise<Unit[]> {
  if (MOCK_MODE) {
    return []
  }

  const prisma = getPrismaClient()

  const units = await prisma.units.findMany({
    where: {
      clinic_id: clinicId
    },
    orderBy: {
      sort_order: 'asc'
    }
  })

  return convertArrayDatesToStrings(units, ['created_at']) as any
}

/**
 * ユニット作成 - Prisma版
 */
export async function createUnit(clinicId: string, data: CreateUnitData): Promise<Unit> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const unit = await prisma.units.create({
    data: {
      clinic_id: clinicId,
      name: data.name,
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== undefined ? data.is_active : true
    }
  })

  return convertDatesToStrings(unit, ['created_at']) as any
}

/**
 * ユニット更新 - Prisma版
 */
export async function updateUnit(clinicId: string, unitId: string, data: UpdateUnitData): Promise<Unit> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const updateData: any = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.sort_order !== undefined) updateData.sort_order = data.sort_order
  if (data.is_active !== undefined) updateData.is_active = data.is_active

  const unit = await prisma.units.update({
    where: {
      id: unitId,
      clinic_id: clinicId
    },
    data: updateData
  })

  return convertDatesToStrings(unit, ['created_at']) as any
}

/**
 * ユニット削除 - Prisma版
 */
export async function deleteUnit(clinicId: string, unitId: string): Promise<void> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  await prisma.units.delete({
    where: {
      id: unitId,
      clinic_id: clinicId
    }
  })
}

/**
 * スタッフ-ユニット優先度一覧取得 - Prisma版
 */
export async function getStaffUnitPriorities(clinicId: string, staffId?: string): Promise<StaffUnitPriority[]> {
  if (MOCK_MODE) {
    return []
  }

  const prisma = getPrismaClient()

  const where: any = {
    clinic_id: clinicId
  }

  if (staffId) {
    where.staff_id = staffId
  }

  const priorities = await prisma.staff_unit_priorities.findMany({
    where,
    include: {
      staff: {
        select: {
          id: true,
          name: true
        }
      },
      units: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      priority_order: 'asc'
    }
  })

  return priorities.map(p => ({
    ...p,
    created_at: p.created_at?.toISOString() || '',
    updated_at: p.updated_at?.toISOString() || '',
    unit: p.units,
    units: undefined
  })) as any
}

/**
 * スタッフ-ユニット優先度作成 - Prisma版
 */
export async function createStaffUnitPriority(clinicId: string, data: CreateStaffUnitPriorityData): Promise<StaffUnitPriority> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const priority = await prisma.staff_unit_priorities.create({
    data: {
      clinic_id: clinicId,
      staff_id: data.staff_id,
      unit_id: data.unit_id,
      priority_order: data.priority_order,
      is_active: data.is_active !== undefined ? data.is_active : true
    },
    include: {
      staff: {
        select: {
          id: true,
          name: true
        }
      },
      units: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return {
    ...priority,
    created_at: priority.created_at?.toISOString() || '',
    updated_at: priority.updated_at?.toISOString() || '',
    unit: priority.units,
    units: undefined
  } as any
}

/**
 * スタッフ-ユニット優先度更新 - Prisma版
 */
export async function updateStaffUnitPriority(
  clinicId: string,
  priorityId: string,
  data: UpdateStaffUnitPriorityData
): Promise<StaffUnitPriority> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const updateData: any = {
    updated_at: new Date()
  }

  if (data.priority_order !== undefined) updateData.priority_order = data.priority_order
  if (data.is_active !== undefined) updateData.is_active = data.is_active

  const priority = await prisma.staff_unit_priorities.update({
    where: {
      id: priorityId,
      clinic_id: clinicId
    },
    data: updateData,
    include: {
      staff: {
        select: {
          id: true,
          name: true
        }
      },
      units: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  return {
    ...priority,
    created_at: priority.created_at?.toISOString() || '',
    updated_at: priority.updated_at?.toISOString() || '',
    unit: priority.units,
    units: undefined
  } as any
}

/**
 * スタッフ-ユニット優先度削除 - Prisma版
 */
export async function deleteStaffUnitPriority(clinicId: string, priorityId: string): Promise<void> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  await prisma.staff_unit_priorities.delete({
    where: {
      id: priorityId,
      clinic_id: clinicId
    }
  })
}

/**
 * スタッフ-ユニット優先度一括更新 - Prisma版
 */
export async function updateStaffUnitPriorities(
  clinicId: string,
  staffId: string,
  priorities: { unitId: string; priorityOrder: number }[]
): Promise<void> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  // トランザクションで一括更新
  await prisma.$transaction(
    priorities.map(({ unitId, priorityOrder }) =>
      prisma.staff_unit_priorities.updateMany({
        where: {
          clinic_id: clinicId,
          staff_id: staffId,
          unit_id: unitId
        },
        data: {
          priority_order: priorityOrder,
          updated_at: new Date()
        }
      })
    )
  )
}
