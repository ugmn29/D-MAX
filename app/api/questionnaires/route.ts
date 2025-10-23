import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

// GET: 問診表一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageから取得
    if (MOCK_MODE) {
      try {
        const { getMockQuestionnaires } = await import('@/lib/utils/mock-mode')
        const mockQuestionnaires = getMockQuestionnaires()
        console.log('MOCK_MODE: localStorageから問診表データを取得:', mockQuestionnaires.length, '件')
        return NextResponse.json(mockQuestionnaires)
      } catch (mockError) {
        console.error('MOCK_MODE問診表データ取得エラー:', mockError)
        return NextResponse.json([])
      }
    }

    // 本番モードではデータベースから取得
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('questionnaires')
      .select(`
        *,
        questionnaire_questions (
          id,
          questionnaire_id,
          section_name,
          question_text,
          question_type,
          options,
          is_required,
          conditional_logic,
          sort_order
        )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('問診表取得エラー:', error)
      return NextResponse.json({ error: 'Failed to fetch questionnaires' }, { status: 500 })
    }

    // questionnaire_questions を questions にマッピング
    const mappedData = (data || []).map((questionnaire: any) => ({
      ...questionnaire,
      questions: questionnaire.questionnaire_questions || []
    }))

    // 標準問診表を最初に表示（名前でソート）
    mappedData.sort((a, b) => {
      if (a.name === '標準問診表') return -1
      if (b.name === '標準問診表') return 1
      if (a.name === '習慣チェック表') return 1
      if (b.name === '習慣チェック表') return -1
      return a.name.localeCompare(b.name, 'ja')
    })

    return NextResponse.json(mappedData)
  } catch (error) {
    console.error('問診表API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 新しい問診表を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, name, description, is_active } = body

    if (!clinic_id || !name) {
      return NextResponse.json({ error: 'clinic_id and name are required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageに保存
    if (MOCK_MODE) {
      try {
        const { addMockQuestionnaire } = await import('@/lib/utils/mock-mode')
        const newQuestionnaire = {
          id: `q_${Date.now()}`,
          clinic_id,
          name,
          description: description || '',
          is_active: is_active !== undefined ? is_active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          questions: []
        }
        const result = addMockQuestionnaire(newQuestionnaire)
        return NextResponse.json(result)
      } catch (mockError) {
        console.error('MOCK_MODE問診表作成エラー:', mockError)
        return NextResponse.json({ error: 'Failed to create questionnaire' }, { status: 500 })
      }
    }

    // 本番モードではデータベースに保存
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('questionnaires')
      .insert({
        clinic_id,
        name,
        description: description || '',
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (error) {
      console.error('問診表作成エラー:', error)
      return NextResponse.json({ error: 'Failed to create questionnaire' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('問診表作成API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: 問診表を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageを更新
    if (MOCK_MODE) {
      try {
        const { updateMockQuestionnaire } = await import('@/lib/utils/mock-mode')
        const updates = {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(is_active !== undefined && { is_active }),
          updated_at: new Date().toISOString()
        }
        const result = updateMockQuestionnaire(id, updates)
        if (!result) {
          return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 })
        }
        return NextResponse.json(result)
      } catch (mockError) {
        console.error('MOCK_MODE問診表更新エラー:', mockError)
        return NextResponse.json({ error: 'Failed to update questionnaire' }, { status: 500 })
      }
    }

    // 本番モードではデータベースを更新
    const client = getSupabaseClient()
    const updates: any = {
      updated_at: new Date().toISOString()
    }
    
    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await client
      .from('questionnaires')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('問診表更新エラー:', error)
      return NextResponse.json({ error: 'Failed to update questionnaire' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('問診表更新API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 問診表を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageから削除
    if (MOCK_MODE) {
      try {
        const { removeMockQuestionnaire } = await import('@/lib/utils/mock-mode')
        removeMockQuestionnaire(id)
        return NextResponse.json({ success: true })
      } catch (mockError) {
        console.error('MOCK_MODE問診表削除エラー:', mockError)
        return NextResponse.json({ error: 'Failed to delete questionnaire' }, { status: 500 })
      }
    }

    // 本番モードではデータベースから削除
    const client = getSupabaseClient()
    const { error } = await client
      .from('questionnaires')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('問診表削除エラー:', error)
      return NextResponse.json({ error: 'Failed to delete questionnaire' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('問診表削除API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
