import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export const dynamic = 'force-dynamic'

/**
 * C分類マッピング情報を取得するAPI
 * 習慣チェック表の質問にC分類バッジを表示するために使用
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    // C分類マッピング情報を取得
    const { data: mappings, error } = await supabase
      .from('c_classification_question_mapping')
      .select('*')
      .order('c_classification_item')

    if (error) {
      console.error('マッピング情報取得エラー:', error)
      return NextResponse.json(
        { error: 'マッピング情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // section_name + question_text をキーとしたマップを作成
    const mappingMap = new Map<string, string[]>()

    mappings?.forEach((mapping) => {
      const key = `${mapping.section_name}::${mapping.question_text}`
      if (!mappingMap.has(key)) {
        mappingMap.set(key, [])
      }
      mappingMap.get(key)?.push(mapping.c_classification_item)
    })

    // オブジェクト形式に変換
    const mappingObject: Record<string, string[]> = {}
    mappingMap.forEach((value, key) => {
      mappingObject[key] = value
    })

    return NextResponse.json({
      success: true,
      mappings: mappingObject,
      rawMappings: mappings,
    })
  } catch (error) {
    console.error('マッピング情報取得エラー:', error)
    return NextResponse.json(
      { error: '処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * C分類マッピング情報を更新するAPI
 * 質問編集時に呼び出される
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { section_name, question_text, c_classification_items } = body

    if (!section_name || !question_text) {
      return NextResponse.json(
        { error: 'section_nameとquestion_textは必須です' },
        { status: 400 }
      )
    }

    // 既存のマッピングを削除
    const { error: deleteError } = await supabase
      .from('c_classification_question_mapping')
      .delete()
      .eq('section_name', section_name)
      .eq('question_text', question_text)

    if (deleteError) {
      console.error('既存マッピング削除エラー:', deleteError)
      return NextResponse.json(
        { error: '既存マッピングの削除に失敗しました' },
        { status: 500 }
      )
    }

    // 新しいマッピングを追加
    if (c_classification_items && c_classification_items.length > 0) {
      const mappingsToInsert = c_classification_items.map((cItem: string, index: number) => ({
        section_name,
        question_text,
        c_classification_item: cItem,
        matching_condition: { operator: 'has_any_value' }, // デフォルトの条件
        priority: 1,
        created_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase
        .from('c_classification_question_mapping')
        .insert(mappingsToInsert)

      if (insertError) {
        console.error('マッピング追加エラー:', insertError)
        return NextResponse.json(
          { error: 'マッピングの追加に失敗しました' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'マッピング情報を更新しました',
    })
  } catch (error) {
    console.error('マッピング更新エラー:', error)
    return NextResponse.json(
      { error: '処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
