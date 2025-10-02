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

    // アクティブなトレーニングメニューを取得
    const { data: menuData, error: menuError } = await supabaseAdmin
      .from('training_menus')
      .select(`
        id,
        menu_trainings (
          id,
          sort_order,
          action_seconds,
          rest_seconds,
          sets,
          trainings (
            id,
            training_name
          )
        )
      `)
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .single()

    if (menuError) {
      console.error('Menu fetch error:', menuError)
      return NextResponse.json(
        { error: 'メニューが見つかりません', details: menuError },
        { status: 404 }
      )
    }

    // 今日の完了記録を取得
    const today = new Date().toISOString().split('T')[0]
    const { data: recordsData } = await supabaseAdmin
      .from('training_records')
      .select('training_id')
      .eq('patient_id', patientId)
      .eq('completed', true)
      .gte('performed_at', `${today}T00:00:00`)
      .lte('performed_at', `${today}T23:59:59`)

    const completedIds = new Set(recordsData?.map(r => r.training_id) || [])

    // トレーニングリストを作成
    const trainingList = (menuData.menu_trainings || [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((mt: any, index: number) => ({
        id: mt.trainings.id,
        training_name: mt.trainings.training_name,
        action_seconds: mt.action_seconds,
        rest_seconds: mt.rest_seconds,
        sets: mt.sets,
        sort_order: mt.sort_order,
        completed: completedIds.has(mt.trainings.id),
        locked: index > 0 && !completedIds.has(menuData.menu_trainings[index - 1].trainings.id)
      }))

    return NextResponse.json({
      success: true,
      trainings: trainingList,
      menuId: menuData.id
    })

  } catch (error) {
    console.error('Menu API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
