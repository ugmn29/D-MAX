import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'
const createClient = getSupabaseClient

/**
 * 患者検索API（家族登録用）
 *
 * セキュリティ考慮：
 * - 名前、生年月日、電話番号の3つすべてが一致する場合のみ結果を返す
 * - 電話番号は部分マスキングして返す
 * - 検索結果は最大5件まで
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const birth_date = searchParams.get('birth_date')
    const phone = searchParams.get('phone')

    // バリデーション
    if (!name || !birth_date || !phone) {
      return NextResponse.json(
        { error: '検索には氏名、生年月日、電話番号が必要です' },
        { status: 400 }
      )
    }

    // 電話番号のフォーマット正規化（ハイフンを除去）
    const normalizedPhone = phone.replace(/-/g, '')

    // 生年月日のフォーマット検証（YYYY-MM-DD）
    const birthDatePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!birthDatePattern.test(birth_date)) {
      return NextResponse.json(
        { error: '生年月日の形式が正しくありません（YYYY-MM-DD形式）' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 患者を検索
    // セキュリティのため、すべての条件が一致する場合のみ結果を返す
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, patient_number, last_name, first_name, birth_date, phone, clinic_id')
      .eq('birth_date', birth_date)
      .eq('phone', normalizedPhone)
      .or(`last_name.ilike.%${name}%,first_name.ilike.%${name}%`)
      .limit(5)

    if (error) {
      console.error('患者検索エラー:', error)
      return NextResponse.json(
        { error: '検索に失敗しました' },
        { status: 500 }
      )
    }

    // 結果をマスキングして返す
    const maskedResults = patients.map(patient => ({
      id: patient.id,
      patient_number: patient.patient_number,
      last_name: patient.last_name,
      first_name: patient.first_name,
      birth_date: patient.birth_date,
      // 電話番号を部分マスキング（例: 090-1234-5678 → 090-****-5678）
      phone: maskPhoneNumber(patient.phone),
      clinic_id: patient.clinic_id
    }))

    return NextResponse.json({
      results: maskedResults,
      count: maskedResults.length
    })

  } catch (error) {
    console.error('患者検索API エラー:', error)
    return NextResponse.json(
      { error: '検索処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * 電話番号を部分マスキング
 * 例: 09012345678 → 090-****-5678
 */
function maskPhoneNumber(phone: string): string {
  if (!phone) return ''

  // ハイフンを除去して正規化
  const cleaned = phone.replace(/-/g, '')

  if (cleaned.length === 10) {
    // 固定電話: 0312345678 → 03-****-5678
    return `${cleaned.slice(0, 2)}-****-${cleaned.slice(-4)}`
  } else if (cleaned.length === 11) {
    // 携帯電話: 09012345678 → 090-****-5678
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(-4)}`
  } else {
    // その他の形式
    return '***-****-****'
  }
}
