import { supabase } from '@/lib/supabase'

export interface MemoTodoTemplate {
  id: string
  clinic_id: string
  name: string
  items: string // 改行区切りでTODO項目を保存
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateMemoTodoTemplateInput {
  clinic_id: string
  name: string
  items: string
  sort_order?: number
  is_active?: boolean
}

export interface UpdateMemoTodoTemplateInput {
  name?: string
  items?: string
  sort_order?: number
  is_active?: boolean
}

const LOCAL_STORAGE_KEY = 'memo_todo_templates'

// ローカルストレージからテンプレートを取得
function getLocalTemplates(): MemoTodoTemplate[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// ローカルストレージにテンプレートを保存
function saveLocalTemplates(templates: MemoTodoTemplate[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates))
}

// テンプレート一覧取得（ローカル優先、DBフォールバック）
export async function getMemoTodoTemplates(clinicId: string): Promise<MemoTodoTemplate[]> {
  // まずローカルストレージから取得
  const localTemplates = getLocalTemplates()
  if (localTemplates.length > 0) {
    return localTemplates.filter(t => t.clinic_id === clinicId).sort((a, b) => a.sort_order - b.sort_order)
  }

  // ローカルにない場合はDBから取得を試みる
  try {
    const { data, error } = await supabase
      .from('memo_todo_templates')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching memo todo templates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching memo todo templates:', error)
    return []
  }
}

// 有効なテンプレート一覧取得（サブカルテ・治療計画で使用）
export async function getActiveMemoTodoTemplates(clinicId: string): Promise<MemoTodoTemplate[]> {
  // まずローカルストレージから取得
  const localTemplates = getLocalTemplates()
  console.log('getActiveMemoTodoTemplates - clinicId:', clinicId)
  console.log('getActiveMemoTodoTemplates - all localTemplates:', localTemplates)
  if (localTemplates.length > 0) {
    const filtered = localTemplates
      .filter(t => t.clinic_id === clinicId && t.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
    console.log('getActiveMemoTodoTemplates - filtered templates:', filtered)
    return filtered
  }

  // ローカルにない場合はDBから取得を試みる
  try {
    const { data, error } = await supabase
      .from('memo_todo_templates')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching active memo todo templates:', error)
      return []
    }

    console.log('Loaded memo todo templates from DB:', data)
    return data || []
  } catch (error) {
    console.error('Error fetching active memo todo templates:', error)
    return []
  }
}

// テンプレート取得
export async function getMemoTodoTemplate(id: string): Promise<MemoTodoTemplate | null> {
  // ローカルから検索
  const localTemplates = getLocalTemplates()
  const localTemplate = localTemplates.find(t => t.id === id)
  if (localTemplate) return localTemplate

  // DBから取得を試みる
  try {
    const { data, error } = await supabase
      .from('memo_todo_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching memo todo template:', error)
      return null
    }

    return data
  } catch {
    return null
  }
}

// テンプレート作成（ローカルストレージに保存）
export async function createMemoTodoTemplate(input: CreateMemoTodoTemplateInput): Promise<MemoTodoTemplate> {
  const now = new Date().toISOString()
  const newTemplate: MemoTodoTemplate = {
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    clinic_id: input.clinic_id,
    name: input.name,
    items: input.items,
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
    created_at: now,
    updated_at: now,
  }

  console.log('createMemoTodoTemplate - new template:', newTemplate)
  const templates = getLocalTemplates()
  console.log('createMemoTodoTemplate - existing templates:', templates)
  templates.push(newTemplate)
  saveLocalTemplates(templates)
  console.log('createMemoTodoTemplate - saved templates:', templates)

  return newTemplate
}

// テンプレート更新（ローカルストレージ）
export async function updateMemoTodoTemplate(
  id: string,
  input: UpdateMemoTodoTemplateInput
): Promise<MemoTodoTemplate> {
  const templates = getLocalTemplates()
  const index = templates.findIndex(t => t.id === id)

  if (index === -1) {
    throw new Error('Template not found')
  }

  templates[index] = {
    ...templates[index],
    ...input,
    updated_at: new Date().toISOString(),
  }

  saveLocalTemplates(templates)
  return templates[index]
}

// テンプレート削除（ローカルストレージ）
export async function deleteMemoTodoTemplate(id: string): Promise<void> {
  const templates = getLocalTemplates()
  const filtered = templates.filter(t => t.id !== id)
  saveLocalTemplates(filtered)
}

// 並び順更新
export async function updateMemoTodoTemplateOrder(
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  const templates = getLocalTemplates()

  updates.forEach(({ id, sort_order }) => {
    const template = templates.find(t => t.id === id)
    if (template) {
      template.sort_order = sort_order
      template.updated_at = new Date().toISOString()
    }
  })

  saveLocalTemplates(templates)
}

// テンプレートのTODO項目を配列として取得
export function parseTemplateItems(items: string): string[] {
  return items
    .split('\n')
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

// TODO項目を改行区切りテキストに変換
export function formatTemplateItems(items: string[]): string {
  return items.filter(item => item.trim().length > 0).join('\n')
}
