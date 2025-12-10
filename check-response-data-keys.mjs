/**
 * 本番環境のquestionnaire_responsesテーブルのresponse_dataキー形式を確認
 *
 * 使い方:
 *   node check-response-data-keys.mjs
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
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 questionnaire_responsesのresponse_dataキー形式を確認中...')
console.log('')

async function checkResponseDataKeys() {
  try {
    // 最新の問診票回答を取得
    const { data: responses, error } = await supabase
      .from('questionnaire_responses')
      .select('id, questionnaire_id, patient_id, response_data, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ データ取得エラー:', error)
      return
    }

    if (!responses || responses.length === 0) {
      console.log('⚠️  問診票回答が見つかりませんでした')
      return
    }

    console.log(`✅ ${responses.length}件の問診票回答を取得しました`)
    console.log('')

    responses.forEach((response, index) => {
      console.log(`--- 問診票回答 #${index + 1} ---`)
      console.log(`ID: ${response.id}`)
      console.log(`Questionnaire ID: ${response.questionnaire_id}`)
      console.log(`Patient ID: ${response.patient_id || 'NULL (未連携)'}`)
      console.log(`Created At: ${response.created_at}`)
      console.log('')

      if (response.response_data) {
        const keys = Object.keys(response.response_data)
        console.log(`📋 response_dataのキー数: ${keys.length}`)
        console.log('')

        // キーの形式を判定
        const uuidKeys = keys.filter(k => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k))
        const qFormatKeys = keys.filter(k => /^q\d+-\d+$/.test(k))
        const sectionFormatKeys = keys.filter(k => /^section\d+_q\d+$/.test(k))
        const otherKeys = keys.filter(k =>
          !(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)) &&
          !(/^q\d+-\d+$/.test(k)) &&
          !(/^section\d+_q\d+$/.test(k))
        )

        console.log(`🔑 キー形式の内訳:`)
        console.log(`  - UUID形式 (例: 123e4567-e89b-12d3-a456-426614174000): ${uuidKeys.length}件`)
        console.log(`  - q形式 (例: q1-1, q2-3): ${qFormatKeys.length}件`)
        console.log(`  - section形式 (例: section1_q1): ${sectionFormatKeys.length}件`)
        console.log(`  - その他: ${otherKeys.length}件`)
        console.log('')

        // サンプルキーを表示
        console.log('📝 サンプルキー (最大10件):')
        keys.slice(0, 10).forEach(key => {
          const value = response.response_data[key]
          const displayValue = typeof value === 'string' && value.length > 50
            ? value.substring(0, 47) + '...'
            : value
          console.log(`  - ${key}: ${JSON.stringify(displayValue)}`)
        })
        console.log('')

        // 重要なフィールドを探す
        const importantFields = ['birth_date', 'gender', 'phone', 'allergies', 'medications']
        console.log('🔍 重要なフィールドの検索:')

        importantFields.forEach(field => {
          // キーに含まれているか検索
          const matchingKeys = keys.filter(k => k.toLowerCase().includes(field.toLowerCase()))
          if (matchingKeys.length > 0) {
            console.log(`  - ${field}: 見つかりました`)
            matchingKeys.forEach(k => {
              console.log(`    キー: ${k} = ${JSON.stringify(response.response_data[k])}`)
            })
          } else {
            console.log(`  - ${field}: 見つかりませんでした`)
          }
        })
      } else {
        console.log('⚠️  response_dataがNULLです')
      }

      console.log('')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('')
    })

    // 対応する質問定義も取得
    if (responses[0]) {
      console.log('🔍 質問定義を確認中...')
      console.log('')

      const { data: questions, error: qError } = await supabase
        .from('questionnaire_questions')
        .select('id, question_text, linked_field, sort_order')
        .eq('questionnaire_id', responses[0].questionnaire_id)
        .order('sort_order', { ascending: true })

      if (qError) {
        console.error('❌ 質問定義取得エラー:', qError)
      } else if (questions) {
        console.log(`✅ ${questions.length}件の質問定義を取得しました`)
        console.log('')
        console.log('📋 質問定義とlinked_field:')
        questions.forEach(q => {
          if (q.linked_field) {
            console.log(`  - [${q.sort_order}] ${q.question_text.substring(0, 50)}...`)
            console.log(`    ID: ${q.id}`)
            console.log(`    linked_field: ${q.linked_field}`)
            console.log('')
          }
        })

        // マッチング分析
        console.log('')
        console.log('🔗 response_dataとのマッチング分析:')
        console.log('')

        const responseData = responses[0].response_data || {}
        const responseKeys = Object.keys(responseData)

        questions.forEach(q => {
          if (q.linked_field) {
            // UUID形式で存在するか
            const uuidMatch = responseKeys.includes(q.id)

            // レガシー形式で存在するか
            const section = Math.floor(q.sort_order / 10) + 1
            const number = q.sort_order % 10 || 10
            const legacyKey = `q${section}-${number}`
            const legacyMatch = responseKeys.includes(legacyKey)

            console.log(`[${q.sort_order}] ${q.question_text.substring(0, 40)}...`)
            console.log(`  linked_field: ${q.linked_field}`)
            console.log(`  UUID形式 (${q.id}): ${uuidMatch ? '✅ 存在' : '❌ なし'}`)
            if (uuidMatch) {
              console.log(`    値: ${JSON.stringify(responseData[q.id])}`)
            }
            console.log(`  レガシー形式 (${legacyKey}): ${legacyMatch ? '✅ 存在' : '❌ なし'}`)
            if (legacyMatch) {
              console.log(`    値: ${JSON.stringify(responseData[legacyKey])}`)
            }
            console.log('')
          }
        })
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

await checkResponseDataKeys()
