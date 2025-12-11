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

console.log('🔍 Supabase接続テスト...')
console.log('URL:', supabaseUrl)
console.log('Service Key:', supabaseServiceKey ? '設定されています' : '未設定')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testInvitationCodeCreation() {
  console.log('\n📝 招待コード作成テスト開始...\n')

  try {
    // 1. 患者を取得
    console.log('1. 患者データ取得中...')
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, clinic_id, last_name, first_name')
      .limit(1)

    if (patientError) {
      console.error('❌ 患者取得エラー:', patientError)
      return
    }

    if (!patients || patients.length === 0) {
      console.log('⚠️  患者が見つかりません')
      return
    }

    const patient = patients[0]
    console.log('✅ 患者取得成功:')
    console.log('   ID:', patient.id)
    console.log('   タイプ:', typeof patient.id)
    console.log('   氏名:', `${patient.last_name} ${patient.first_name}`)
    console.log('   Clinic ID:', patient.clinic_id)

    // 2. スタッフを取得
    console.log('\n2. スタッフ取得中...')
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .limit(1)

    if (staffError || !staff || staff.length === 0) {
      console.error('❌ スタッフ取得エラー:', staffError || 'スタッフが見つかりません')
      return
    }

    console.log('✅ スタッフ取得成功:', staff[0].id)

    // 3. 招待コード生成
    const invitationCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    console.log('\n3. 招待コード挿入テスト...')
    console.log('   招待コード:', invitationCode)
    console.log('   patient_id:', patient.id, '(型:', typeof patient.id, ')')
    console.log('   clinic_id:', patient.clinic_id)
    console.log('   created_by:', staff[0].id)
    console.log('   expires_at:', expiresAt.toISOString())

    const insertData = {
      clinic_id: patient.clinic_id,
      patient_id: patient.id,
      invitation_code: invitationCode,
      expires_at: expiresAt.toISOString(),
      created_by: staff[0].id,
      status: 'pending'
    }

    console.log('\n   挿入データ:', JSON.stringify(insertData, null, 2))

    const { data: insertedCode, error: insertError } = await supabase
      .from('line_invitation_codes')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('\n❌ 招待コード挿入エラー:')
      console.error('   コード:', insertError.code)
      console.error('   メッセージ:', insertError.message)
      console.error('   詳細:', insertError.details)
      console.error('   ヒント:', insertError.hint)
      console.error('\n   完全なエラー:', JSON.stringify(insertError, null, 2))
      return
    }

    console.log('\n✅ 招待コード挿入成功！')
    console.log('   挿入されたデータ:', JSON.stringify(insertedCode, null, 2))

    // 4. 確認のため取得
    console.log('\n4. 招待コード確認...')
    const { data: fetchedCode, error: fetchError } = await supabase
      .from('line_invitation_codes')
      .select('*')
      .eq('invitation_code', invitationCode)
      .single()

    if (fetchError) {
      console.error('❌ 取得エラー:', fetchError)
      return
    }

    console.log('✅ 招待コード確認成功:', JSON.stringify(fetchedCode, null, 2))

    // 5. クリーンアップ
    console.log('\n5. テストデータ削除中...')
    await supabase
      .from('line_invitation_codes')
      .delete()
      .eq('invitation_code', invitationCode)

    console.log('✅ クリーンアップ完了')
    console.log('\n🎉 すべてのテスト成功！招待コード機能は正常です。')

  } catch (error) {
    console.error('\n❌ 予期しないエラー:', error)
  }
}

testInvitationCodeCreation()
