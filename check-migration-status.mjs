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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkMigrationStatus() {
  console.log('🔍 マイグレーション実行状況を確認中...\n')

  try {
    // 実際にテストデータを挿入してみる
    console.log('1. テスト用患者を取得中...')
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, last_name, first_name')
      .limit(1)

    if (patientError) {
      console.error('❌ 患者取得エラー:', patientError.message)
      return
    }

    if (!patients || patients.length === 0) {
      console.log('⚠️  患者データが存在しません')
      console.log('   ブラウザから患者を作成してください')
      return
    }

    const patient = patients[0]
    console.log(`✅ 患者取得: ${patient.last_name} ${patient.first_name}`)
    console.log(`   patient_id: ${patient.id}`)
    console.log(`   patient_id型: ${typeof patient.id}`)

    // スタッフを取得
    console.log('\n2. スタッフを取得中...')
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .limit(1)

    if (staffError || !staff || staff.length === 0) {
      console.error('❌ スタッフが見つかりません')
      return
    }

    console.log(`✅ スタッフ取得: ${staff[0].id}`)

    // テスト用の招待コードを生成
    const testCode = 'TEST-1234'
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    console.log('\n3. テスト招待コードを挿入中...')
    console.log(`   patient_id: ${patient.id} (型: ${typeof patient.id})`)

    const { data: insertData, error: insertError } = await supabase
      .from('line_invitation_codes')
      .insert({
        clinic_id: '11111111-1111-1111-1111-111111111111',
        patient_id: patient.id, // TEXT型として挿入
        invitation_code: testCode,
        expires_at: expiresAt.toISOString(),
        created_by: staff[0].id,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('\n❌ 招待コード挿入エラー:', insertError)
      console.error('   エラーコード:', insertError.code)
      console.error('   エラー詳細:', insertError.message)
      console.error('   エラーヒント:', insertError.hint || 'なし')

      if (insertError.message.includes('invalid input syntax for type uuid')) {
        console.error('\n🔧 patient_idがまだUUID型です！')
        console.error('   Supabase Dashboardでマイグレーションを実行してください:')
        console.error('   https://supabase.com/dashboard/project/obdfmwpdkwraqqqyjgwu/sql')
      }

      return
    }

    console.log('\n✅ テスト招待コード挿入成功！')
    console.log('   挿入されたデータ:', insertData)

    // テストデータを削除
    console.log('\n4. テストデータをクリーンアップ中...')
    await supabase
      .from('line_invitation_codes')
      .delete()
      .eq('invitation_code', testCode)

    console.log('✅ クリーンアップ完了')

    console.log('\n🎉 マイグレーションは正常に実行されています！')
    console.log('   招待コード発行機能は正常に動作するはずです。')

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error)
  }
}

checkMigrationStatus()
