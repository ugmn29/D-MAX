import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// .env.remoteファイルを手動で読み込む
const envContent = readFileSync('.env.remote', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match && !line.startsWith('#')) {
    envVars[match[1]] = match[2]
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: Supabase URLまたはService Role Keyが設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定')
  process.exit(1)
}

console.log('🔧 Supabase接続中...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const CLINIC_ID = '11111111-1111-1111-1111-111111111111'

async function enableWebBooking() {
  try {
    console.log('\n📋 現在の設定を確認中...')

    // 現在の設定を取得
    const { data: currentSettings, error: fetchError } = await supabase
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', CLINIC_ID)
      .eq('setting_key', 'web_reservation')
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    console.log('現在の設定:', currentSettings)

    // Web予約設定を準備
    const webReservationSettings = currentSettings?.setting_value || {
      isEnabled: false,
      reservationPeriod: 30,
      allowCurrentTime: true,
      openAllSlots: false,
      allowStaffSelection: true,
      webPageUrl: '',
      showCancelPolicy: true,
      cancelPolicyText: 'キャンセルポリシーのデフォルトテキスト',
      patientInfoFields: {
        phoneRequired: true,
        phoneEnabled: true,
        emailRequired: false,
        emailEnabled: true
      },
      flow: {
        initialSelection: true,
        menuSelection: true,
        calendarDisplay: true,
        patientInfo: true,
        confirmation: true
      },
      booking_menus: []
    }

    // isEnabledをtrueに設定
    webReservationSettings.isEnabled = true

    console.log('\n✅ Web予約を有効化します...')

    // upsert (insert or update)
    const { data, error } = await supabase
      .from('clinic_settings')
      .upsert({
        clinic_id: CLINIC_ID,
        setting_key: 'web_reservation',
        setting_value: webReservationSettings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'clinic_id,setting_key'
      })
      .select()

    if (error) {
      throw error
    }

    console.log('✅ Web予約が正常に有効化されました！')
    console.log('更新されたデータ:', data)

    // 確認
    const { data: verification, error: verifyError } = await supabase
      .from('clinic_settings')
      .select('setting_value')
      .eq('clinic_id', CLINIC_ID)
      .eq('setting_key', 'web_reservation')
      .single()

    if (verifyError) {
      throw verifyError
    }

    console.log('\n🔍 確認: isEnabled =', verification.setting_value.isEnabled)

    if (verification.setting_value.isEnabled === true) {
      console.log('\n🎉 成功！Web予約が有効になりました。')
      console.log('📱 以下のURLでアクセスできます:')
      console.log('   https://dmax-mu.vercel.app/web-booking')
    } else {
      console.log('\n⚠️  警告: 設定は保存されましたが、isEnabledがtrueになっていません')
    }

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message)
    console.error('詳細:', error)
    process.exit(1)
  }
}

// 実行
enableWebBooking()
