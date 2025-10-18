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

export interface QuestionnaireResponse {
  id: string
  questionnaire_id: string
  patient_id: string | null
  appointment_id?: string | null
  response_data: any
  completed_at: string
  created_at: string
  updated_at: string
  patient_name?: string
  questionnaire?: Questionnaire
}

/**
 * 問診表一覧を取得
 */
export async function getQuestionnaires(clinicId: string): Promise<Questionnaire[]> {
  // MOCK_MODEの場合はlocalStorageから取得
  if (MOCK_MODE) {
    try {
      const { getMockQuestionnaires, initializeMockData } = await import('@/lib/utils/mock-mode')

      // モックデータの初期化
      initializeMockData()

      const questionnaires = getMockQuestionnaires()
      console.log('MOCK_MODE: 問診表取得成功 - データ件数:', questionnaires.length)
      console.log('MOCK_MODE: 問診表取得成功 - データ:', questionnaires)
      return questionnaires.filter(q => q.clinic_id === clinicId)
    } catch (mockError) {
      console.error('MOCK_MODE問診表取得エラー:', mockError)
      return []
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
    throw error
  }

  console.log('問診表取得成功 - 生データ:', data)
  console.log('問診表取得成功 - データ件数:', data?.length)

  // questionnaire_questions を questions にマッピング
  const mappedData = (data || []).map((questionnaire: any) => ({
    ...questionnaire,
    questions: questionnaire.questionnaire_questions || []
  }))

  console.log('問診表取得成功 - マッピング後:', mappedData)
  console.log('問診表取得成功 - マッピング後件数:', mappedData.length)

  return mappedData
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

/**
 * 問診表の回答を保存し、患者情報を自動作成/更新
 */
export async function createQuestionnaireResponse(responseData: {
  questionnaire_id: string
  patient_id?: string
  appointment_id?: string
  response_data: any
  completed_at: string
}): Promise<string> {
  const responseId = `response-${Date.now()}`

  if (MOCK_MODE) {
    try {
      // 問診表回答データからの患者情報を抽出
      const { response_data } = responseData
      const patientData: any = {
        clinic_id: '11111111-1111-1111-1111-111111111111',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 氏名を分割（姓・名）
      const fullName = response_data['q1-1'] || ''
      const fullNameKana = response_data['q1-2'] || ''

      // スペースで分割（姓名）
      const nameParts = fullName.split(/\s+/)
      const kanaNameParts = fullNameKana.split(/\s+/)

      patientData.last_name = nameParts[0] || ''
      patientData.first_name = nameParts[1] || ''
      patientData.last_name_kana = kanaNameParts[0] || ''
      patientData.first_name_kana = kanaNameParts[1] || ''

      // その他の基本情報
      patientData.gender = response_data['q1-3'] || null
      patientData.birth_date = response_data['q1-4'] || null
      patientData.phone = response_data['q1-9'] || response_data['q1-8'] || null
      patientData.email = response_data['q1-10'] || null
      patientData.address = response_data['q1-6'] || null
      patientData.postal_code = response_data['q1-5'] || null

      // アレルギー情報
      const allergyTypes = response_data['q3-4'] || []
      const allergyCause = response_data['q3-5'] || ''
      if (Array.isArray(allergyTypes) && allergyTypes.length > 0 && !allergyTypes.includes('ない')) {
        patientData.allergies = `${allergyTypes.join(', ')}${allergyCause ? ` (原因: ${allergyCause})` : ''}`
      } else if (allergyCause) {
        patientData.allergies = allergyCause
      }

      // 持病情報
      const diseases = response_data['q3-6'] || []
      const diseaseDetails = response_data['q3-8'] || ''
      if (Array.isArray(diseases) && diseases.length > 0) {
        const diseaseList = diseases.join(', ')
        patientData.medical_history = diseaseDetails ? `${diseaseList} - ${diseaseDetails}` : diseaseList
      } else if (diseaseDetails) {
        patientData.medical_history = diseaseDetails
      }

      // 患者IDが指定されている場合のみ患者情報を更新
      // 指定されていない場合は未連携として保存
      let finalPatientId = responseData.patient_id

      if (finalPatientId) {
        // 既存患者を更新
        const { updateMockPatient } = await import('@/lib/utils/mock-mode')
        updateMockPatient(finalPatientId, patientData)
        console.log('患者情報を更新しました:', finalPatientId)
      }

      // 問診表回答を保存（localStorageに）
      // patient_idが指定されていない場合はnullで保存（未連携状態）
      const responses = JSON.parse(localStorage.getItem('questionnaire_responses') || '[]')
      const newResponse = {
        id: responseId,
        questionnaire_id: responseData.questionnaire_id,
        patient_id: finalPatientId || null,
        appointment_id: responseData.appointment_id || null,
        response_data: responseData.response_data,
        completed_at: responseData.completed_at,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      responses.push(newResponse)
      localStorage.setItem('questionnaire_responses', JSON.stringify(responses))

      console.log('問診表回答を保存しました:', {
        responseId,
        patient_id: finalPatientId,
        isLinked: !!finalPatientId,
        isUnlinked: !finalPatientId
      })

      return responseId
    } catch (error) {
      console.error('MOCK_MODE問診表回答保存エラー:', error)
      throw error
    }
  }

  // 本番モード: データベースに保存
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaire_responses')
    .insert({
      questionnaire_id: responseData.questionnaire_id,
      patient_id: responseData.patient_id,
      appointment_id: responseData.appointment_id,
      response_data: responseData.response_data,
      completed_at: responseData.completed_at
    })
    .select()
    .single()

  if (error) {
    console.error('問診表回答保存エラー:', error)
    throw error
  }

  return data.id
}

/**
 * 未連携の問診票回答を取得
 */
export async function getUnlinkedQuestionnaireResponses(clinicId?: string): Promise<QuestionnaireResponse[]> {
  if (MOCK_MODE) {
    try {
      const responses = JSON.parse(localStorage.getItem('questionnaire_responses') || '[]')
      // patient_idがnullまたは未定義のものを未連携として扱う
      const unlinked = responses.filter((r: QuestionnaireResponse) => !r.patient_id)
      console.log('MOCK_MODE: 未連携問診票取得成功', { count: unlinked.length, responses: unlinked })
      return unlinked
    } catch (error) {
      console.error('MOCK_MODE: 未連携問診票取得エラー', error)
      return []
    }
  }

  const client = getSupabaseClient()
  const query = client
    .from('questionnaire_responses')
    .select('*')
    .is('patient_id', null)
    .order('created_at', { ascending: false })

  if (clinicId) {
    // questionnairesテーブルと結合してクリニックIDでフィルタ
    const { data, error } = await query
    if (error) {
      console.error('未連携問診票取得エラー:', error)
      throw error
    }
    return data || []
  }

  const { data, error } = await query
  if (error) {
    console.error('未連携問診票取得エラー:', error)
    throw error
  }

  return data || []
}

/**
 * 問診票回答を患者に連携
 */
export async function linkQuestionnaireResponseToPatient(responseId: string, patientId: string): Promise<void> {
  if (MOCK_MODE) {
    try {
      const responses = JSON.parse(localStorage.getItem('questionnaire_responses') || '[]')
      const index = responses.findIndex((r: QuestionnaireResponse) => r.id === responseId)
      if (index !== -1) {
        responses[index].patient_id = patientId
        responses[index].updated_at = new Date().toISOString()
        localStorage.setItem('questionnaire_responses', JSON.stringify(responses))
        console.log('MOCK_MODE: 問診票回答を患者に連携しました', { responseId, patientId })
      }
    } catch (error) {
      console.error('MOCK_MODE: 問診票連携エラー', error)
      throw error
    }
    return
  }

  const client = getSupabaseClient()
  const { error } = await client
    .from('questionnaire_responses')
    .update({ patient_id: patientId, updated_at: new Date().toISOString() })
    .eq('id', responseId)

  if (error) {
    console.error('問診票連携エラー:', error)
    throw error
  }
}

/**
 * 問診票回答の患者連携を解除
 */
export async function unlinkQuestionnaireResponse(responseId: string): Promise<void> {
  if (MOCK_MODE) {
    try {
      const responses = JSON.parse(localStorage.getItem('questionnaire_responses') || '[]')
      const index = responses.findIndex((r: QuestionnaireResponse) => r.id === responseId)
      if (index !== -1) {
        responses[index].patient_id = null
        responses[index].updated_at = new Date().toISOString()
        localStorage.setItem('questionnaire_responses', JSON.stringify(responses))
        console.log('MOCK_MODE: 問診票回答の連携を解除しました', { responseId })
      }
    } catch (error) {
      console.error('MOCK_MODE: 問診票連携解除エラー', error)
      throw error
    }
    return
  }

  const client = getSupabaseClient()
  const { error } = await client
    .from('questionnaire_responses')
    .update({ patient_id: null, updated_at: new Date().toISOString() })
    .eq('id', responseId)

  if (error) {
    console.error('問診票連携解除エラー:', error)
    throw error
  }
}

/**
 * 特定の患者に連携された問診票回答を取得（単一）
 */
export async function getLinkedQuestionnaireResponse(patientId: string): Promise<QuestionnaireResponse | null> {
  if (MOCK_MODE) {
    try {
      const responses = JSON.parse(localStorage.getItem('questionnaire_responses') || '[]')
      const linked = responses.find((r: QuestionnaireResponse) => r.patient_id === patientId)
      return linked || null
    } catch (error) {
      console.error('MOCK_MODE: 連携済み問診票取得エラー', error)
      return null
    }
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaire_responses')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('連携済み問診票取得エラー:', error)
    return null
  }

  return data
}

/**
 * 特定の患者に連携された問診票回答を全て取得
 */
export async function getLinkedQuestionnaireResponses(patientId: string): Promise<QuestionnaireResponse[]> {
  if (MOCK_MODE) {
    try {
      const responses = JSON.parse(localStorage.getItem('questionnaire_responses') || '[]')
      const linked = responses.filter((r: QuestionnaireResponse) => r.patient_id === patientId)
      console.log('MOCK_MODE: 患者の連携済み問診票取得成功', { patientId, count: linked.length })
      return linked
    } catch (error) {
      console.error('MOCK_MODE: 連携済み問診票取得エラー', error)
      return []
    }
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaire_responses')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('連携済み問診票取得エラー:', error)
    return []
  }

  return data || []
}

/**
 * デバッグ用：全ての問診票回答を取得
 */
export async function debugQuestionnaireResponses(): Promise<QuestionnaireResponse[]> {
  if (MOCK_MODE) {
    try {
      const responses = JSON.parse(localStorage.getItem('questionnaire_responses') || '[]')
      console.log('MOCK_MODE: 全問診票回答取得', { count: responses.length, responses })
      return responses
    } catch (error) {
      console.error('MOCK_MODE: 問診票回答デバッグエラー', error)
      return []
    }
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaire_responses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('問診票回答デバッグエラー:', error)
    return []
  }

  return data || []
}