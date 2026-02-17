// Migrated to Prisma API Routes
import { Appointment, AppointmentInsert, AppointmentUpdate } from '@/types/database'

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * 予約を取得
 */
export async function getAppointments(
  clinicId: string,
  startDate?: string,
  endDate?: string
): Promise<Appointment[]> {
  try {
    const params = new URLSearchParams({ clinic_id: clinicId })
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    const response = await fetch(`${baseUrl}/api/appointments?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '予約の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('予約取得エラー:', error)
    throw error
  }
}

/**
 * 特定日の予約を取得
 */
export async function getAppointmentsByDate(
  clinicId: string,
  date: string
): Promise<Appointment[]> {
  return getAppointments(clinicId, date, date)
}

/**
 * 予約詳細を取得
 */
export async function getAppointmentById(
  clinicId: string,
  appointmentId: string
): Promise<Appointment | null> {
  try {
    const params = new URLSearchParams({
      clinic_id: clinicId,
      appointment_id: appointmentId
    })

    const response = await fetch(`${baseUrl}/api/appointments?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '予約情報の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('予約詳細取得エラー:', error)
    throw error
  }
}

/**
 * 予約を新規作成
 */
export async function createAppointment(
  clinicId: string,
  appointmentData: Omit<AppointmentInsert, 'clinic_id'>
): Promise<Appointment> {
  try {
    const response = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clinicId, ...appointmentData })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '予約の作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('予約作成エラー:', error)
    throw error
  }
}

/**
 * 予約ステータスを更新
 */
export async function updateAppointmentStatus(
  clinicId: string,
  appointmentId: string,
  status: string
): Promise<Appointment> {
  return updateAppointment(appointmentId, {
    status: status as any,
    updated_at: new Date().toISOString()
  })
}

/**
 * 予約を削除
 */
export async function deleteAppointment(
  clinicId: string,
  appointmentId: string
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/appointments?appointmentId=${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '予約の削除に失敗しました')
    }
  } catch (error) {
    console.error('予約削除エラー:', error)
    throw error
  }
}

/**
 * 予約統計を取得
 */
export async function getAppointmentStats(clinicId: string, date?: string) {
  try {
    const params = new URLSearchParams({ clinic_id: clinicId })
    if (date) params.append('date', date)

    const response = await fetch(`${baseUrl}/api/appointments/stats?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '予約統計の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('予約統計取得エラー:', error)
    throw error
  }
}

/**
 * 予約を更新
 */
export async function updateAppointment(
  appointmentId: string,
  appointmentData: Partial<AppointmentUpdate>
): Promise<Appointment> {
  try {
    const response = await fetch(`${baseUrl}/api/appointments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ appointmentId, ...appointmentData })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '予約の更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('予約更新エラー:', error)
    throw error
  }
}

/**
 * 予約をキャンセル
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelReasonId: string,
  cancelledBy?: string,
  additionalMemo?: string
): Promise<Appointment> {
  try {
    const response = await fetch(`${baseUrl}/api/appointments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appointmentId,
        cancel_reason_id: cancelReasonId,
        cancelled_by: cancelledBy || null,
        additional_memo: additionalMemo || null,
        action: 'cancel'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '予約のキャンセルに失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('予約キャンセルエラー:', error)
    throw error
  }
}

// ========================================
// 来院登録関連
// ========================================

/**
 * 予約を来院済みにする（QRコードスキャンなど）
 */
export async function checkInAppointment(
  appointmentId: string,
  method: 'qr_code' | 'manual' | 'auto' = 'manual'
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/appointments/check-in`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appointmentId,
        action: 'check_in',
        check_in_method: method
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '来院登録に失敗しました')
    }
  } catch (error) {
    console.error('来院登録エラー:', error)
    throw error
  }
}

/**
 * 来院済みかどうかを確認
 */
export async function isAppointmentCheckedIn(appointmentId: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ appointment_id: appointmentId })

    const response = await fetch(`${baseUrl}/api/appointments/check-in?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return !!data.checked_in_at
  } catch (error) {
    console.error('来院確認エラー:', error)
    return false
  }
}

/**
 * 来院登録を取り消す
 */
export async function cancelCheckIn(appointmentId: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/appointments/check-in`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appointmentId,
        action: 'cancel_check_in'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '来院登録の取り消しに失敗しました')
    }
  } catch (error) {
    console.error('来院取り消しエラー:', error)
    throw error
  }
}

/**
 * 本日来院済みの予約一覧を取得
 */
export async function getTodayCheckedInAppointments(
  clinicId: string
): Promise<Appointment[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const params = new URLSearchParams({
      clinic_id: clinicId,
      date: today,
      checked_in_only: 'true'
    })

    const response = await fetch(`${baseUrl}/api/appointments/check-in?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '来院済み予約の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('来院済み予約取得エラー:', error)
    throw error
  }
}
