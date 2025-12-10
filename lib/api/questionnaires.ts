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
  // MOCK_MODEの場合はlocalStorageから取得
  if (MOCK_MODE) {
    try {
      const { getMockQuestionnaires, initializeMockData } = await import('@/lib/utils/mock-mode')

      // モックデータの初期化
      initializeMockData()

      const questionnaires = getMockQuestionnaires()
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
        sort_order,
        linked_field,
        is_hidden
      )
    `)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('問診表取得エラー:', error)
    throw error
  }


  // questionnaire_questions を questions にマッピング
  const mappedData = (data || []).map((questionnaire: any) => ({
    ...questionnaire,
    questions: questionnaire.questionnaire_questions || []
  }))

  console.log('問診表取得成功 - マッピング後件数:', mappedData.length)

  // 初診問診票の質問を詳細ログ
  const initialQuestionnaire = mappedData.find((q: any) => q.name === '初診問診票')
  if (initialQuestionnaire) {
    console.log('初診問診票の質問詳細:', {
      questionCount: initialQuestionnaire.questions.length,
      first5Questions: initialQuestionnaire.questions.slice(0, 5).map((q: any) => ({
        id: q.id,
        text: q.question_text,
        sort_order: q.sort_order
      }))
    })
  }

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
 * patient_idがnull、または患者が仮登録状態(is_registered=false)の問診票を取得
 */
export async function getUnlinkedQuestionnaireResponses(clinicId?: string): Promise<QuestionnaireResponse[]> {
  if (MOCK_MODE) {
    try {
      const responsesStr = localStorage.getItem('questionnaire_responses') || '[]'
      const responses = JSON.parse(responsesStr)
      // patient_idがnullまたは未定義のものを未連携として扱う
      const unlinked = responses.filter((r: QuestionnaireResponse) => !r.patient_id)
      return unlinked
    } catch (error) {
      console.error('MOCK_MODE: 未連携問診票取得エラー', error)
      return []
    }
  }

  const client = getSupabaseClient()


  // 1. patient_idがnullの問診票を取得（questionnaires情報も含める）
  const { data: nullPatientResponses, error: nullError } = await client
    .from('questionnaire_responses')
    .select(`
      *,
      questionnaires (
        id,
        name
      )
    `)
    .is('patient_id', null)
    .order('created_at', { ascending: false })

  if (nullError) {
    console.error('❌ patient_id=nullの問診票取得エラー:', nullError)
    throw nullError
  }


  // 2. 仮登録患者(is_registered=false)に紐づいている問診票を取得
  const { data: tempPatientResponses, error: tempError } = await client
    .from('questionnaire_responses')
    .select(`
      *,
      questionnaires (
        id,
        name
      ),
      patients!inner (
        id,
        is_registered
      )
    `)
    .eq('patients.is_registered', false)
    .not('patient_id', 'is', null)
    .order('created_at', { ascending: false })

  if (tempError) {
    console.error('❌ 仮登録患者の問診票取得エラー:', tempError)
    throw tempError
  }


  // 3. 両方を結合（重複を除外）
  const allResponses = [
    ...(nullPatientResponses || []),
    ...(tempPatientResponses || [])
  ]

  // IDで重複を除外
  const uniqueResponses = Array.from(
    new Map(allResponses.map(r => [r.id, r])).values()
  )

  console.log('🔍 getUnlinkedQuestionnaireResponses 結果:', {
    nullPatientCount: nullPatientResponses?.length || 0,
    tempPatientCount: tempPatientResponses?.length || 0,
    totalUnique: uniqueResponses.length,
    responses: uniqueResponses.map(r => ({
      id: r.id,
      questionnaire_id: r.questionnaire_id,
      questionnaire_name: (r as any).questionnaires?.name || 'N/A',
      patient_id: r.patient_id,
      has_response_data: !!r.response_data,
      response_data_keys: Object.keys(r.response_data || {}).length
    }))
  })

  return uniqueResponses
}

/**
 * 問診票回答を患者に連携
 * 連携時に本登録完了処理と診察券番号の自動割り振りを行う
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

        // 問診票から医療情報を抽出して患者データに保存
        const responseData = responses[index].response_data
        const { updateMockPatient, getMockPatients, generatePatientNumber } = await import('@/lib/utils/mock-mode')

        const medicalData: any = {}

        // 既存の患者情報を取得
        const patients = getMockPatients()
        const existingPatient = patients.find(p => p.id === patientId)

        // 診察券番号を設定（既に持っている場合は保持、持っていない場合は生成）
        if (existingPatient && !existingPatient.patient_number) {
          const clinicId = '11111111-1111-1111-1111-111111111111'
          const patientNumber = generatePatientNumber(clinicId, patients)
          medicalData.patient_number = patientNumber
        }

        // 本登録完了フラグを設定（既に本登録済みの場合は上書きしない）
        if (existingPatient && !existingPatient.is_registered) {
          medicalData.is_registered = true
        }

        // アレルギー情報を取得
        // 初診問診票の場合:
        // q3-3: 麻酔や抜歯での異常経験 ("ない" または "ある")
        // q3-4: 麻酔・抜歯異常の詳細 (配列)
        // q3-5: アレルギーの原因 (テキスト)
        let allergiesInfo = ''

        // q3-5がアレルギーの原因（最も重要な情報）
        if (responseData['q3-5']) {
          allergiesInfo = responseData['q3-5']
        } else if (responseData['q3-3']) {
          // q3-3が配列の場合
          if (Array.isArray(responseData['q3-3'])) {
            const value = responseData['q3-3'][0]
            if (value === 'ない') {
              allergiesInfo = 'なし'
            }
          } else if (responseData['q3-3'] === 'ない') {
            allergiesInfo = 'なし'
          }
        }
        if (allergiesInfo) {
          medicalData.allergies = allergiesInfo
        }

        // 既往歴を取得
        // 初診問診票の場合:
        // q3-6: 具体的な持病（配列） - 例: ['高血圧']
        // q3-7: 持病・通院中の病気 ("ない" または "ある")
        // q3-8: 病名・病院名・診療科・医師名 (テキスト)
        let medicalHistoryInfo = ''

        if (responseData['q3-7'] === 'ある') {
          const parts = []

          // q3-6: 具体的な持病（配列）
          if (responseData['q3-6'] && Array.isArray(responseData['q3-6']) && responseData['q3-6'].length > 0) {
            parts.push(responseData['q3-6'].join('、'))
          }

          // q3-8: 病名・病院名等
          if (responseData['q3-8']) {
            parts.push(`（${responseData['q3-8']}）`)
          }

          medicalHistoryInfo = parts.join(' ')
        } else if (responseData['q3-7'] === 'ない') {
          medicalHistoryInfo = 'なし'
        }

        if (medicalHistoryInfo) {
          medicalData.medical_history = medicalHistoryInfo
        }

        // 服用薬情報を取得
        // 初診問診票の場合:
        // q3-9: 現在服用しているお薬 ("ない" または "ある")
        // q3-10: 薬剤名・お薬手帳の有無・定期的な点滴・注射の有無 (テキスト)
        let medicationsInfo = ''

        if (responseData['q3-9'] === 'ある') {
          if (responseData['q3-10']) {
            medicationsInfo = responseData['q3-10']
          } else {
            medicationsInfo = 'あり（詳細未記入）'
          }
        } else if (responseData['q3-9'] === 'ない') {
          medicationsInfo = 'なし'
        }

        if (medicationsInfo) {
          medicalData.medications = medicationsInfo
        }

        // 患者データを更新
        if (Object.keys(medicalData).length > 0) {
          updateMockPatient(patientId, medicalData)
        }
      }
    } catch (error) {
      console.error('MOCK_MODE: 問診票連携エラー', error)
      throw error
    }
    return
  }

  const client = getSupabaseClient()

  // 1. 問診票のpatient_idを更新
  console.log('問診票のpatient_id更新開始:', { responseId, patientId })
  const { data: updatedResponse, error: linkError } = await client
    .from('questionnaire_responses')
    .update({ patient_id: patientId, updated_at: new Date().toISOString() })
    .eq('id', responseId)
    .select()

  if (linkError) {
    console.error('問診票連携エラー:', linkError)
    throw linkError
  }

  console.log('問診票のpatient_id更新成功:', updatedResponse)

  // 2. 問診票の回答データを取得
  const { data: responseData, error: fetchError } = await client
    .from('questionnaire_responses')
    .select('response_data, questionnaire_id')
    .eq('id', responseId)
    .single()

  if (fetchError) {
    console.error('問診票データ取得エラー:', fetchError)
    throw fetchError
  }

  // 3. 問診票の質問定義を取得（linked_fieldを確認するため）
  const { data: questionnaireData, error: questionnaireError } = await client
    .from('questionnaires')
    .select('questionnaire_questions(*)')
    .eq('id', responseData.questionnaire_id)
    .single()

  if (questionnaireError) {
    console.error('問診票定義取得エラー:', questionnaireError)
    throw questionnaireError
  }

  // 4. linked_fieldに基づいて患者情報を抽出
  const patientUpdate: any = {
    is_registered: true,
    updated_at: new Date().toISOString()
  }

  const questions = questionnaireData.questionnaire_questions || []
  const answers = responseData.response_data || {}

  console.log('問診票回答データから患者情報を抽出:', { questionCount: questions.length, answerKeys: Object.keys(answers).length })

  // 服用薬情報の特別処理用
  let medicationStatus = null // 'ない' or 'ある'
  let medicationDetails = null // 薬剤名の詳細

  // 電話番号の統合処理用
  let homePhone = null // 自宅電話番号
  let mobilePhone = null // 携帯電話番号

  questions.forEach((question: any) => {
    const { id: questionId, linked_field, question_text, sort_order } = question

    // 回答を取得：複数の形式に対応
    // 1. UUID形式のID (新形式)
    // 2. q{section}-{number} 形式 (レガシー形式、例: q1-1, q1-2)
    // 3. sort_orderベース (フォールバック)
    let answer = answers[questionId]  // UUID形式を試す

    if (answer === undefined || answer === null || answer === '') {
      // レガシー形式を試す（例: q1-1, q3-5）
      // sort_orderから推測: 0-9 -> q1-1～q1-10, 10-19 -> q2-1～q2-10, etc.
      const section = Math.floor(sort_order / 10) + 1
      const number = sort_order % 10 || 10
      const legacyKey = `q${section}-${number}`
      answer = answers[legacyKey]

      if (answer !== undefined) {
        console.log(`レガシーキー ${legacyKey} で回答を取得: ${answer}`)
      }
    }

    // セクション名ベースも試す（例: section1_q1, section2_q3）
    if (answer === undefined || answer === null || answer === '') {
      const sectionKey = `section${Math.floor(sort_order / 10) + 1}_q${sort_order % 10 || 10}`
      answer = answers[sectionKey]

      if (answer !== undefined) {
        console.log(`セクションキー ${sectionKey} で回答を取得: ${answer}`)
      }
    }

    if (linked_field && answer !== undefined && answer !== null && answer !== '') {
      console.log(`linked_field: ${linked_field} = ${answer} (questionId: ${questionId}, sort_order: ${sort_order})`)

      switch (linked_field) {
        case 'name':
          // 氏名は既に設定されている場合はスキップ（姓名分割済みのため）
          break
        case 'furigana_kana':
          // フリガナも既に設定されている場合はスキップ
          break
        case 'birth_date':
          patientUpdate.birth_date = answer
          break
        case 'gender':
          // 日本語の性別を英語に変換
          if (answer === '男性' || answer === '男') {
            patientUpdate.gender = 'male'
          } else if (answer === '女性' || answer === '女') {
            patientUpdate.gender = 'female'
          } else if (answer === 'その他' || answer === 'other') {
            patientUpdate.gender = 'other'
          } else {
            // 既に英語の場合はそのまま使用
            patientUpdate.gender = answer
          }
          console.log('性別変換:', { 元の値: answer, 変換後: patientUpdate.gender })
          break
        case 'home_phone':
          // 自宅電話番号を一時保存
          homePhone = answer
          console.log('自宅電話番号を保存:', answer)
          break
        case 'phone':
          // 携帯電話番号を一時保存
          mobilePhone = answer
          console.log('携帯電話番号を保存:', answer)
          break
        case 'email':
          patientUpdate.email = answer
          break
        case 'postal_code':
          patientUpdate.postal_code = answer
          break
        case 'address':
          patientUpdate.address = answer
          break
        case 'referral_source':
          // 来院理由の処理
          if (Array.isArray(answer)) {
            patientUpdate.visit_reason = answer.join('、')
          } else {
            patientUpdate.visit_reason = answer
          }
          console.log('来院理由を設定:', patientUpdate.visit_reason)
          break
        case 'preferred_contact_method':
          // 希望連絡方法の処理
          // データベースの制約: 'line', 'email', 'sms' のいずれか
          let contactMethod = answer

          // 日本語の回答を英語にマッピング
          if (typeof contactMethod === 'string') {
            const lowerAnswer = contactMethod.toLowerCase()
            if (lowerAnswer.includes('line') || contactMethod.includes('LINE')) {
              contactMethod = 'line'
            } else if (lowerAnswer.includes('email') || lowerAnswer.includes('メール') || contactMethod.includes('Eメール')) {
              contactMethod = 'email'
            } else if (lowerAnswer.includes('sms') || contactMethod.includes('SMS') || contactMethod.includes('ショートメッセージ')) {
              contactMethod = 'sms'
            }
          }

          // 有効な値のみ設定
          if (contactMethod === 'line' || contactMethod === 'email' || contactMethod === 'sms') {
            patientUpdate.preferred_contact_method = contactMethod
            console.log('希望連絡方法を設定:', contactMethod)
          } else {
            console.warn('無効な連絡方法のため設定をスキップ:', answer)
          }
          break
        case 'allergies':
          // アレルギー情報の処理
          if (Array.isArray(answer)) {
            patientUpdate.allergies = answer.join(', ')
          } else if (answer === 'ない') {
            patientUpdate.allergies = 'なし'
          } else {
            patientUpdate.allergies = answer
          }
          break
        case 'medical_history':
          // 既往歴情報の処理
          if (Array.isArray(answer)) {
            patientUpdate.medical_history = answer.join(', ')
          } else if (answer === 'ない' || answer.includes('なし')) {
            patientUpdate.medical_history = 'なし'
          } else {
            patientUpdate.medical_history = answer
          }
          break
        case 'medications':
          // 服用薬情報の処理（複数の質問に対応）
          // 「服用中のお薬」（ラジオボタン）と「服用中の薬剤名」（テキストエリア）を区別
          if (question_text === '服用中のお薬' || question_text.includes('服用中のお薬')) {
            // ステータス質問（ある/ない）
            medicationStatus = answer
          } else if (question_text === '服用中の薬剤名' || question_text.includes('薬剤名')) {
            // 詳細質問（薬剤名のテキスト）
            medicationDetails = answer
          } else {
            // その他のmedications関連の質問
            if (Array.isArray(answer)) {
              patientUpdate.medications = answer.join(', ')
            } else if (answer === 'ない' || answer.includes('なし')) {
              patientUpdate.medications = 'なし'
            } else {
              patientUpdate.medications = answer
            }
          }
          break
      }
    }
  })

  // 服用薬情報の統合処理
  if (medicationStatus !== null) {
    if (medicationStatus === 'ない' || medicationStatus.includes('なし')) {
      patientUpdate.medications = 'なし'
      console.log('服用薬を設定: なし')
    } else if (medicationStatus === 'ある' || medicationStatus.includes('ある')) {
      if (medicationDetails) {
        patientUpdate.medications = medicationDetails
        console.log('服用薬を設定:', medicationDetails)
      } else {
        patientUpdate.medications = 'あり（詳細未記入）'
        console.log('服用薬を設定: あり（詳細未記入）')
      }
    }
  } else if (medicationDetails !== null) {
    // ステータス質問がない場合は、詳細のみを設定
    patientUpdate.medications = medicationDetails
    console.log('服用薬を設定:', medicationDetails)
  }

  // 電話番号の統合処理
  if (homePhone && mobilePhone) {
    // 両方ある場合：「自宅: xxx / 携帯: xxx」の形式で統合
    patientUpdate.phone = `自宅: ${homePhone} / 携帯: ${mobilePhone}`
    console.log('電話番号を統合:', patientUpdate.phone)
  } else if (mobilePhone) {
    // 携帯のみの場合
    patientUpdate.phone = mobilePhone
    console.log('携帯電話番号のみを設定:', mobilePhone)
  } else if (homePhone) {
    // 自宅のみの場合（通常はないが念のため）
    patientUpdate.phone = homePhone
    console.log('自宅電話番号のみを設定:', homePhone)
  }

  console.log('抽出した患者情報:', patientUpdate)

  // 5. 患者情報を更新
  console.log('患者情報を更新開始:', { patientId, updateData: patientUpdate })
  const { data: updatedPatient, error: patientError } = await client
    .from('patients')
    .update(patientUpdate)
    .eq('id', patientId)
    .select()

  if (patientError) {
    console.error('患者情報更新エラー（詳細）:', {
      message: patientError.message,
      details: patientError.details,
      hint: patientError.hint,
      code: patientError.code
    })
    throw patientError
  }

  console.log('患者情報の更新成功:', updatedPatient)

  console.log('問診票連携完了 - 患者情報を更新:', patientId)
}

/**
 * 問診票回答の患者連携を解除
 */
export async function unlinkQuestionnaireResponse(responseId: string, patientId: string): Promise<void> {
  if (MOCK_MODE) {
    try {
      const responses = JSON.parse(localStorage.getItem('questionnaire_responses') || '[]')
      const index = responses.findIndex((r: QuestionnaireResponse) => r.id === responseId)
      if (index !== -1) {
        responses[index].patient_id = null
        responses[index].updated_at = new Date().toISOString()
        localStorage.setItem('questionnaire_responses', JSON.stringify(responses))
        console.log('MOCK_MODE: 問診票回答の連携を解除しました', { responseId })

        // 患者データから医療情報をクリアし、仮登録状態に戻す
        const { updateMockPatient } = await import('@/lib/utils/mock-mode')
        updateMockPatient(patientId, {
          allergies: '',
          medical_history: '',
          medications: '',
          is_registered: false  // 仮登録状態に戻す
        })
        console.log('MOCK_MODE: 患者データから医療情報をクリアし、仮登録状態に戻しました', { patientId })
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

  if (error) {
    console.error('連携済み問診票取得エラー詳細:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      patientId: patientId,
      appointmentId: appointmentId
    })
    return null
  }

  // データが0件の場合はnull、1件の場合はその要素を返す
  return data && data.length > 0 ? data[0] : null
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
    .select(`
      *,
      questionnaires (
        id,
        name,
        description
      )
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('連携済み問診票取得エラー:', error)
    return []
  }

  // questionnairesをquestionnaireにマッピング（単数形）
  const mappedData = (data || []).map((response: any) => ({
    ...response,
    questionnaire: response.questionnaires
  }))

  return mappedData
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
  const client = getSupabaseClient()

  try {
    console.log('受け取った質問データ:', questions)

    // 既存の質問を削除
    const { error: deleteError } = await client
      .from('questionnaire_questions')
      .delete()
      .eq('questionnaire_id', questionnaireId)

    if (deleteError) {
      console.error('質問削除エラー:', deleteError)
      throw deleteError
    }

    // 新しい質問を挿入
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q, index) => {
        console.log(`質問 ${index + 1}:`, { id: q.id, text: q.question_text, type: typeof q.id, hasId: 'id' in q })
        const questionData: any = {
          questionnaire_id: questionnaireId,
          section_name: q.section_name,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          is_required: q.is_required,
          conditional_logic: q.conditional_logic,
          sort_order: q.sort_order,
          linked_field: (q as any).linked_field || null,
          is_hidden: (q as any).is_hidden || false
        }

        // temp-で始まるIDまたはIDがない場合は、DBに自動生成させる
        if (q.id && !q.id.toString().startsWith('temp-')) {
          console.log(`  -> IDを含める: ${q.id}`)
          questionData.id = q.id
        } else {
          console.log(`  -> IDを含めない (temp-IDまたはIDなし)`)
          // IDを設定しない（フィールド自体を含めない）
        }

        // デバッグ: 最終的なquestionDataを確認
        console.log(`  -> questionData:`, questionData)
        console.log(`  -> 'id' in questionData:`, 'id' in questionData)

        return questionData
      })

      console.log('挿入する質問データ（全体）:', JSON.stringify(questionsToInsert, null, 2))

      const { error: insertError } = await client
        .from('questionnaire_questions')
        .insert(questionsToInsert)

      if (insertError) {
        console.error('質問挿入エラー:', insertError)
        throw insertError
      }
    }

    console.log('質問更新成功:', { questionnaireId, count: questions.length })
  } catch (error) {
    console.error('質問更新エラー:', error)
    throw error
  }
}