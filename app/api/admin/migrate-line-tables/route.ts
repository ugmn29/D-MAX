import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/admin/migrate-line-tables
 * LINE関連テーブルのpatient_idをTEXT型に変更するマイグレーション
 *
 * セキュリティ: 本番環境では適切な認証を追加してください
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase設定が見つかりません' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = []

    // 1. line_invitation_codes
    try {
      console.log('Migrating line_invitation_codes...')

      // 外部キー制約を削除
      const { error: dropFkError1 } = await supabase
        .rpc('exec_sql', {
          sql: 'ALTER TABLE line_invitation_codes DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey'
        })
        .throwOnError()

      // 型を変更
      const { error: alterError1 } = await supabase
        .rpc('exec_sql', {
          sql: 'ALTER TABLE line_invitation_codes ALTER COLUMN patient_id TYPE TEXT'
        })
        .throwOnError()

      results.push({
        table: 'line_invitation_codes',
        status: 'success',
        message: 'patient_idをTEXT型に変更しました'
      })
    } catch (error: any) {
      results.push({
        table: 'line_invitation_codes',
        status: 'error',
        message: error.message
      })
    }

    // 2. line_patient_linkages
    try {
      console.log('Migrating line_patient_linkages...')

      const { error: dropFkError2 } = await supabase
        .rpc('exec_sql', {
          sql: 'ALTER TABLE line_patient_linkages DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey'
        })
        .throwOnError()

      const { error: alterError2 } = await supabase
        .rpc('exec_sql', {
          sql: 'ALTER TABLE line_patient_linkages ALTER COLUMN patient_id TYPE TEXT'
        })
        .throwOnError()

      results.push({
        table: 'line_patient_linkages',
        status: 'success',
        message: 'patient_idをTEXT型に変更しました'
      })
    } catch (error: any) {
      results.push({
        table: 'line_patient_linkages',
        status: 'error',
        message: error.message
      })
    }

    // 3. patient_qr_codes
    try {
      console.log('Migrating patient_qr_codes...')

      const { error: dropFkError3 } = await supabase
        .rpc('exec_sql', {
          sql: 'ALTER TABLE patient_qr_codes DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey'
        })
        .throwOnError()

      const { error: alterError3 } = await supabase
        .rpc('exec_sql', {
          sql: 'ALTER TABLE patient_qr_codes ALTER COLUMN patient_id TYPE TEXT'
        })
        .throwOnError()

      results.push({
        table: 'patient_qr_codes',
        status: 'success',
        message: 'patient_idをTEXT型に変更しました'
      })
    } catch (error: any) {
      results.push({
        table: 'patient_qr_codes',
        status: 'error',
        message: error.message
      })
    }

    // 結果確認
    const { data: verifyData } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type')
      .in('table_name', ['line_invitation_codes', 'line_patient_linkages', 'patient_qr_codes'])
      .eq('column_name', 'patient_id')

    return NextResponse.json({
      success: true,
      results,
      verification: verifyData,
      note: 'もしエラーが出た場合は、Supabase DashboardのSQL Editorで手動実行してください',
      sql: `
-- LINE関連テーブルのpatient_idをTEXTに変更
ALTER TABLE line_invitation_codes
  DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE line_patient_linkages
  DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE patient_qr_codes
  DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;
      `.trim()
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        error: 'マイグレーションに失敗しました',
        message: error.message,
        sql: `
-- 以下のSQLをSupabase DashboardのSQL Editorで手動実行してください
ALTER TABLE line_invitation_codes
  DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE line_patient_linkages
  DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE patient_qr_codes
  DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;
        `.trim()
      },
      { status: 500 }
    )
  }
}
