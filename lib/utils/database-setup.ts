import { getSupabaseClient } from './supabase-client'

// データベースの初期設定を行う
export async function initializeDatabase(clinicId: string) {
  const client = getSupabaseClient()
  
  try {
    // デモクリニックの作成
    const { error: clinicError } = await client
      .from('clinics')
      .upsert({
        id: clinicId,
        name: 'デモクリニック',
        time_slot_minutes: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (clinicError) {
      console.log('クリニック作成エラー（既に存在する可能性があります）:', clinicError)
    } else {
      console.log('デモクリニックを作成しました')
    }

    // デフォルト設定の作成
    const defaultSettings = [
      { setting_key: 'time_slot_minutes', setting_value: 15 },
      { setting_key: 'display_items', setting_value: [] },
      { setting_key: 'cell_height', setting_value: 40 }
    ]

    for (const setting of defaultSettings) {
      const { error: settingError } = await client
        .from('clinic_settings')
        .upsert({
          clinic_id: clinicId,
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'clinic_id,setting_key' })

      if (settingError) {
        console.log(`設定作成エラー ${setting.setting_key}:`, settingError)
      } else {
        console.log(`デフォルト設定を作成しました: ${setting.setting_key}`)
      }
    }

    // 患者ノートタイプのデフォルトデータを作成
    const defaultNoteTypes = [
      { name: 'アレルギー', description: '患者のアレルギー情報', sort_order: 1 },
      { name: '既往歴', description: '過去の病気や治療歴', sort_order: 2 },
      { name: '服用薬', description: '現在服用中の薬', sort_order: 3 },
      { name: '注意事項', description: 'その他の注意事項', sort_order: 4 }
    ]

    for (const noteType of defaultNoteTypes) {
      const { error: noteTypeError } = await client
        .from('patient_note_types')
        .upsert({
          clinic_id: clinicId,
          name: noteType.name,
          description: noteType.description,
          sort_order: noteType.sort_order,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'clinic_id,name' })

      if (noteTypeError) {
        console.log(`患者ノートタイプ作成エラー ${noteType.name}:`, noteTypeError)
      } else {
        console.log(`デフォルト患者ノートタイプを作成しました: ${noteType.name}`)
      }
    }

    return true
  } catch (error) {
    console.error('データベース初期化エラー:', error)
    return false
  }
}
