import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

export interface Questionnaire {
  id: string
  clinic_id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  questions?: Question[]
}

export interface Question {
  id: string
  questionnaire_id: string
  question_text: string
  question_type: 'text' | 'radio' | 'checkbox' | 'select' | 'textarea'
  options?: string[]
  is_required: boolean
  sort_order: number
}

/**
 * 問診表一覧を取得
 */
export async function getQuestionnaires(clinicId: string): Promise<Questionnaire[]> {
  // MOCK_MODEの場合はlocalStorageから取得
  if (MOCK_MODE) {
    try {
      const { getMockQuestionnaires } = await import('@/lib/utils/mock-mode')
      const mockQuestionnaires = getMockQuestionnaires()
      console.log('MOCK_MODE: localStorageから問診表データを取得:', mockQuestionnaires.length, '件')
      return mockQuestionnaires
    } catch (mockError) {
      console.error('MOCK_MODE問診表データ取得エラー:', mockError)
      return []
    }
  }

  // 本番モードではデータベースから取得
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaires')
    .select(`
      *,
      questions (
        id,
        questionnaire_id,
        question_text,
        question_type,
        options,
        is_required,
        sort_order
      )
    `)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('問診表取得エラー:', error)
    throw error
  }

  return data || []
}

/**
 * 新しい問診表を作成
 */
export async function createQuestionnaire(clinicId: string, questionnaireData: {
  name: string
  description?: string
  is_active?: boolean
}): Promise<Questionnaire> {
  // MOCK_MODEの場合はlocalStorageに保存
  if (MOCK_MODE) {
    try {
      const { addMockQuestionnaire } = await import('@/lib/utils/mock-mode')
      const newQuestionnaire = {
        id: `q_${Date.now()}`,
        clinic_id: clinicId,
        name: questionnaireData.name,
        description: questionnaireData.description || '',
        is_active: questionnaireData.is_active !== undefined ? questionnaireData.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        questions: []
      }
      return addMockQuestionnaire(newQuestionnaire)
    } catch (mockError) {
      console.error('MOCK_MODE問診表作成エラー:', mockError)
      throw mockError
    }
  }

  // 本番モードではデータベースに保存
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaires')
    .insert({
      clinic_id: clinicId,
      name: questionnaireData.name,
      description: questionnaireData.description || '',
      is_active: questionnaireData.is_active !== undefined ? questionnaireData.is_active : true
    })
    .select()
    .single()

  if (error) {
    console.error('問診表作成エラー:', error)
    throw error
  }

  return data
}

/**
 * 問診表を更新
 */
export async function updateQuestionnaire(questionnaireId: string, updates: {
  name?: string
  description?: string
  is_active?: boolean
}): Promise<Questionnaire> {
  // MOCK_MODEの場合はlocalStorageを更新
  if (MOCK_MODE) {
    try {
      const { updateMockQuestionnaire } = await import('@/lib/utils/mock-mode')
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      const result = updateMockQuestionnaire(questionnaireId, updateData)
      if (!result) {
        throw new Error('Questionnaire not found')
      }
      return result
    } catch (mockError) {
      console.error('MOCK_MODE問診表更新エラー:', mockError)
      throw mockError
    }
  }

  // 本番モードではデータベースを更新
  const client = getSupabaseClient()
  const updateData: any = {
    updated_at: new Date().toISOString()
  }
  
  if (updates.name) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.is_active !== undefined) updateData.is_active = updates.is_active

  const { data, error } = await client
    .from('questionnaires')
    .update(updateData)
    .eq('id', questionnaireId)
    .select()
    .single()

  if (error) {
    console.error('問診表更新エラー:', error)
    throw error
  }

  if (!data) {
    throw new Error('Questionnaire not found')
  }

  return data
}

/**
 * 問診表を削除
 */
export async function deleteQuestionnaire(questionnaireId: string): Promise<void> {
  // MOCK_MODEの場合はlocalStorageから削除
  if (MOCK_MODE) {
    try {
      const { removeMockQuestionnaire } = await import('@/lib/utils/mock-mode')
      removeMockQuestionnaire(questionnaireId)
      return
    } catch (mockError) {
      console.error('MOCK_MODE問診表削除エラー:', mockError)
      throw mockError
    }
  }

  // 本番モードではデータベースから削除
  const client = getSupabaseClient()
  const { error } = await client
    .from('questionnaires')
    .delete()
    .eq('id', questionnaireId)

  if (error) {
    console.error('問診表削除エラー:', error)
    throw error
  }
}

// 互換性のためのダミー関数（既存コンポーネント用）
export async function debugQuestionnaireResponses(): Promise<any[]> {
  console.log('debugQuestionnaireResponses: ダミー関数')
  return []
}

export async function getUnlinkedQuestionnaireResponses(): Promise<any[]> {
  console.log('getUnlinkedQuestionnaireResponses: ダミー関数')
  return []
}

export async function linkQuestionnaireResponseToPatient(responseId: string, patientId: string): Promise<void> {
  console.log('linkQuestionnaireResponseToPatient: ダミー関数', { responseId, patientId })
}

export async function unlinkQuestionnaireResponse(responseId: string): Promise<void> {
  console.log('unlinkQuestionnaireResponse: ダミー関数', { responseId })
}

export async function getLinkedQuestionnaireResponse(patientId: string): Promise<any | null> {
  console.log('getLinkedQuestionnaireResponse: ダミー関数', { patientId })
  return null
}

export async function getLinkedQuestionnaireResponses(): Promise<any[]> {
  console.log('getLinkedQuestionnaireResponses: ダミー関数')
  return []
}