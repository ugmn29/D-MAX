/**
 * 本番環境の問診票質問のlinked_fieldを確認
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
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 問診票の質問とlinked_fieldを確認中...')
console.log('')

try {
  // 問診票を取得
  const { data: questionnaires, error: qError } = await supabase
    .from('questionnaires')
    .select('id, name, clinic_id')
    .eq('clinic_id', '11111111-1111-1111-1111-111111111111')

  if (qError) {
    console.error('❌ 問診票取得エラー:', qError)
    process.exit(1)
  }

  console.log(`✅ ${questionnaires?.length || 0}件の問診票を取得しました`)
  console.log('')

  if (!questionnaires || questionnaires.length === 0) {
    console.log('⚠️  問診票が存在しません')
    process.exit(0)
  }

  // 各問診票の質問を取得
  for (const q of questionnaires) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`問診票: ${q.name} (${q.id})`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    const { data: questions, error: qsError } = await supabase
      .from('questionnaire_questions')
      .select('id, question_text, linked_field, sort_order, section_name')
      .eq('questionnaire_id', q.id)
      .order('sort_order', { ascending: true })

    if (qsError) {
      console.error('❌ 質問取得エラー:', qsError)
      continue
    }

    console.log(`質問数: ${questions?.length || 0}件`)
    console.log('')

    // linked_fieldが設定されている質問のみ表示
    const linkedQuestions = questions?.filter(q => q.linked_field) || []
    const unlinkedQuestions = questions?.filter(q => !q.linked_field) || []

    if (linkedQuestions.length > 0) {
      console.log(`✅ linked_fieldが設定されている質問: ${linkedQuestions.length}件`)
      linkedQuestions.forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.sort_order}] ${q.question_text}`)
        console.log(`     → linked_field: ${q.linked_field}`)
      })
    } else {
      console.log(`⚠️  linked_fieldが設定されている質問: 0件`)
    }

    console.log('')

    if (unlinkedQuestions.length > 0) {
      console.log(`❌ linked_fieldが未設定の質問: ${unlinkedQuestions.length}件`)
      console.log(`サンプル（最初の10件）:`)
      unlinkedQuestions.slice(0, 10).forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.sort_order}] ${q.section_name} - ${q.question_text}`)
      })
    }

    console.log('')
  }

  console.log('✅ 完了')

} catch (error) {
  console.error('❌ エラー:', error.message)
  console.error(error)
  process.exit(1)
}
