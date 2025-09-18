import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日付フォーマット関数
export const formatDate = (date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (format === 'time') {
    return dateObj.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (format === 'long') {
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  return dateObj.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 年齢計算関数
export const calculateAge = (birthDate: Date | string): number => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

// 診察券番号生成関数
export const generatePatientNumber = (clinicId: string, sequence: number): string => {
  return `${clinicId.slice(-3).toUpperCase()}-${sequence.toString().padStart(6, '0')}`
}

// 時間計算ヘルパー
export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000)
}

export const getTimeDifference = (start: Date, end: Date): number => {
  return Math.round((end.getTime() - start.getTime()) / 60000) // 分単位
}

// 営業時間チェック
export const isWithinBusinessHours = (
  date: Date,
  businessHours: { start: string; end: string; breakStart?: string; breakEnd?: string }
): boolean => {
  const timeStr = date.toTimeString().slice(0, 5) // HH:MM形式

  if (timeStr < businessHours.start || timeStr > businessHours.end) {
    return false
  }

  if (businessHours.breakStart && businessHours.breakEnd) {
    if (timeStr >= businessHours.breakStart && timeStr <= businessHours.breakEnd) {
      return false
    }
  }

  return true
}

// カラーユーティリティ
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    '未来院': 'bg-gray-100 text-gray-800',
    '遅刻': 'bg-yellow-100 text-yellow-800',
    '来院済み': 'bg-blue-100 text-blue-800',
    '診療中': 'bg-green-100 text-green-800',
    '会計': 'bg-purple-100 text-purple-800',
    '終了': 'bg-gray-100 text-gray-600',
    'キャンセル': 'bg-red-100 text-red-800'
  }

  return colors[status] || 'bg-gray-100 text-gray-800'
}

// バリデーションヘルパー
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\d{2,4}-?\d{2,4}-?\d{4}|\d{10,11})$/
  return phoneRegex.test(phone.replace(/[^\d-]/g, ''))
}

// デバウンス関数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}