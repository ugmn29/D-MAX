// Migrated to Prisma API Routes

export interface PatientAlertNote {
  id: string
  text: string
  created_at: string
}

// 患者の注意事項を取得
export async function getPatientAlertNotes(patientId: string): Promise<PatientAlertNote[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/patient-alert-notes?patient_id=${encodeURIComponent(patientId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      console.error('Error fetching patient alert notes')
      return []
    }

    const data = await response.json()
    return data.notes || []
  } catch (error) {
    console.error('Error fetching patient alert notes:', error)
    return []
  }
}

// 患者の注意事項を更新
export async function updatePatientAlertNotes(
  patientId: string,
  notes: PatientAlertNote[]
): Promise<boolean> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/patient-alert-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId, notes })
    })

    return response.ok
  } catch (error) {
    console.error('Error updating patient alert notes:', error)
    return false
  }
}

// 今日の確認履歴をチェック
export async function checkTodayConfirmation(patientId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({
      patient_id: patientId,
      action: 'check_confirmation',
      date: today
    })

    const response = await fetch(`${baseUrl}/api/patient-alert-notes?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) return false

    const data = await response.json()
    return data.confirmed
  } catch (error) {
    console.error('Error checking today confirmation:', error)
    return false
  }
}

// 今日の確認を記録
export async function recordTodayConfirmation(patientId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/patient-alert-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        action: 'record_confirmation',
        date: today
      })
    })

    return response.ok
  } catch (error) {
    console.error('Error recording today confirmation:', error)
    return false
  }
}
