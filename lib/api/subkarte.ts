import { supabase } from '@/lib/utils/supabase-client'

export interface SubKarteEntry {
  id: string
  patient_id: string
  staff_id: string
  entry_type: 'text' | 'handwriting' | 'audio' | 'file' | 'template'
  content: string
  metadata: any
  created_at: string
  updated_at: string
}

export interface SubKarteAttachment {
  id: string
  entry_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
}

export interface SubKarteHandwriting {
  id: string
  entry_id: string
  canvas_data: string
  image_data?: string
  created_at: string
}

export interface SubKarteAudio {
  id: string
  entry_id: string
  audio_file_path: string
  transcription?: string
  duration_seconds?: number
  file_size: number
  created_at: string
  expires_at: string
}

export interface SubKarteTemplate {
  id: string
  clinic_id: string
  name: string
  content: string
  category?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// サブカルテエントリの取得
export async function getSubKarteEntries(patientId: string): Promise<SubKarteEntry[]> {
  try {
    const { data, error } = await supabase
      .from('subkarte_entries')
      .select(`
        *,
        staff:staff_id (
          first_name,
          last_name
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('サブカルテエントリ取得エラー:', error)
    throw error
  }
}

// サブカルテエントリの作成
export async function createSubKarteEntry(entry: Omit<SubKarteEntry, 'id' | 'created_at' | 'updated_at'>): Promise<SubKarteEntry> {
  try {
    const { data, error } = await supabase
      .from('subkarte_entries')
      .insert([entry])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('サブカルテエントリ作成エラー:', error)
    throw error
  }
}

// サブカルテエントリの更新
export async function updateSubKarteEntry(id: string, updates: Partial<SubKarteEntry>): Promise<SubKarteEntry> {
  try {
    const { data, error } = await supabase
      .from('subkarte_entries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('サブカルテエントリ更新エラー:', error)
    throw error
  }
}

// サブカルテエントリの削除
export async function deleteSubKarteEntry(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('subkarte_entries')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('サブカルテエントリ削除エラー:', error)
    throw error
  }
}

// 添付ファイルの保存
export async function saveSubKarteAttachment(attachment: Omit<SubKarteAttachment, 'id' | 'created_at'>): Promise<SubKarteAttachment> {
  try {
    const { data, error } = await supabase
      .from('subkarte_attachments')
      .insert([attachment])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('添付ファイル保存エラー:', error)
    throw error
  }
}

// 手書きデータの保存
export async function saveSubKarteHandwriting(handwriting: Omit<SubKarteHandwriting, 'id' | 'created_at'>): Promise<SubKarteHandwriting> {
  try {
    const { data, error } = await supabase
      .from('subkarte_handwriting')
      .insert([handwriting])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('手書きデータ保存エラー:', error)
    throw error
  }
}

// 音声データの保存（一時保存）
export async function saveSubKarteAudio(audio: Omit<SubKarteAudio, 'id' | 'created_at' | 'expires_at'>): Promise<SubKarteAudio> {
  try {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1時間後に期限切れ

    const { data, error } = await supabase
      .from('subkarte_audio')
      .insert([{ ...audio, expires_at: expiresAt.toISOString() }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('音声データ保存エラー:', error)
    throw error
  }
}

// 音声データの文字起こし更新
export async function updateSubKarteAudioTranscription(id: string, transcription: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('subkarte_audio')
      .update({ transcription })
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('音声文字起こし更新エラー:', error)
    throw error
  }
}

// テンプレートの取得
export async function getSubKarteTemplates(clinicId: string): Promise<SubKarteTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('subkarte_templates')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('テンプレート取得エラー:', error)
    throw error
  }
}

// テンプレートの作成
export async function createSubKarteTemplate(template: Omit<SubKarteTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<SubKarteTemplate> {
  try {
    const { data, error } = await supabase
      .from('subkarte_templates')
      .insert([template])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('テンプレート作成エラー:', error)
    throw error
  }
}

// テンプレートの更新
export async function updateSubKarteTemplate(id: string, updates: Partial<SubKarteTemplate>): Promise<SubKarteTemplate> {
  try {
    const { data, error } = await supabase
      .from('subkarte_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('テンプレート更新エラー:', error)
    throw error
  }
}

// テンプレートの削除
export async function deleteSubKarteTemplate(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('subkarte_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('テンプレート削除エラー:', error)
    throw error
  }
}

// 期限切れ音声データのクリーンアップ
export async function cleanupExpiredAudioData(): Promise<void> {
  try {
    const { error } = await supabase
      .from('subkarte_audio')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) throw error
  } catch (error) {
    console.error('期限切れ音声データクリーンアップエラー:', error)
    throw error
  }
}

// Google Cloud Speech-to-Text APIを使用した文字起こし（モック実装）
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // 実際の実装では、Google Cloud Speech-to-Text APIを呼び出し
    // ここではモック実装として、固定の文字起こし結果を返す
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒の遅延をシミュレート
    
    return 'これは音声認識の結果です。実際の実装ではGoogle Cloud Speech-to-Text APIを使用します。'
  } catch (error) {
    console.error('音声文字起こしエラー:', error)
    throw error
  }
}
