import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, convertArrayDatesToStrings, StaffRole } from '@/lib/prisma-helpers'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

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

/**
 * 全スタッフ取得（退職者含む）- Prisma版
 */
export async function getAllStaff(clinicId: string): Promise<Staff[]> {
  if (MOCK_MODE) {
    return []
  }

  const prisma = getPrismaClient()

  const staff = await prisma.staff.findMany({
    where: {
      clinic_id: clinicId
    },
    include: {
      staff_positions: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return staff.map(s => ({
    ...s,
    created_at: s.created_at?.toISOString() || '',
    updated_at: s.updated_at?.toISOString() || '',
    role: s.role ? StaffRole.toDb(s.role) : 'staff',
    position: s.staff_positions,
    staff_positions: undefined
  })) as any
}

/**
 * アクティブなスタッフのみ取得 - Prisma版
 */
export async function getStaff(clinicId: string): Promise<Staff[]> {
  if (MOCK_MODE) {
    return []
  }

  const prisma = getPrismaClient()

  const staff = await prisma.staff.findMany({
    where: {
      clinic_id: clinicId,
      is_active: true
    },
    include: {
      staff_positions: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  return staff.map(s => ({
    ...s,
    created_at: s.created_at?.toISOString() || '',
    updated_at: s.updated_at?.toISOString() || '',
    role: s.role ? StaffRole.toDb(s.role) : 'staff',
    position: s.staff_positions,
    staff_positions: undefined
  })) as any
}

/**
 * スタッフ作成 - Prisma版
 */
export async function createStaff(clinicId: string, data: CreateStaffData): Promise<Staff> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const staff = await prisma.staff.create({
    data: {
      clinic_id: clinicId,
      name: data.name,
      name_kana: data.name_kana || null,
      email: data.email || null,
      phone: data.phone || null,
      position_id: data.position_id || null,
      role: StaffRole.fromDb(data.role),
      is_active: data.is_active !== undefined ? data.is_active : true
    },
    include: {
      staff_positions: true
    }
  })

  return {
    ...staff,
    created_at: staff.created_at?.toISOString() || '',
    updated_at: staff.updated_at?.toISOString() || '',
    role: staff.role ? StaffRole.toDb(staff.role) : 'staff',
    position: staff.staff_positions,
    staff_positions: undefined
  } as any
}

/**
 * スタッフ更新 - Prisma版
 */
export async function updateStaff(clinicId: string, staffId: string, data: UpdateStaffData): Promise<Staff> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const updateData: any = {
    updated_at: new Date()
  }

  if (data.name !== undefined) updateData.name = data.name
  if (data.name_kana !== undefined) updateData.name_kana = data.name_kana || null
  if (data.email !== undefined) updateData.email = data.email || null
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.position_id !== undefined) updateData.position_id = data.position_id || null
  if (data.role !== undefined) updateData.role = StaffRole.fromDb(data.role)
  if (data.is_active !== undefined) updateData.is_active = data.is_active

  const staff = await prisma.staff.update({
    where: {
      id: staffId,
      clinic_id: clinicId
    },
    data: updateData,
    include: {
      staff_positions: true
    }
  })

  return {
    ...staff,
    created_at: staff.created_at?.toISOString() || '',
    updated_at: staff.updated_at?.toISOString() || '',
    role: staff.role ? StaffRole.toDb(staff.role) : 'staff',
    position: staff.staff_positions,
    staff_positions: undefined
  } as any
}

/**
 * スタッフ削除 - Prisma版
 */
export async function deleteStaff(clinicId: string, staffId: string): Promise<void> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  await prisma.staff.delete({
    where: {
      id: staffId,
      clinic_id: clinicId
    }
  })
}

/**
 * 役職一覧取得 - Prisma版
 */
export async function getStaffPositions(clinicId: string): Promise<StaffPosition[]> {
  if (MOCK_MODE) {
    return []
  }

  const prisma = getPrismaClient()

  const positions = await prisma.staff_positions.findMany({
    where: {
      clinic_id: clinicId
    },
    orderBy: {
      sort_order: 'asc'
    }
  })

  return convertArrayDatesToStrings(positions, ['created_at']) as any
}

/**
 * 役職作成 - Prisma版
 */
export async function createStaffPosition(clinicId: string, data: CreateStaffPositionData): Promise<StaffPosition> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const position = await prisma.staff_positions.create({
    data: {
      clinic_id: clinicId,
      name: data.name,
      sort_order: data.sort_order
    }
  })

  return convertDatesToStrings(position, ['created_at']) as any
}

/**
 * 役職更新 - Prisma版
 */
export async function updateStaffPosition(clinicId: string, positionId: string, data: UpdateStaffPositionData): Promise<StaffPosition> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  const updateData: any = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.sort_order !== undefined) updateData.sort_order = data.sort_order

  const position = await prisma.staff_positions.update({
    where: {
      id: positionId,
      clinic_id: clinicId
    },
    data: updateData
  })

  return convertDatesToStrings(position, ['created_at']) as any
}

/**
 * 役職削除 - Prisma版
 */
export async function deleteStaffPosition(clinicId: string, positionId: string): Promise<void> {
  if (MOCK_MODE) {
    throw new Error('MOCK_MODE is not supported in Prisma version')
  }

  const prisma = getPrismaClient()

  await prisma.staff_positions.delete({
    where: {
      id: positionId,
      clinic_id: clinicId
    }
  })
}
