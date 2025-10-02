import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, clinicId, trainingId, menuId, completed, actualDurationSeconds } = body

    if (!patientId || !clinicId || !trainingId || !menuId) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    // 時間帯を判定
    const hour = new Date().getHours()
    let timeOfDay = 'morning'
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon'
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening'
    else if (hour >= 21 || hour < 6) timeOfDay = 'night'

    // トレーニング記録を保存
    const { data, error } = await supabaseAdmin
      .from('training_records')
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        training_id: trainingId,
        menu_id: menuId,
        completed: completed || false,
        interrupted: !completed,
        time_of_day: timeOfDay,
        actual_duration_seconds: actualDurationSeconds,
        performed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Record insert error:', error)
      return NextResponse.json(
        { error: '記録の保存に失敗しました', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      record: data
    })

  } catch (error) {
    console.error('Complete API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
