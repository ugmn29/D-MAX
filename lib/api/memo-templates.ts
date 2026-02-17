// Migrated to Prisma API Routes

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

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

// メモテンプレート一覧を取得
export async function getMemoTemplates(clinicId: string): Promise<MemoTemplate[]> {
  try {
    const response = await fetch(`${baseUrl}/api/memo-templates?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'メモテンプレートの取得に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('メモテンプレート取得エラー:', error)
    return []
  }
}

// メモテンプレートを作成
export async function createMemoTemplate(clinicId: string, templateData: {
  name: string
  is_active?: boolean
  sort_order?: number
}): Promise<MemoTemplate> {
  try {
    const response = await fetch(`${baseUrl}/api/memo-templates?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'メモテンプレートの作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('メモテンプレート作成エラー:', error)
    throw error
  }
}

// メモテンプレートを更新
export async function updateMemoTemplate(clinicId: string, id: string, templateData: {
  name?: string
  is_active?: boolean
  sort_order?: number
}): Promise<MemoTemplate> {
  try {
    const response = await fetch(`${baseUrl}/api/memo-templates/${id}?clinic_id=${clinicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'メモテンプレートの更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('メモテンプレート更新エラー:', error)
    throw error
  }
}

// メモテンプレートを削除（論理削除）
export async function deleteMemoTemplate(clinicId: string, id: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/memo-templates/${id}?clinic_id=${clinicId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'メモテンプレートの削除に失敗しました')
    }
  } catch (error) {
    console.error('メモテンプレート削除エラー:', error)
    throw error
  }
}
