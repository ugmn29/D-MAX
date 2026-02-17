// Migrated to Prisma API Routes

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
  section_name?: string
  question_text: string
  question_type: 'text' | 'radio' | 'checkbox' | 'select' | 'textarea' | 'tel' | 'date' | 'number'
  options?: string[]
  is_required: boolean
  sort_order: number
  linked_field?: string
  conditional_logic?: any
  placeholder?: string
  is_hidden?: boolean
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
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaires?clinic_id=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '問診表の取得に失敗しました')
    }

    const mappedData = await response.json()

    console.log('問診表取得成功 - マッピング後件数:', mappedData.length)

    // 初診問診票の質問を詳細ログ
    const initialQuestionnaire = mappedData.find((q: any) => q.name === '初診問診票')
    if (initialQuestionnaire) {
      console.log('初診問診票の質問詳細:', {
        questionCount: initialQuestionnaire.questions?.length || 0,
        first5Questions: initialQuestionnaire.questions?.slice(0, 5).map((q: any) => ({
          id: q.id,
          text: q.question_text,
          sort_order: q.sort_order
        })) || []
      })
    }

    return mappedData
  } catch (error) {
    console.error('問診表取得エラー:', error)
    throw error
  }
}

/**
 * 新しい問診表を作成
 */
export async function createQuestionnaire(clinicId: string, questionnaireData: {
  name: string
  description?: string
  is_active?: boolean
}): Promise<Questionnaire> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaires?clinic_id=${clinicId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(questionnaireData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '問診表の作成に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('問診表作成エラー:', error)
    throw error
  }
}

/**
 * 問診表を更新
 */
export async function updateQuestionnaire(questionnaireId: string, updates: {
  name?: string
  description?: string
  is_active?: boolean
}): Promise<Questionnaire> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaires/${questionnaireId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '問診表の更新に失敗しました')
    }

    return await response.json()
  } catch (error) {
    console.error('問診表更新エラー:', error)
    throw error
  }
}

/**
 * 問診表を削除
 */
export async function deleteQuestionnaire(questionnaireId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaires/${questionnaireId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '問診表の削除に失敗しました')
    }
  } catch (error) {
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
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaire-responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '問診表回答の作成に失敗しました')
    }

    const result = await response.json()
    return result.id
  } catch (error) {
    console.error('問診表回答作成エラー:', error)
    throw error
  }
}

/**
 * 未連携の問診票回答を取得
 * patient_idがnull、または患者が仮登録状態(is_registered=false)の問診票を取得
 */
export async function getUnlinkedQuestionnaireResponses(clinicId?: string): Promise<QuestionnaireResponse[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const params = new URLSearchParams({ type: 'unlinked' })
    if (clinicId) {
      params.append('clinic_id', clinicId)
    }

    const response = await fetch(`${baseUrl}/api/questionnaire-responses?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('未連携問診票取得エラー')
      return []
    }

    const uniqueResponses = await response.json()

    console.log('🔍 getUnlinkedQuestionnaireResponses 結果:', {
      totalUnique: uniqueResponses.length
    })

    return uniqueResponses
  } catch (error) {
    console.error('未連携問診票取得エラー:', error)
    return []
  }
}

/**
 * 問診票回答を患者に連携
 * 連携時に本登録完了処理と診察券番号の自動割り振りを行う
 */
export async function linkQuestionnaireResponseToPatient(responseId: string, patientId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaire-responses/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ responseId, patientId })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '問診票の連携に失敗しました')
    }

    console.log('問診票連携完了:', responseId)
  } catch (error) {
    console.error('問診票連携エラー:', error)
    throw error
  }
}

/**
 * 問診票回答の患者連携を解除
 */
export async function unlinkQuestionnaireResponse(responseId: string, patientId: string): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaire-responses/link?responseId=${responseId}&patientId=${patientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '問診票連携の解除に失敗しました')
    }

    console.log('問診票連携解除完了:', responseId)
  } catch (error) {
    console.error('問診票連携解除エラー:', error)
    throw error
  }
}

/**
 * 特定の患者に連携された問診票回答を取得（単一）
 */
export async function getLinkedQuestionnaireResponse(patientId: string): Promise<QuestionnaireResponse | null> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaire-responses/patient?patientId=${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('連携済み問診票取得エラー')
      return null
    }

    const data = await response.json()
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('連携済み問診票取得エラー:', error)
    return null
  }
}
export async function getLinkedQuestionnaireResponses(patientId: string): Promise<QuestionnaireResponse[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaire-responses/patient?patientId=${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('連携済み問診票取得エラー')
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('連携済み問診票取得エラー:', error)
    return []
  }
}

/**
 * デバッグ用：全ての問診票回答を取得
 */
export async function debugQuestionnaireResponses(): Promise<QuestionnaireResponse[]> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaire-responses?type=debug`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      console.error('問診票回答デバッグエラー')
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('問診票回答デバッグエラー:', error)
    return []
  }
}

/**
 * 問診表の質問型定義
 */
export interface QuestionnaireQuestion {
  id: string
  questionnaire_id: string
  section_name?: string
  question_text: string
  question_type: string
  options?: string[]
  is_required: boolean
  conditional_logic?: any
  sort_order: number
  linked_field?: string
  placeholder?: string
}

/**
 * 問診表の質問を更新
 */
export async function updateQuestionnaireQuestions(
  questionnaireId: string,
  questions: QuestionnaireQuestion[]
): Promise<void> {
  try {
    const baseUrl = typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      : ''

    const response = await fetch(`${baseUrl}/api/questionnaires/${questionnaireId}/questions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questions })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '質問の更新に失敗しました')
    }

    console.log('質問更新成功:', { questionnaireId, count: questions.length })
  } catch (error) {
    console.error('質問更新エラー:', error)
    throw error
  }
}
