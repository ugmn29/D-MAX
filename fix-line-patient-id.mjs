import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// .env.localファイルから環境変数を手動で読み込み
const envContent = readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('🔧 LINE関連テーブルのpatient_idをTEXT型に変更します...\n')

    // 1. line_invitation_codes
    console.log('1. line_invitation_codes テーブルを修正中...')
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          -- 既存の外部キー制約を削除
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'line_invitation_codes_patient_id_fkey'
            AND table_name = 'line_invitation_codes'
          ) THEN
            ALTER TABLE line_invitation_codes DROP CONSTRAINT line_invitation_codes_patient_id_fkey;
          END IF;

          -- カラムの型をTEXTに変更
          ALTER TABLE line_invitation_codes ALTER COLUMN patient_id TYPE TEXT;

          RAISE NOTICE 'line_invitation_codes.patient_id を TEXT 型に変更しました';
        END $$;
      `
    })

    if (error1) {
      // rpc関数が存在しない場合は直接SQLを実行
      console.log('   RPCが使えないため、直接クエリで実行します...')

      const { error: dropError1 } = await supabase.rpc('exec', {
        query: 'ALTER TABLE line_invitation_codes DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey'
      })

      const { error: alterError1 } = await supabase.rpc('exec', {
        query: 'ALTER TABLE line_invitation_codes ALTER COLUMN patient_id TYPE TEXT'
      })

      if (alterError1) {
        console.log('   ⚠️  直接実行も失敗しました。手動での実行が必要です。')
        console.log('   エラー:', alterError1.message)
      } else {
        console.log('   ✅ line_invitation_codes.patient_id を TEXT に変更しました')
      }
    } else {
      console.log('   ✅ line_invitation_codes.patient_id を TEXT に変更しました')
    }

    // 2. line_patient_linkages
    console.log('\n2. line_patient_linkages テーブルを修正中...')
    const { error: dropError2 } = await supabase.rpc('exec', {
      query: 'ALTER TABLE line_patient_linkages DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey'
    })

    const { error: alterError2 } = await supabase.rpc('exec', {
      query: 'ALTER TABLE line_patient_linkages ALTER COLUMN patient_id TYPE TEXT'
    })

    if (alterError2) {
      console.log('   ⚠️  修正をスキップします（後で手動実行が必要）')
      console.log('   エラー:', alterError2?.message || 'Unknown error')
    } else {
      console.log('   ✅ line_patient_linkages.patient_id を TEXT に変更しました')
    }

    // 3. patient_qr_codes
    console.log('\n3. patient_qr_codes テーブルを修正中...')
    const { error: dropError3 } = await supabase.rpc('exec', {
      query: 'ALTER TABLE patient_qr_codes DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey'
    })

    const { error: alterError3 } = await supabase.rpc('exec', {
      query: 'ALTER TABLE patient_qr_codes ALTER COLUMN patient_id TYPE TEXT'
    })

    if (alterError3) {
      console.log('   ⚠️  修正をスキップします（後で手動実行が必要）')
      console.log('   エラー:', alterError3?.message || 'Unknown error')
    } else {
      console.log('   ✅ patient_qr_codes.patient_id を TEXT に変更しました')
    }

    console.log('\n📋 テーブル構造を確認中...')

    // 確認クエリ
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type')
      .in('table_name', ['line_invitation_codes', 'line_patient_linkages', 'patient_qr_codes'])
      .eq('column_name', 'patient_id')

    if (columns && columns.length > 0) {
      console.log('\n結果:')
      columns.forEach(col => {
        console.log(`  - ${col.table_name}.patient_id: ${col.data_type}`)
      })
    }

    console.log('\n🎉 マイグレーション完了!')
    console.log('\n⚠️  もし上記でエラーが出た場合は、以下のSQLをSupabase Dashboardで手動実行してください:')
    console.log(`
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
    `)

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error)
    console.error('\n以下のSQLをSupabase Dashboardで手動実行してください:')
    console.log(`
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
    `)
    process.exit(1)
  }
}

runMigration()
