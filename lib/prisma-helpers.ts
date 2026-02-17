/**
 * Prisma型変換ヘルパー関数
 *
 * PrismaのDate/Enum/JSON型と既存のSupabase型システムの間で
 * 安全に変換を行うためのユーティリティ関数群
 */

import type { Prisma } from '@/generated/prisma/client'

/**
 * Date → ISO文字列への変換
 */
export function dateToString(date: Date | null | undefined): string | null {
  if (!date) return null
  return date.toISOString()
}

/**
 * Date配列 → ISO文字列配列への変換
 */
export function datesToStrings(dates: Date[]): string[] {
  return dates.map(d => d.toISOString())
}

/**
 * ISO文字列 → Dateへの変換
 */
export function stringToDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  return new Date(dateStr)
}

/**
 * Prismaモデルの日付フィールドを文字列に変換
 * 既存のUIは日付を文字列で扱うため、Prismaの結果を変換する
 */
export function convertDatesToStrings<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[],
  dateOnlyFields?: (keyof T)[]
): T {
  const result = { ...obj }
  for (const field of dateFields) {
    if (result[field] instanceof Date) {
      if (dateOnlyFields?.includes(field)) {
        // @db.Date フィールド → YYYY-MM-DD形式
        (result[field] as any) = (result[field] as Date).toISOString().split('T')[0]
      } else {
        (result[field] as any) = (result[field] as Date).toISOString()
      }
    }
  }
  return result
}

/**
 * 配列に対してconvertDatesToStringsを適用
 */
export function convertArrayDatesToStrings<T extends Record<string, any>>(
  arr: T[],
  dateFields: (keyof T)[],
  dateOnlyFields?: (keyof T)[]
): T[] {
  return arr.map(obj => convertDatesToStrings(obj, dateFields, dateOnlyFields))
}

/**
 * appointment_status enumマッピング
 */
export const AppointmentStatus = {
  // Prisma enum → データベース値
  toDb(status: 'NOT_YET_ARRIVED' | 'LATE' | 'CHECKED_IN' | 'IN_TREATMENT' | 'PAYMENT' | 'COMPLETED' | 'CANCELLED'): string {
    const mapping: Record<string, string> = {
      'NOT_YET_ARRIVED': '未来院',
      'LATE': '遅刻',
      'CHECKED_IN': '来院済み',
      'IN_TREATMENT': '診療中',
      'PAYMENT': '会計',
      'COMPLETED': '終了',
      'CANCELLED': 'キャンセル'
    }
    return mapping[status] || status
  },

  // データベース値 → Prisma enum
  fromDb(status: string): 'NOT_YET_ARRIVED' | 'LATE' | 'CHECKED_IN' | 'IN_TREATMENT' | 'PAYMENT' | 'COMPLETED' | 'CANCELLED' {
    const mapping: Record<string, any> = {
      '未来院': 'NOT_YET_ARRIVED',
      '遅刻': 'LATE',
      '来院済み': 'CHECKED_IN',
      '診療中': 'IN_TREATMENT',
      '会計': 'PAYMENT',
      '終了': 'COMPLETED',
      'キャンセル': 'CANCELLED'
    }
    return mapping[status] || 'NOT_YET_ARRIVED'
  }
} as const

/**
 * log_action enumマッピング
 */
export const LogAction = {
  // Prisma enum → データベース値
  toDb(action: 'CREATED' | 'UPDATED' | 'CANCELLED' | 'DELETED'): string {
    const mapping: Record<string, string> = {
      'CREATED': '作成',
      'UPDATED': '変更',
      'CANCELLED': 'キャンセル',
      'DELETED': '削除'
    }
    return mapping[action] || action
  },

  // データベース値 → Prisma enum
  fromDb(action: string): 'CREATED' | 'UPDATED' | 'CANCELLED' | 'DELETED' {
    const mapping: Record<string, any> = {
      '作成': 'CREATED',
      '変更': 'UPDATED',
      'キャンセル': 'CANCELLED',
      '削除': 'DELETED'
    }
    return mapping[action] || 'CREATED'
  }
} as const

/**
 * patient_gender enumマッピング（既に英語なので変換不要だが一貫性のため定義）
 */
export const PatientGender = {
  toDb(gender: 'male' | 'female' | 'other'): string {
    return gender
  },
  fromDb(gender: string): 'male' | 'female' | 'other' {
    return gender as 'male' | 'female' | 'other'
  }
} as const

/**
 * staff_role enumマッピング（既に英語なので変換不要だが一貫性のため定義）
 */
export const StaffRole = {
  toDb(role: 'admin' | 'clinic' | 'staff'): string {
    return role
  },
  fromDb(role: string): 'admin' | 'clinic' | 'staff' {
    return role as 'admin' | 'clinic' | 'staff'
  }
} as const

/**
 * Prisma JsonValue型のヘルパー
 */
export function jsonToObject<T = any>(json: Prisma.JsonValue | null): T | null {
  if (json === null) return null
  return json as T
}

export function objectToJson<T = any>(obj: T | null): Prisma.JsonValue | null {
  if (obj === null) return null
  return obj as unknown as Prisma.JsonValue
}

/**
 * 型安全なJSON変換（検証付き）
 */
export function safeJsonToObject<T = any>(json: Prisma.JsonValue | null, fallback: T): T {
  if (json === null) return fallback
  try {
    return json as T
  } catch {
    return fallback
  }
}
