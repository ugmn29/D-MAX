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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkTables() {
  console.log('🔍 LINE関連テーブルの既存データを確認中...\n')

  try {
    // 直接テーブルからデータを取得して型を推測
    console.log('📊 既存データの確認:\n')


    const { data: invitationCodes, error: invError } = await supabase
      .from('line_invitation_codes')
      .select('id, patient_id, invitation_code, status')
      .limit(5)

    if (!invError && invitationCodes) {
      console.log(`line_invitation_codes: ${invitationCodes.length}件のレコード`)
      if (invitationCodes.length > 0) {
        console.log('  サンプル:', invitationCodes[0])
      }
    }

    const { data: linkages, error: linkError } = await supabase
      .from('line_patient_linkages')
      .select('id, patient_id, line_user_id')
      .limit(5)

    if (!linkError && linkages) {
      console.log(`line_patient_linkages: ${linkages.length}件のレコード`)
      if (linkages.length > 0) {
        console.log('  サンプル:', linkages[0])
      }
    }

    const { data: qrCodes, error: qrError } = await supabase
      .from('patient_qr_codes')
      .select('id, patient_id, qr_token')
      .limit(5)

    if (!qrError && qrCodes) {
      console.log(`patient_qr_codes: ${qrCodes.length}件のレコード`)
      if (qrCodes.length > 0) {
        console.log('  サンプル:', qrCodes[0])
      }
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

checkTables()
