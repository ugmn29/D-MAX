import { supabase } from '@/lib/supabase'

// 個別休診日の取得（月単位）
export async function getIndividualHolidays(clinicId: string, year: number, month: number): Promise<Record<string, boolean>> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  
  const { data, error } = await supabase
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
  
  const upsertData = {
    clinic_id: clinicId,
    date: date,
    is_holiday: isHoliday
  }
  
  console.log('Supabaseに送信するデータ:', upsertData)
  
  const { data, error } = await supabase
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
  const { error } = await supabase
    .from('individual_holidays')
    .delete()
    .eq('clinic_id', clinicId)
    .eq('date', date)

  if (error) {
    console.error('個別休診日削除エラー:', error)
    throw error
  }
}
