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

async function checkWebBookingStatus() {
  try {
    console.log('\n📋 Web予約設定を確認中...')

    const { data, error } = await supabase
      .from('clinic_settings')
      .select('setting_key, setting_value')
      .eq('clinic_id', CLINIC_ID)
      .eq('setting_key', 'web_reservation')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Web予約設定が見つかりません（データが存在しない）')
        return
      }
      throw error
    }

    console.log('\n✅ Web予約設定が見つかりました:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Setting Key:', data.setting_key)
    console.log('isEnabled:', data.setting_value.isEnabled)
    console.log('reservationPeriod:', data.setting_value.reservationPeriod)
    console.log('allowCurrentTime:', data.setting_value.allowCurrentTime)
    console.log('booking_menus length:', data.setting_value.booking_menus?.length || 0)
    console.log('\n完全なsetting_value:')
    console.log(JSON.stringify(data.setting_value, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (data.setting_value.isEnabled === true) {
      console.log('\n✅ Web予約は有効になっています！')
    } else {
      console.log('\n⚠️ Web予約は無効になっています')
    }

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message)
    console.error('詳細:', error)
    process.exit(1)
  }
}

// 実行
checkWebBookingStatus()
