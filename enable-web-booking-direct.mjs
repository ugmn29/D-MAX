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
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ エラー: Supabase URLまたはAnon Keyが設定されていません')
  process.exit(1)
}

console.log('🔧 Supabase接続中...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const CLINIC_ID = '11111111-1111-1111-1111-111111111111'

async function enableWebBooking() {
  try {
    console.log('\n📋 Web予約設定を作成中...')

    // Web予約設定を作成
    const webReservationSettings = {
      isEnabled: true,
      reservationPeriod: 30,
      allowCurrentTime: true,
      openAllSlots: false,
      allowStaffSelection: true,
      webPageUrl: '',
      showCancelPolicy: true,
      cancelPolicyText: `◆当院のキャンセルポリシー◆

数ある歯科医院の中から〇〇歯科・矯正歯科をお選びいただき誠にありがとうございます。
当クリニックでは患者さま一人一人により良い医療を提供するため、30〜45分の長い治療時間を確保してお待ちしております。尚かつ適切な処置時間を確保するために予約制となっております。

予約時間に遅れての来院は十分な時間が確保できず、予定通りの処置が行えない場合があります。
また、予定時間に遅れが生じる事で、次に来院予定の患者さまに多大なご迷惑をおかけする恐れがありますので、予約時間前の来院にご協力をお願い致します。
止むを得ず遅れる場合や、体調不良などでキャンセルを希望される場合は早めのご連絡をお願い致します。
予約の際には確実に来院できる日にちと時間をご確認下さい。`,
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

    console.log('✅ 以下の設定で作成します:')
    console.log(JSON.stringify(webReservationSettings, null, 2))

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

    console.log('\n✅ Web予約が正常に有効化されました！')
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
