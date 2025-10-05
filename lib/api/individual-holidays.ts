import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

// 個別休診日の取得（月単位）
export async function getIndividualHolidays(clinicId: string, year: number, month: number): Promise<Record<string, boolean>> {
  // モックモードの場合はlocalStorageから取得
  if (MOCK_MODE) {
    console.log('モックモード: 個別休診日データを取得します', { clinicId, year, month })
    try {
      const savedHolidays = localStorage.getItem('mock_individual_holidays')
      if (savedHolidays) {
        const holidaysData = JSON.parse(savedHolidays)
        console.log('モックモード: 取得した個別休診日:', holidaysData)
        return holidaysData
      }
    } catch (error) {
      console.error('モックモード: localStorage読み込みエラー:', error)
    }
    console.log('モックモード: 個別休診日データを返します（空オブジェクト）')
    return {}
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('individual_holidays')
    .select('date, is_holiday')
    .eq('clinic_id', clinicId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    console.error('個別休診日取得エラー:', error)
    throw error
  }

  // 日付をキーとしたオブジェクトに変換
  const holidaysMap: Record<string, boolean> = {}
  data?.forEach(item => {
    holidaysMap[item.date] = item.is_holiday
  })

  return holidaysMap
}

// 個別休診日の設定
export async function setIndividualHoliday(clinicId: string, date: string, isHoliday: boolean): Promise<void> {
  console.log('setIndividualHoliday呼び出し:', { clinicId, date, isHoliday })
  
  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    console.log('モックモード: 個別休診日を保存します', { clinicId, date, isHoliday })
    try {
      const savedHolidays = localStorage.getItem('mock_individual_holidays')
      const holidaysData = savedHolidays ? JSON.parse(savedHolidays) : {}
      const dateKey = `${clinicId}_${date}`
      holidaysData[dateKey] = isHoliday
      localStorage.setItem('mock_individual_holidays', JSON.stringify(holidaysData))
      console.log('モックモード: 個別休診日を保存しました', holidaysData)
    } catch (error) {
      console.error('モックモード: localStorage保存エラー:', error)
      throw error
    }
    return
  }
  
  const upsertData = {
    clinic_id: clinicId,
    date: date,
    is_holiday: isHoliday
  }
  
  console.log('Supabaseに送信するデータ:', upsertData)
  
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('individual_holidays')
    .upsert(upsertData, { onConflict: 'clinic_id,date' })
    .select()

  console.log('setIndividualHolidayレスポンス:', { data, error })

  if (error) {
    console.error('個別休診日設定エラー:', error)
    console.error('エラーの詳細:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw error
  }
}

// 個別休診日の削除
export async function deleteIndividualHoliday(clinicId: string, date: string): Promise<void> {
  // モックモードの場合はlocalStorageから削除
  if (MOCK_MODE) {
    console.log('モックモード: 個別休診日を削除します', { clinicId, date })
    try {
      const savedHolidays = localStorage.getItem('mock_individual_holidays')
      if (savedHolidays) {
        const holidaysData = JSON.parse(savedHolidays)
        const dateKey = `${clinicId}_${date}`
        if (holidaysData[dateKey]) {
          delete holidaysData[dateKey]
          localStorage.setItem('mock_individual_holidays', JSON.stringify(holidaysData))
          console.log('モックモード: 個別休診日を削除しました', holidaysData)
        }
      }
    } catch (error) {
      console.error('モックモード: localStorage削除エラー:', error)
      throw error
    }
    return
  }
  
  const client = getSupabaseClient()
  const { error } = await client
    .from('individual_holidays')
    .delete()
    .eq('clinic_id', clinicId)
    .eq('date', date)

  if (error) {
    console.error('個別休診日削除エラー:', error)
    throw error
  }
}
