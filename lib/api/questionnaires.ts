import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { MOCK_MODE, USE_DATABASE_FOR_QUESTIONNAIRES } from '@/lib/utils/mock-mode'

// ブラウザストレージを使用した永続化ストレージ
class QuestionnaireResponseStorage {
  private static instance: QuestionnaireResponseStorage
  private storageKey = 'questionnaire_responses'
  private defaultResponses: QuestionnaireResponse[] = [
    {
      id: 'response-1',
      questionnaire_id: '11111111-1111-1111-1111-111111111112',
      response_data: {
        'q1-1': '田中太郎',
        'q1-2': 'タナカタロウ',
        'q1-3': 'male',
        'q1-4': '1990-01-01',
        'q1-7': 'A',
        'q1-8': '123-4567',
        'q1-9': '東京都渋谷区神宮前1-1-1',
        'q1-10': '090-1234-5678',
        'q1-11': 'tanaka@example.com',
        'q1-12': 'Google検索・HP',
        // 連携用の患者情報
        patient_name: '田中太郎',
        patient_name_kana: 'タナカタロウ',
        patient_phone: '090-1234-5678',
        patient_email: 'tanaka@example.com'
      },
      completed_at: '2024-01-15T10:30:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'response-2',
      questionnaire_id: '11111111-1111-1111-1111-111111111112',
      response_data: {
        'q1-1': '佐藤花子',
        'q1-2': 'サトウハナコ',
        'q1-3': 'female',
        'q1-4': '1985-05-15',
        'q1-7': 'B',
        'q1-8': '150-0001',
        'q1-9': '東京都渋谷区恵比寿1-1-1',
        'q1-10': '090-9876-5432',
        'q1-11': 'sato@example.com',
        'q1-12': 'ご紹介',
        // 連携用の患者情報
        patient_name: '佐藤花子',
        patient_name_kana: 'サトウハナコ',
        patient_phone: '090-9876-5432',
        patient_email: 'sato@example.com'
      },
      completed_at: '2024-01-16T14:20:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'response-3',
      questionnaire_id: '11111111-1111-1111-1111-111111111112',
      response_data: {
        'q1-1': '福永真大',
        'q1-2': 'フクナガマサヒロ',
        'q1-3': 'male',
        'q1-4': '1995-02-09',
        'q1-7': 'A',
        'q1-8': '08014103036',
        'q1-9': '東京都渋谷区',
        'q1-10': '08014103036',
        'q1-11': 'fukunaga@example.com',
        'q1-12': 'ウェブサイト',
        // 連携用の患者情報
        patient_name: '福永真大',
        patient_name_kana: 'フクナガマサヒロ',
        patient_phone: '08014103036',
        patient_email: 'fukunaga@example.com',
        // 医療情報
        allergies: 'なし',
        medical_history: '特になし',
        current_medications: 'なし',
        chief_complaint: '定期検診希望'
      },
      completed_at: '2024-01-17T09:15:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  private constructor() {}

  public static getInstance(): QuestionnaireResponseStorage {
    if (!QuestionnaireResponseStorage.instance) {
      QuestionnaireResponseStorage.instance = new QuestionnaireResponseStorage()
    }
    return QuestionnaireResponseStorage.instance
  }

  private getFromStorage(): QuestionnaireResponse[] {
    if (typeof window === 'undefined') {
      return this.defaultResponses
    }
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
      
      // 初回アクセス時：既存のlocalStorageに以前のデータがあるかチェック
      const existingData = localStorage.getItem('mock_questionnaire_responses')
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData)
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('既存データを発見、移行します:', parsed.length, '件')
            this.saveToStorage(parsed)
            localStorage.removeItem('mock_questionnaire_responses') // 古いキーを削除
            return parsed
          }
        } catch (error) {
          console.error('既存データの解析エラー:', error)
        }
      }
    } catch (error) {
      console.error('ストレージからの読み込みエラー:', error)
    }
    
    return this.defaultResponses
  }

  private saveToStorage(responses: QuestionnaireResponse[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(responses))
    } catch (error) {
      console.error('ストレージへの保存エラー:', error)
    }
  }

  public getAll(): QuestionnaireResponse[] {
    const responses = this.getFromStorage()
    console.log('ストレージから取得:', { count: responses.length, responses: responses.map(r => ({ id: r.id, name: r.response_data.patient_name || r.response_data['q1-1'] })) })
    return [...responses]
  }

  public add(response: QuestionnaireResponse): void {
    const responses = this.getFromStorage()
    responses.push(response)
    this.saveToStorage(responses)
    console.log('ストレージに追加:', { id: response.id, name: response.response_data.patient_name || response.response_data['q1-1'], total: responses.length })
  }

  public remove(id: string): void {
    const responses = this.getFromStorage()
    const filtered = responses.filter(r => r.id !== id)
    this.saveToStorage(filtered)
    console.log('ストレージから削除:', { id, total: filtered.length })
  }

  public getCount(): number {
    return this.getFromStorage().length
  }
}

// グローバルインスタンス
const storage = QuestionnaireResponseStorage.getInstance()

// デバッグ用：現在の配列の状態を確認
export function debugQuestionnaireResponses() {
  const responses = storage.getAll()
  console.log('デバッグ: 現在の配列状態', {
    length: responses.length,
    responses: responses.map(r => ({
      id: r.id,
      name: r.response_data.patient_name || r.response_data['q1-1'],
      phone: r.response_data.patient_phone || r.response_data['q1-10']
    }))
  })
  return responses
}

// デバッグ用：現在の未連携問診票数を取得
export function getCurrentUnlinkedCount(): number {
  if (MOCK_MODE) {
    const count = storage.getCount()
    console.log('現在の未連携問診票数:', count)
    return count
  }
  return 0
}

// デバッグ用：現在の未連携問診票一覧を取得
export function getCurrentUnlinkedList(): any[] {
  if (MOCK_MODE) {
    const responses = storage.getAll()
    const list = responses.map(r => ({
      id: r.id,
      name: r.response_data.patient_name || r.response_data['q1-1'],
      phone: r.response_data.patient_phone || r.response_data['q1-10'],
      completed_at: r.completed_at
    }))
    console.log('現在の未連携問診票一覧:', list)
    return list
  }
  return []
}


export interface Questionnaire {
  id: string
  clinic_id: string
  name: string
  description?: string
  questions: QuestionnaireQuestion[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface QuestionnaireQuestion {
  id: string
  questionnaire_id: string
  question_text: string
  question_type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'number' | 'date'
  options?: string[] // for radio, checkbox, select
  is_required: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface QuestionnaireResponse {
  id: string
  questionnaire_id: string
  patient_id?: string
  appointment_id?: string
  response_data: Record<string, any>
  completed_at?: string
  created_at: string
  updated_at: string
}

/**
 * 特定の患者に連携済みの問診票回答を取得
 */
export async function getLinkedQuestionnaireResponses(patientId: string): Promise<QuestionnaireResponse[]> {
  if (MOCK_MODE && !USE_DATABASE_FOR_QUESTIONNAIRES) {
    const responses = storage.getAll()
    const linkedResponses = responses.filter(response => response.patient_id === patientId)
    
    console.log('モックモード: 連携済み問診票回答を取得', { 
      patientId, 
      count: linkedResponses.length,
      responses: linkedResponses.map(r => ({
        id: r.id,
        name: r.response_data.patient_name || r.response_data['q1-1'],
        phone: r.response_data.patient_phone || r.response_data['q1-10'],
        completed_at: r.completed_at
      }))
    })
    
    return linkedResponses
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('連携済み問診票回答取得エラー:', error)
      throw new Error('連携済み問診票回答の取得に失敗しました')
    }

    return data || []
  } catch (error) {
    console.error('連携済み問診票回答取得エラー:', error)
    throw error
  }
}

/**
 * 特定の患者に連携された最新の問診票回答を取得
 */
export async function getLinkedQuestionnaireResponse(patientId: string): Promise<QuestionnaireResponse | null> {
  if (MOCK_MODE && !USE_DATABASE_FOR_QUESTIONNAIRES) {
    const responses = storage.getAll()
    const linkedResponses = responses.filter(response => response.patient_id === patientId)
    
    // 最新の回答を返す
    const latestResponse = linkedResponses.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
    
    console.log('モックモード: 連携済み問診票回答を取得（最新）', { 
      patientId, 
      response: latestResponse ? {
        id: latestResponse.id,
        name: latestResponse.response_data.patient_name || latestResponse.response_data['q1-1'],
        phone: latestResponse.response_data.patient_phone || latestResponse.response_data['q1-10'],
        completed_at: latestResponse.completed_at
      } : null
    })
    
    return latestResponse || null
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // データが見つからない場合
      }
      console.error('連携済み問診票回答取得エラー:', error)
      throw new Error('連携済み問診票回答の取得に失敗しました')
    }

    return data
  } catch (error) {
    console.error('連携済み問診票回答取得エラー:', error)
    throw error
  }
}

/**
 * 未連携の問診票回答を取得
 */
export async function getUnlinkedQuestionnaireResponses(clinicId: string): Promise<QuestionnaireResponse[]> {
  if (MOCK_MODE && !USE_DATABASE_FOR_QUESTIONNAIRES) {
    const responses = storage.getAll()
    console.log('モックモード: 未連携問診票回答データを取得します', { 
      clinicId, 
      count: responses.length,
      responses: responses.map(r => ({
        id: r.id,
        name: r.response_data.patient_name || r.response_data['q1-1'],
        phone: r.response_data.patient_phone || r.response_data['q1-10'],
        completed_at: r.completed_at
      }))
    })
    
    // 配列のコピーを作成してソート（元の配列を変更しない）
    const sortedResponses = [...responses].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    )
    
    console.log('モックモード: ソート後の未連携問診票:', sortedResponses.map(r => ({
      id: r.id,
      name: r.response_data.patient_name || r.response_data['q1-1'],
      phone: r.response_data.patient_phone || r.response_data['q1-10'],
      completed_at: r.completed_at
    })))
    
    return sortedResponses
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select(`
        *,
        questionnaires!inner(clinic_id)
      `)
      .eq('questionnaires.clinic_id', clinicId)
      .is('patient_id', null)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('未連携問診票回答の取得エラー:', error)
    throw error
  }
}

/**
 * 問診票回答を患者に紐付け
 */
export async function linkQuestionnaireResponseToPatient(
  responseId: string, 
  patientId: string, 
  appointmentId?: string
): Promise<void> {
  if (MOCK_MODE && !USE_DATABASE_FOR_QUESTIONNAIRES) {
    console.log('モックモード: 問診票回答を患者に紐付け', { responseId, patientId, appointmentId })
    
    // 動的ストレージから該当の問診票回答を取得
    const allResponses = storage.getAll()
    const targetResponse = allResponses.find(r => r.id === responseId)
    
    if (targetResponse) {
      // patient_idとappointment_idを設定して更新
      const updatedResponse = {
        ...targetResponse,
        patient_id: patientId,
        appointment_id: appointmentId || null,
        updated_at: new Date().toISOString()
      }
      
      // 元の回答を削除
      storage.remove(responseId)
      
      // 更新された回答を追加（連携済みとして）
      storage.add(updatedResponse)
      
      console.log('モックモード: 問診票回答を患者に紐付け完了', { 
        responseId, 
        patientId, 
        appointmentId,
        updatedResponse: {
          id: updatedResponse.id,
          patient_id: updatedResponse.patient_id,
          appointment_id: updatedResponse.appointment_id
        }
      })
    } else {
      console.error('モックモード: 問診票回答が見つかりません', { responseId })
    }
    
    return
  }

  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('questionnaire_responses')
      .update({
        patient_id: patientId,
        appointment_id: appointmentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', responseId)

    if (error) throw error
  } catch (error) {
    console.error('問診票回答の紐付けエラー:', error)
    throw error
  }
}

/**
 * 問診票一覧を取得
 */
export async function getQuestionnaires(clinicId: string): Promise<Questionnaire[]> {
  if (MOCK_MODE && !USE_DATABASE_FOR_QUESTIONNAIRES) {
    console.log('モックモード: 問診票データを返します', { clinicId })
    return [
      {
        id: '11111111-1111-1111-1111-111111111112',
        clinic_id: clinicId,
        name: '初診問診票',
        description: '初診患者用の詳細問診票',
        questions: [
          // 患者情報セクション
          {
            id: 'q1-1',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: '氏名',
            question_type: 'text',
            is_required: true,
            sort_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-2',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: 'フリガナ',
            question_type: 'text',
            is_required: true,
            sort_order: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-3',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: '性別',
            question_type: 'radio',
            options: ['男', '女'],
            is_required: true,
            sort_order: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-4',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: '生年月日',
            question_type: 'date',
            is_required: true,
            sort_order: 4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-7',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: '血液型',
            question_type: 'select',
            options: ['A', 'B', 'AB', 'O', '不明'],
            is_required: false,
            sort_order: 9,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-8',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: '郵便番号',
            question_type: 'text',
            is_required: true,
            sort_order: 10,
            placeholder: '例: 123-4567',
            auto_complete: 'postal_code',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-9',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: '住所',
            question_type: 'text',
            is_required: true,
            sort_order: 11,
            placeholder: '郵便番号を入力すると自動で住所が入力されます',
            auto_complete: 'address',
            depends_on: 'q1-8',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-10',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: '携帯電話番号',
            question_type: 'text',
            is_required: true,
            sort_order: 13,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-11',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: 'Eメールアドレス',
            question_type: 'text',
            is_required: false,
            sort_order: 14,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-11-1',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '患者情報',
            question_text: 'ご希望の連絡方法',
            question_type: 'radio',
            options: ['LINE', 'メール', 'SMS(ショートメール)', '特に希望なし'],
            is_required: false,
            sort_order: 15,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          // 主訴・症状セクション
          {
            id: 'q1-12',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '主訴・症状',
            question_text: 'どうなさいましたか（来院目的）',
            question_type: 'checkbox',
            options: ['虫歯の治療をしたい', '検査をしてほしい', '歯がしみる', '入れ歯をいれたい', '歯がかけた', '歯肉が腫れた', '歯の清掃をしたい', '前につめた物がとれた', '顎関節が痛む', '親知らずを抜きたい', '口内炎が出来た', 'その他'],
            is_required: true,
            sort_order: 17,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-13',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '主訴・症状',
            question_text: '痛む場所（部位）',
            question_type: 'checkbox',
            options: ['右上', '上前', '左上', '右下', '下前', '左下'],
            is_required: false,
            sort_order: 18,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-14',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '主訴・症状',
            question_text: '痛み方',
            question_type: 'checkbox',
            options: ['ズキズキ', '噛んだ時に痛む', '痛んだり止んだり', '冷たい物がしみる', '熱い物がしみる', '夜になると痛む', '甘い物で痛む', '物が挟まって痛む'],
            is_required: false,
            sort_order: 21,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          // 問診セクション
          {
            id: 'q1-15',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: 'ご職業',
            question_type: 'radio',
            options: ['会社員', '自営業', '公務員', 'パート・アルバイト', '学生', '無職', 'その他'],
            is_required: true,
            sort_order: 22,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-16',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '歯の色は気になりますか',
            question_type: 'radio',
            options: ['はい', 'いいえ'],
            is_required: true,
            sort_order: 24,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-17',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '歯の色で気になる点',
            question_type: 'checkbox',
            options: ['全体的な色合い（ホワイトニング）', '被せ物や詰め物の色', 'タバコ、コーヒー等の着色', 'その他'],
            is_required: false,
            sort_order: 25,
            conditional_logic: {
              depends_on: 'q1-16',
              condition: 'equals',
              value: 'はい',
              required_when: true
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-18',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '麻酔や抜歯での異常経験',
            question_type: 'radio',
            options: ['ない', 'ある'],
            is_required: true,
            sort_order: 28,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-19',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '薬・食物・金属などのアレルギー',
            question_type: 'radio',
            options: ['ない', 'ある'],
            is_required: true,
            sort_order: 30,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-20',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '現在服用しているお薬',
            question_type: 'radio',
            options: ['ない', 'ある'],
            is_required: true,
            sort_order: 36,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-20b',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '薬剤名、お薬手帳の有無、定期的な点滴・注射の有無',
            question_type: 'textarea',
            is_required: false,
            sort_order: 37,
            conditional_logic: {
              depends_on: 'q1-20',
              condition: 'equals',
              value: 'ある',
              required_when: true
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-21',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '妊娠・授乳の有無',
            question_type: 'radio',
            options: ['いいえ', 'はい'],
            is_required: true,
            sort_order: 38,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-22',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '入れ歯の使用',
            question_type: 'radio',
            options: ['いいえ', 'はい'],
            is_required: true,
            sort_order: 42,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          // 問診セクション（持病・通院中の病気）
          {
            id: 'q1-23',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '持病・通院中の病気',
            question_type: 'radio',
            options: ['ない', 'ある'],
            is_required: true,
            sort_order: 33,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-23b',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '具体的な持病',
            question_type: 'checkbox',
            options: ['高血圧', '糖尿病', '心血管疾患・不整脈（6ヶ月以内の発作の有無、ペースメーカーの有無）', '脳血管障害（6ヶ月以内の発作の有無）', '呼吸器疾患', '骨粗しょう症', 'リウマチ', '肝機能障害', '腎機能障害（透析の有無、曜日、腕の左右）', 'B型・C型肝炎', 'HIV・梅毒', '血液疾患', '悪性腫瘍（放射線治療または抗がん剤治療の経験の有無）', 'その他'],
            is_required: false,
            sort_order: 34,
            conditional_logic: {
              depends_on: 'q1-23',
              condition: 'equals',
              value: 'ある',
              required_when: true
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-23c',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '問診',
            question_text: '（病名、病院名/診療科/医師名を記入）',
            question_type: 'textarea',
            is_required: false,
            sort_order: 35,
            conditional_logic: {
              depends_on: 'q1-23b',
              condition: 'is_not_empty',
              required_when: true
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          // 歯科疾患管理セクション
          {
            id: 'q1-25',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '歯科疾患管理',
            question_text: '1日の歯磨き回数',
            question_type: 'number',
            is_required: true,
            sort_order: 49,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-26',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '歯科疾患管理',
            question_text: '歯磨きの時間',
            question_type: 'checkbox',
            options: ['朝食後', '昼食後', '夕食後', '就寝前'],
            is_required: true,
            sort_order: 50,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-27',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '歯科疾患管理',
            question_text: '喫煙習慣',
            question_type: 'radio',
            options: ['無', '有', '過去に有り'],
            is_required: true,
            sort_order: 54,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-28',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '歯科疾患管理',
            question_text: '習慣的飲料物',
            question_type: 'checkbox',
            options: ['炭酸飲料', 'ジュース', 'その他'],
            is_required: false,
            sort_order: 51,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-29',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '歯科疾患管理',
            question_text: '間食の取り方',
            question_type: 'radio',
            options: ['しない', '規則正しい', '不規則'],
            is_required: true,
            sort_order: 52,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-30',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '歯科疾患管理',
            question_text: '歯口清掃器具の使用',
            question_type: 'checkbox',
            options: ['歯ブラシ', 'フロス', '歯間ブラシ', 'なし'],
            is_required: true,
            sort_order: 53,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-31',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '歯科疾患管理',
            question_text: '睡眠時間',
            question_type: 'radio',
            options: ['十分', 'やや不足', '不足'],
            is_required: true,
            sort_order: 55,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-32',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '歯科疾患管理',
            question_text: '歯磨き方法',
            question_type: 'radio',
            options: ['習ったことがある', '習ったことがない'],
            is_required: true,
            sort_order: 56,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          // 同意事項セクション
          {
            id: 'q1-33',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '同意事項',
            question_text: 'オンライン資格確認: 薬剤情報、特定健診情報等の診療情報を取得・活用することへの同意について',
            question_type: 'radio',
            options: ['同意する', '同意しない'],
            is_required: true,
            sort_order: 57,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'q1-34',
            questionnaire_id: '11111111-1111-1111-1111-111111111112',
            section_name: '同意事項',
            question_text: '口腔内写真の撮影・使用: 治療説明、学会発表、ソーシャルメディア等での匿名使用への同意について',
            question_type: 'radio',
            options: ['同意する', '同意しない'],
            is_required: true,
            sort_order: 58,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaires')
    .select(`
      *,
      questions:questionnaire_questions(*)
    `)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('問診票取得エラー:', error)
    throw new Error('問診票の取得に失敗しました')
  }

  return data || []
}

/**
 * 問診票を作成
 */
export async function createQuestionnaire(
  clinicId: string,
  questionnaireData: Omit<Questionnaire, 'id' | 'clinic_id' | 'created_at' | 'updated_at'>
): Promise<Questionnaire> {
  if (MOCK_MODE) {
    console.log('モックモード: 問診票を作成します', { clinicId, questionnaireData })
    const newQuestionnaire: Questionnaire = {
      id: `q-${Date.now()}`,
      clinic_id: clinicId,
      ...questionnaireData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    return newQuestionnaire
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaires')
    .insert({
      ...questionnaireData,
      clinic_id: clinicId
    })
    .select()
    .single()

  if (error) {
    console.error('問診票作成エラー:', error)
    throw new Error('問診票の作成に失敗しました')
  }

  return data
}

/**
 * 問診票を更新
 */
export async function updateQuestionnaire(
  questionnaireId: string,
  questionnaireData: Partial<Questionnaire>
): Promise<Questionnaire> {
  if (MOCK_MODE) {
    console.log('モックモード: 問診票を更新します', { questionnaireId, questionnaireData })
    return {
      id: questionnaireId,
      clinic_id: 'mock-clinic',
      name: questionnaireData.name || '更新された問診票',
      description: questionnaireData.description,
      questions: questionnaireData.questions || [],
      is_active: questionnaireData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaires')
    .update({
      ...questionnaireData,
      updated_at: new Date().toISOString()
    })
    .eq('id', questionnaireId)
    .select()
    .single()

  if (error) {
    console.error('問診票更新エラー:', error)
    throw new Error('問診票の更新に失敗しました')
  }

  return data
}

/**
 * 問診票を削除
 */
export async function deleteQuestionnaire(questionnaireId: string): Promise<void> {
  if (MOCK_MODE) {
    console.log('モックモード: 問診票を削除します', { questionnaireId })
    return
  }

  const client = getSupabaseClient()
  const { error } = await client
    .from('questionnaires')
    .delete()
    .eq('id', questionnaireId)

  if (error) {
    console.error('問診票削除エラー:', error)
    throw new Error('問診票の削除に失敗しました')
  }
}

/**
 * 問診票回答を作成
 */
export async function createQuestionnaireResponse(responseData: {
  questionnaire_id: string
  patient_id?: string
  appointment_id?: string
  response_data: any
  completed_at?: string
}): Promise<string> {
  if (MOCK_MODE) {
    console.log('モックモード: 問診票回答を作成します', responseData)
    console.log('送信前の未連携問診票数:', storage.getCount())
    console.log('送信前の全問診票:', storage.getAll().map(r => ({
      id: r.id,
      name: r.response_data.patient_name || r.response_data['q1-1'],
      phone: r.response_data.patient_phone || r.response_data['q1-10']
    })))
    
    const newResponseId = `response-${Date.now()}`
    const newResponse: QuestionnaireResponse = {
      id: newResponseId,
      questionnaire_id: responseData.questionnaire_id,
      response_data: responseData.response_data,
      completed_at: responseData.completed_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // 動的ストレージに追加
    storage.add(newResponse)
    console.log('モックモード: 問診票回答を動的ストレージに追加しました', { 
      responseId: newResponseId, 
      patientName: responseData.response_data.patient_name || responseData.response_data['q1-1'],
      totalResponses: storage.getCount(),
      allResponses: storage.getAll().map(r => ({
        id: r.id,
        name: r.response_data.patient_name || r.response_data['q1-1'],
        phone: r.response_data.patient_phone || r.response_data['q1-10']
      }))
    })
    console.log('送信後の未連携問診票数:', storage.getCount())
    console.log('送信後の全問診票:', storage.getAll().map(r => ({
      id: r.id,
      name: r.response_data.patient_name || r.response_data['q1-1'],
      phone: r.response_data.patient_phone || r.response_data['q1-10']
    })))
    
    return newResponseId
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaire_responses')
    .insert({
      ...responseData,
      completed_at: responseData.completed_at || new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('問診票回答作成エラー:', error)
    throw new Error('問診票回答の作成に失敗しました')
  }

  return data.id
}

/**
 * 問診票回答を取得
 */
export async function getQuestionnaireResponses(questionnaireId: string): Promise<any[]> {
  if (MOCK_MODE) {
    console.log('モックモード: 問診票回答を取得します', { questionnaireId })
    return []
  }

  const client = getSupabaseClient()
  const { data, error } = await client
    .from('questionnaire_responses')
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('問診票回答取得エラー:', error)
    throw new Error('問診票回答の取得に失敗しました')
  }

  return data || []
}

// 問診票の連携を解除する関数
export const unlinkQuestionnaireResponse = async (
  responseId: string
): Promise<void> => {
  if (MOCK_MODE && !USE_DATABASE_FOR_QUESTIONNAIRES) {
    console.log('モックモード: 問診票回答の連携を解除', { responseId })
    
    // 動的ストレージに問診票回答を復元（未連携として扱う）
    const initialLength = storage.getCount()
    
    // 元の問診票データを復元（実際の実装では元データを保持する必要があります）
    // ここでは簡易的に新しいIDで追加
    const restoredResponse = {
      id: responseId,
      patient_id: null,
      appointment_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    storage.add(restoredResponse)
    
    console.log('モックモード: 問診票回答を動的ストレージに復元しました', { 
      responseId, 
      restored: storage.getCount() > initialLength,
      totalResponses: storage.getCount() 
    })
    
    return
  }

  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('questionnaire_responses')
      .update({
        patient_id: null,
        appointment_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', responseId)

    if (error) {
      console.error('問診票連携解除エラー:', error)
      throw new Error('問診票の連携解除に失敗しました')
    }

    console.log('問診票の連携を解除しました:', responseId)
  } catch (error) {
    console.error('問診票連携解除エラー:', error)
    throw error
  }
}
