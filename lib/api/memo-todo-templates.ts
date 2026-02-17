// Migrated to Prisma API Routes

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

function getBaseUrl(): string {
  return typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    : ''
}

// テンプレート一覧取得
export async function getMemoTodoTemplates(clinicId: string): Promise<MemoTodoTemplate[]> {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/memo-todo-templates?clinic_id=${encodeURIComponent(clinicId)}`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Error fetching memo todo templates:', error)
    return []
  }
}

// 有効なテンプレート一覧取得（サブカルテ・治療計画で使用）
export async function getActiveMemoTodoTemplates(clinicId: string): Promise<MemoTodoTemplate[]> {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/memo-todo-templates?clinic_id=${encodeURIComponent(clinicId)}&active_only=true`)
    if (!response.ok) return []
    const data = await response.json()
    return data || []
  } catch (error) {
    console.error('Error fetching active memo todo templates:', error)
    return []
  }
}

// テンプレート取得
export async function getMemoTodoTemplate(id: string): Promise<MemoTodoTemplate | null> {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/memo-todo-templates?id=${encodeURIComponent(id)}`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// テンプレート作成
export async function createMemoTodoTemplate(input: CreateMemoTodoTemplateInput): Promise<MemoTodoTemplate> {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/memo-todo-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create memo todo template: ${error}`)
  }

  return await response.json()
}

// テンプレート更新
export async function updateMemoTodoTemplate(
  id: string,
  input: UpdateMemoTodoTemplateInput
): Promise<MemoTodoTemplate> {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/memo-todo-templates`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...input }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update memo todo template: ${error}`)
  }

  return await response.json()
}

// テンプレート削除
export async function deleteMemoTodoTemplate(id: string): Promise<void> {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/memo-todo-templates?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to delete memo todo template: ${error}`)
  }
}

// 並び順更新
export async function updateMemoTodoTemplateOrder(
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  const baseUrl = getBaseUrl()
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      fetch(`${baseUrl}/api/memo-todo-templates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, sort_order }),
      })
    )
  )
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
