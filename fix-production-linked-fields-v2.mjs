/**
 * 本番環境の問診票質問にlinked_fieldを直接設定する (環境変数から読み込み版)
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Vercelの環境変数またはローカルの.env.productionファイルから読み込む
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 環境変数がない場合は、直接本番環境の値を使用
if (!supabaseUrl || supabaseUrl.includes('127.0.0.1')) {
  console.log('⚠️  本番環境のSupabase認証情報を使用します')
  supabaseUrl = 'https://obdfmwpdkwraqqqyjgwu.supabase.co'

  // Vercelの環境変数から取得する必要があるため、ここで入力を求める
  console.log('')
  console.log('本番環境のSUPABASE_SERVICE_ROLE_KEYを入力してください:')
  console.log('(Vercelダッシュボード → Settings → Environment Variables で確認)')
  console.log('')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔧 本番環境の問診票にlinked_fieldを設定します...')
console.log(`接続先: ${supabaseUrl}`)
console.log('')

// 質問テキストとlinked_fieldのマッピング
const fieldMappings = [
  // 基本情報
  { pattern: /姓|氏名.*姓|お名前.*姓|名前.*姓/i, field: 'last_name' },
  { pattern: /名(?!前)|氏名.*名(?!前)|お名前.*名(?!前)/i, field: 'first_name' },
  { pattern: /フリガナ.*姓|セイ|ふりがな.*姓/i, field: 'last_name_kana' },
  { pattern: /フリガナ.*名|メイ|ふりがな.*名/i, field: 'first_name_kana' },
  { pattern: /性別/i, field: 'gender' },
  { pattern: /生年月日|誕生日|年齢/i, field: 'birth_date' },
  { pattern: /郵便番号|〒/i, field: 'postal_code' },
  { pattern: /住所|ご住所/i, field: 'address' },
  { pattern: /電話|TEL|連絡先.*電話|お電話/i, field: 'phone' },
  { pattern: /メール|email|e-mail/i, field: 'email' },
  { pattern: /緊急連絡先/i, field: 'emergency_contact' },
  { pattern: /来院.*きっかけ|紹介|ご紹介/i, field: 'referral_source' },
  { pattern: /希望.*連絡|連絡.*方法|ご連絡.*方法/i, field: 'preferred_contact_method' },

  // 医療情報
  { pattern: /アレルギー/i, field: 'allergies' },
  { pattern: /既往歴|病歴|持病/i, field: 'medical_history' },
  { pattern: /服薬|服用.*薬|お薬/i, field: 'medications' }
]

try {
  // 1. クリニックの問診票を取得
  const { data: questionnaires, error: qError } = await supabase
    .from('questionnaires')
    .select('id, name')
    .eq('clinic_id', '11111111-1111-1111-1111-111111111111')

  if (qError) {
    console.error('❌ 問診票取得エラー:', qError)
    process.exit(1)
  }

  if (!questionnaires || questionnaires.length === 0) {
    console.log('⚠️  問診票が見つかりませんでした')
    process.exit(0)
  }

  console.log(`✅ ${questionnaires.length}件の問診票を取得しました`)
  console.log('')

  let totalUpdated = 0

  // 2. 各問診票の質問を処理
  for (const questionnaire of questionnaires) {
    console.log(`処理中: ${questionnaire.name}`)

    // 質問を取得
    const { data: questions, error: qsError } = await supabase
      .from('questionnaire_questions')
      .select('id, question_text, linked_field, section_name')
      .eq('questionnaire_id', questionnaire.id)

    if (qsError) {
      console.error(`  ❌ 質問取得エラー:`, qsError)
      continue
    }

    if (!questions || questions.length === 0) {
      console.log(`  質問がありません`)
      continue
    }

    let updated = 0

    // 各質問を処理
    for (const question of questions) {
      // 既にlinked_fieldが設定されている場合はスキップ
      if (question.linked_field) {
        continue
      }

      // 質問テキストからlinked_fieldを推測
      let matchedField = null
      for (const mapping of fieldMappings) {
        if (mapping.pattern.test(question.question_text)) {
          matchedField = mapping.field
          break
        }
      }

      if (matchedField) {
        // linked_fieldを更新
        const { error: updateError } = await supabase
          .from('questionnaire_questions')
          .update({ linked_field: matchedField })
          .eq('id', question.id)

        if (updateError) {
          console.error(`    ❌ 更新エラー (${question.question_text}):`, updateError)
        } else {
          console.log(`    ✓ "${question.question_text}" → ${matchedField}`)
          updated++
          totalUpdated++
        }
      }
    }

    if (updated > 0) {
      console.log(`  ${updated}件のlinked_fieldを設定しました`)
    } else {
      console.log(`  設定対象の質問がありませんでした`)
    }
    console.log('')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ 完了: 合計 ${totalUpdated}件のlinked_fieldを設定しました`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━')

} catch (error) {
  console.error('❌ エラー:', error.message)
  console.error(error)
  process.exit(1)
}
