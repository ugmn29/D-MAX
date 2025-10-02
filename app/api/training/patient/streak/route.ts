import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが必要です' },
        { status: 400 }
      )
    }

    // 過去30日分の実施記録を取得（日付ごとにグループ化）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: records } = await supabaseAdmin
      .from('training_records')
      .select('performed_at, completed')
      .eq('patient_id', patientId)
      .eq('completed', true)
      .gte('performed_at', thirtyDaysAgo.toISOString())
      .order('performed_at', { ascending: false })

    if (!records || records.length === 0) {
      return NextResponse.json({ success: true, streak: 0 })
    }

    // 日付ごとにユニークな日を抽出
    const uniqueDates = new Set(
      records.map(r => new Date(r.performed_at).toISOString().split('T')[0])
    )
    const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a))

    // 連続日数を計算
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    let currentDate = new Date(today)

    for (const date of sortedDates) {
      const checkDate = currentDate.toISOString().split('T')[0]

      if (date === checkDate) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return NextResponse.json({
      success: true,
      streak
    })

  } catch (error) {
    console.error('Streak API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
