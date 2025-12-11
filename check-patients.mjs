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

async function checkPatients() {
  console.log('🔍 患者データを確認中...\n')

  const { data: patients, error } = await supabase
    .from('patients')
    .select('id, last_name, first_name, birth_date')
    .limit(3)

  if (error) {
    console.error('❌ エラー:', error.message)
    return
  }

  if (!patients || patients.length === 0) {
    console.log('⚠️  患者データが存在しません')
    console.log('\nブラウザから http://localhost:3000/patients にアクセスして')
    console.log('患者を作成してから再度テストしてください。')
    return
  }

  console.log(`✅ ${patients.length}件の患者が見つかりました:\n`)
  patients.forEach((p, i) => {
    console.log(`${i + 1}. ${p.last_name} ${p.first_name}`)
    console.log(`   ID: ${p.id} (型: ${typeof p.id})`)
    console.log(`   生年月日: ${p.birth_date}`)
    console.log('')
  })
}

checkPatients()
