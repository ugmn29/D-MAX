import { getSupabaseClient } from '@/lib/utils/supabase-client'

export interface MemoTemplate {
  id: string
  clinic_id: string
  name: string
  content: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// メモテンプレート一覧を取得
export async function getMemoTemplates(clinicId: string): Promise<MemoTemplate[]> {
  const { MOCK_MODE } = await import('@/lib/utils/mock-mode')
  if (MOCK_MODE) {
    console.log('モックモード: メモテンプレートを取得します')

    const { getMockMemoTemplates } = await import('@/lib/utils/mock-mode')
    const templates = getMockMemoTemplates()

    // sort_orderでソート
    const sortedTemplates = templates.sort((a, b) => a.sort_order - b.sort_order)

    console.log('モックモード: 取得したメモテンプレート:', sortedTemplates)
    return sortedTemplates
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('memo_templates')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('メモテンプレート取得エラー:', error)
    throw error
  }

  return data || []
}

// メモテンプレートを作成
export async function createMemoTemplate(clinicId: string, templateData: {
  name: string
  is_active?: boolean
  sort_order?: number
}): Promise<MemoTemplate> {
  const { MOCK_MODE } = await import('@/lib/utils/mock-mode')
  if (MOCK_MODE) {
    console.log('モックモード: メモテンプレートを作成します')

    const { getMockMemoTemplates, saveToStorage } = await import('@/lib/utils/mock-mode')
    const existingTemplates = getMockMemoTemplates()

    const newTemplate: MemoTemplate = {
      id: `memo-template-${Date.now()}`,
      clinic_id: clinicId,
      name: templateData.name,
      content: templateData.name, // 名前をそのまま内容として使用
      is_active: templateData.is_active ?? true,
      sort_order: templateData.sort_order ?? existingTemplates.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updatedTemplates = [...existingTemplates, newTemplate]
    saveToStorage('mock_memo_templates', updatedTemplates)

    return newTemplate
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('memo_templates')
    .insert({
      clinic_id: clinicId,
      ...templateData,
      content: templateData.name // 名前をそのまま内容として使用
    })
    .select()
    .single()

  if (error) {
    console.error('メモテンプレート作成エラー:', error)
    throw error
  }

  return data
}

// メモテンプレートを更新
export async function updateMemoTemplate(clinicId: string, id: string, templateData: {
  name?: string
  is_active?: boolean
  sort_order?: number
}): Promise<MemoTemplate> {
  const { MOCK_MODE } = await import('@/lib/utils/mock-mode')
  if (MOCK_MODE) {
    console.log('モックモード: メモテンプレートを更新します')

    const { getMockMemoTemplates, saveToStorage } = await import('@/lib/utils/mock-mode')
    const existingTemplates = getMockMemoTemplates()

    const updatedTemplates = existingTemplates.map(template =>
      template.id === id
        ? {
            ...template,
            ...templateData,
            content: templateData.name || template.content, // 名前が更新されたら内容も同じに
            updated_at: new Date().toISOString()
          }
        : template
    )

    saveToStorage('mock_memo_templates', updatedTemplates)

    const updatedTemplate = updatedTemplates.find(template => template.id === id)
    if (!updatedTemplate) {
      throw new Error('メモテンプレートが見つかりません')
    }

    return updatedTemplate
  }

  // 名前が更新される場合は内容も同じにする
  const updateData = {
    ...templateData,
    ...(templateData.name ? { content: templateData.name } : {})
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('memo_templates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('メモテンプレート更新エラー:', error)
    throw error
  }

  return data
}

// メモテンプレートを削除（論理削除）
export async function deleteMemoTemplate(clinicId: string, id: string): Promise<void> {
  const { MOCK_MODE } = await import('@/lib/utils/mock-mode')
  if (MOCK_MODE) {
    console.log('モックモード: メモテンプレートを削除します')

    const { getMockMemoTemplates, saveToStorage } = await import('@/lib/utils/mock-mode')
    const existingTemplates = getMockMemoTemplates()

    const updatedTemplates = existingTemplates.filter(template => template.id !== id)
    saveToStorage('mock_memo_templates', updatedTemplates)

    return
  }

  const client = getSupabaseClient()
  const { error } = await client
    .from('memo_templates')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('メモテンプレート削除エラー:', error)
    throw error
  }
}
