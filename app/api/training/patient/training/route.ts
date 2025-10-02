import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trainingId = searchParams.get('trainingId')
    const patientId = searchParams.get('patientId')

    if (!trainingId || !patientId) {
      return NextResponse.json(
        { error: 'トレーニングIDと患者IDが必要です' },
        { status: 400 }
      )
    }

    // トレーニング詳細を取得
    const { data: training, error: trainingError } = await supabaseAdmin
      .from('trainings')
      .select('*')
      .eq('id', trainingId)
      .single()

    if (trainingError || !training) {
      console.error('Training fetch error:', trainingError)
      return NextResponse.json(
        { error: 'トレーニングが見つかりません' },
        { status: 404 }
      )
    }

    // 患者のアクティブメニューから設定を取得
    const { data: menuTraining } = await supabaseAdmin
      .from('training_menus')
      .select(`
        id,
        menu_trainings!inner (
          action_seconds,
          rest_seconds,
          sets
        )
      `)
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .eq('menu_trainings.training_id', trainingId)
      .single()

    // メニューの設定がある場合はそれを使用、なければデフォルト値
    const config = menuTraining?.menu_trainings?.[0] || {
      action_seconds: training.default_action_seconds,
      rest_seconds: training.default_rest_seconds,
      sets: training.default_sets
    }

    return NextResponse.json({
      success: true,
      training: {
        id: training.id,
        training_name: training.training_name,
        description: training.description,
        category: training.category,
        animation_storage_path: training.animation_storage_path,
        mirror_display: training.mirror_display,
        action_seconds: config.action_seconds,
        rest_seconds: config.rest_seconds,
        sets: config.sets
      },
      menuId: menuTraining?.id || null
    })

  } catch (error) {
    console.error('Training API error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
