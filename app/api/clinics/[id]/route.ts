import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('id, name, slug')
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'クリニックが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('クリニック取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'クリニック情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { slug } = body

    if (!slug) {
      return NextResponse.json(
        { error: 'URLスラッグが必要です' },
        { status: 400 }
      )
    }

    // スラッグのバリデーション（英数字とハイフンのみ）
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'URLスラッグは英小文字、数字、ハイフンのみ使用できます' },
        { status: 400 }
      )
    }

    // 重複チェック
    const { data: existing } = await supabase
      .from('clinics')
      .select('id')
      .eq('slug', slug)
      .neq('id', params.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'このURLスラッグは既に使用されています' },
        { status: 409 }
      )
    }

    // スラッグを更新
    const { data, error } = await supabase
      .from('clinics')
      .update({ slug })
      .eq('id', params.id)
      .select('id, name, slug')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('クリニック更新エラー:', error)
    return NextResponse.json(
      { error: error.message || 'クリニック情報の更新に失敗しました' },
      { status: 500 }
    )
  }
}
