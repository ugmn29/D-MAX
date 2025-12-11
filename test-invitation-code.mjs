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

async function testInvitationCode() {
  console.log('🧪 招待コード発行のテスト\n')

  try {
    // 1. まず患者を1件取得
    console.log('1. テスト用の患者を取得中...')
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, clinic_id, last_name, first_name, birth_date')
      .limit(1)

    if (patientError || !patients || patients.length === 0) {
      console.error('❌ 患者が見つかりません:', patientError?.message)
      return
    }

    const patient = patients[0]
    console.log(`✅ 患者を取得: ${patient.last_name} ${patient.first_name} (ID: ${patient.id})`)
    console.log(`   patient_id型: ${typeof patient.id}`)
    console.log(`   patient_id値: ${patient.id}`)

    // 2. デモスタッフIDを取得
    console.log('\n2. スタッフを取得中...')
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, name')
      .limit(1)

    if (staffError || !staff || staff.length === 0) {
      console.error('❌ スタッフが見つかりません:', staffError?.message)
      return
    }

    const demoStaff = staff[0]
    console.log(`✅ スタッフを取得: ${demoStaff.name} (ID: ${demoStaff.id})`)

    // 3. 招待コードを生成
    console.log('\n3. 招待コードを生成中...')

    // ランダムな8桁の英数字
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字を除外
      let code = ''
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code.slice(0, 4) + '-' + code.slice(4)
    }

    const invitationCode = generateCode()
    console.log(`✅ 招待コード生成: ${invitationCode}`)

    // 4. 有効期限を計算（30日後）
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // 5. 招待コードをデータベースに保存
    console.log('\n4. 招待コードをデータベースに保存中...')
    const { data: newCode, error: insertError } = await supabase
      .from('line_invitation_codes')
      .insert({
        clinic_id: patient.clinic_id,
        patient_id: patient.id, // TEXT型として保存
        invitation_code: invitationCode,
        expires_at: expiresAt.toISOString(),
        created_by: demoStaff.id,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ 招待コードの保存に失敗しました')
      console.error('エラー詳細:', insertError)
      console.error('\n🔧 patient_idの型が不一致の可能性があります')
      console.error('以下のSQLをSupabase DashboardのSQL Editorで実行してください:\n')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`
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
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return
    }

    console.log('✅ 招待コードを保存しました！')
    console.log('\n📋 保存された招待コード情報:')
    console.log(`   ID: ${newCode.id}`)
    console.log(`   招待コード: ${newCode.invitation_code}`)
    console.log(`   患者ID: ${newCode.patient_id}`)
    console.log(`   ステータス: ${newCode.status}`)
    console.log(`   有効期限: ${new Date(newCode.expires_at).toLocaleString('ja-JP')}`)

    // 6. 取得テスト
    console.log('\n5. 招待コードを取得してテスト...')
    const { data: codes, error: getError } = await supabase
      .from('line_invitation_codes')
      .select('*')
      .eq('patient_id', patient.id)

    if (getError) {
      console.error('❌ 招待コードの取得に失敗:', getError.message)
      return
    }

    console.log(`✅ ${codes.length}件の招待コードを取得しました`)

    console.log('\n🎉 テスト成功！招待コード発行機能は正常に動作しています。')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

testInvitationCode()
