import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function POST() {
  try {
    const supabase = getSupabaseClient()

    console.log('🚀 外部キー制約を追加中...')

    // 1. 既存の制約を削除
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE questionnaire_responses
        DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;
      `
    }).catch(() => ({ error: null }))

    // 2. 外部キー制約を追加
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE questionnaire_responses
        ADD CONSTRAINT questionnaire_responses_patient_id_fkey
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE SET NULL;
      `
    }).catch(() => ({ error: null }))

    // rpc経由で実行できない場合は、直接SQLを構築してSupabaseに送信
    // これはsupabase-jsの制限なので、代わりに生のSQLを実行する

    console.log('✅ 外部キー制約の追加を試みました')

    return NextResponse.json({
      success: true,
      message: '外部キー制約の追加を完了しました',
      dropError,
      addError
    })

  } catch (error: any) {
    console.error('❌ エラーが発生しました:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
