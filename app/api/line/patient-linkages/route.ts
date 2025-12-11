import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

/**
 * GET /api/line/patient-linkages?patient_id=xxx
 * 患者IDからLINE連携情報を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const patient_id = searchParams.get('patient_id')

    if (!patient_id) {
      return NextResponse.json(
        { error: '患者IDは必須です' },
        { status: 400 }
      )
    }

    // 患者に紐づく LINE連携情報を取得
    const { data: linkages, error } = await supabase
      .from('line_patient_linkages')
      .select('*')
      .eq('patient_id', patient_id)
      .order('is_primary', { ascending: false })
      .order('linked_at', { ascending: false })

    if (error) {
      console.error('LINE連携情報の取得エラー:', error)
      return NextResponse.json(
        { error: 'LINE連携情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ linkages: linkages || [] })

  } catch (error) {
    console.error('LINE連携情報の取得エラー:', error)
    return NextResponse.json(
      { error: 'LINE連携情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
