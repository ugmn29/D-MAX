/**
 * 本番環境の問診票回答のresponse_data構造を詳しく調査
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// .env.localファイルから環境変数を読み込む
const envContent = fs.readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    envVars[key] = value
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
// サービスロールキーを使用（RLSをバイパス）
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const responseId = '623ab580-0afd-42cf-8a4e-feaf4c680174'

console.log('🔍 問診票回答のresponse_data構造を詳細調査')
console.log(`Response ID: ${responseId}`)
console.log('')

try {
  // 問診票回答を取得
  const { data: response, error: responseError } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('id', responseId)
    .single()

  if (responseError) {
    console.error('❌ 問診票回答取得エラー:', responseError)
    process.exit(1)
  }

  console.log('✅ 問診票回答を取得しました')
  console.log('')
  console.log('基本情報:')
  console.log(`  ID: ${response.id}`)
  console.log(`  Questionnaire ID: ${response.questionnaire_id}`)
  console.log(`  Patient ID: ${response.patient_id}`)
  console.log(`  Completed at: ${response.completed_at}`)
  console.log('')

  if (!response.response_data) {
    console.log('⚠️  response_dataがNULLです')
    process.exit(0)
  }

  const responseData = response.response_data
  const keys = Object.keys(responseData)

  console.log(`📋 response_dataのキー数: ${keys.length}`)
  console.log('')

  // キー形式を判定
  const uuidKeys = keys.filter(k => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k))
  const qFormatKeys = keys.filter(k => /^q\d+-\d+$/.test(k))
  const sectionFormatKeys = keys.filter(k => /^section\d+_q\d+$/.test(k))

  console.log('🔑 キー形式の分類:')
  console.log(`  UUID形式: ${uuidKeys.length}件`)
  console.log(`  q形式 (例: q1-1): ${qFormatKeys.length}件`)
  console.log(`  section形式: ${sectionFormatKeys.length}件`)
  console.log('')

  // すべてのキーを表示
  console.log('📝 すべてのキーと値:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  keys.forEach((key, index) => {
    const value = responseData[key]
    const displayValue = typeof value === 'string' && value.length > 100
      ? value.substring(0, 97) + '...'
      : JSON.stringify(value)
    console.log(`${(index + 1).toString().padStart(3, ' ')}. ${key}`)
    console.log(`     = ${displayValue}`)
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  // 質問定義を取得
  const { data: questions, error: questionsError } = await supabase
    .from('questionnaire_questions')
    .select('*')
    .eq('questionnaire_id', response.questionnaire_id)
    .order('sort_order', { ascending: true })

  if (questionsError) {
    console.error('❌ 質問定義取得エラー:', questionsError)
    process.exit(1)
  }

  console.log(`✅ ${questions.length}件の質問定義を取得しました`)
  console.log('')

  // linked_fieldがある質問のみリスト表示
  const linkedQuestions = questions.filter(q => q.linked_field)
  console.log(`🔗 linked_fieldがある質問: ${linkedQuestions.length}件`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  linkedQuestions.forEach((q, index) => {
    console.log(`${(index + 1).toString().padStart(2, ' ')}. [sort_order: ${q.sort_order}] ${q.question_text.substring(0, 60)}...`)
    console.log(`    Question ID: ${q.id}`)
    console.log(`    linked_field: ${q.linked_field}`)

    // UUID形式で回答を探す
    const uuidAnswer = responseData[q.id]
    console.log(`    UUID形式 (${q.id}): ${uuidAnswer !== undefined ? JSON.stringify(uuidAnswer) : '❌ なし'}`)

    // レガシー形式で回答を探す
    const section = Math.floor(q.sort_order / 10) + 1
    const number = q.sort_order % 10 || 10
    const legacyKey = `q${section}-${number}`
    const legacyAnswer = responseData[legacyKey]
    console.log(`    レガシー形式 (${legacyKey}): ${legacyAnswer !== undefined ? JSON.stringify(legacyAnswer) : '❌ なし'}`)

    console.log('')
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')

  // 患者情報を取得
  if (response.patient_id) {
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', response.patient_id)
      .single()

    if (patientError) {
      console.error('❌ 患者情報取得エラー:', patientError)
    } else {
      console.log('👤 現在の患者情報:')
      console.log(`  名前: ${patient.last_name} ${patient.first_name}`)
      console.log(`  生年月日: ${patient.birth_date || 'NULL'}`)
      console.log(`  性別: ${patient.gender || 'NULL'}`)
      console.log(`  電話番号: ${patient.phone || 'NULL'}`)
      console.log(`  メール: ${patient.email || 'NULL'}`)
      console.log(`  アレルギー: ${patient.allergies || 'NULL'}`)
      console.log(`  既往歴: ${patient.medical_history || 'NULL'}`)
      console.log(`  服薬情報: ${patient.medications || 'NULL'}`)
      console.log(`  登録済み: ${patient.is_registered}`)
      console.log('')
    }
  }

  console.log('✅ 調査完了')

} catch (error) {
  console.error('❌ エラー:', error.message)
  process.exit(1)
}
