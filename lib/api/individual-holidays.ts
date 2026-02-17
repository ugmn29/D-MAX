// Migrated to Prisma API Routes

// 個別休診日の取得（月単位）
export async function getIndividualHolidays(clinicId: string, year: number, month: number): Promise<Record<string, boolean>> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const params = new URLSearchParams({
      clinic_id: clinicId,
      start_date: startDate,
      end_date: endDate
    })

    const response = await fetch(`${baseUrl}/api/individual-holidays?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '個別休診日の取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('個別休診日取得エラー:', error)
    throw error
  }
}

// 個別休診日の設定
export async function setIndividualHoliday(clinicId: string, date: string, isHoliday: boolean): Promise<void> {
  console.log('setIndividualHoliday呼び出し:', { clinicId, date, isHoliday })

  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/individual-holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinicId,
        date,
        is_holiday: isHoliday
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('個別休診日設定エラー:', errorData)
      throw new Error(errorData.error || '個別休診日の設定に失敗しました')
    }
  } catch (error) {
    console.error('個別休診日設定エラー:', error)
    throw error
  }
}

// 個別休診日の削除
export async function deleteIndividualHoliday(clinicId: string, date: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/individual-holidays`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: clinicId,
        date
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('個別休診日削除エラー:', errorData)
      throw new Error(errorData.error || '個別休診日の削除に失敗しました')
    }
  } catch (error) {
    console.error('個別休診日削除エラー:', error)
    throw error
  }
}
