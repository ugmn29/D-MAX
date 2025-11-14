/**
 * 歯科病名確認スクリプト
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🦷 歯科病名確認中...\n')

  // 歯科関連病名を確認
  const { data: dentalDiseases, error: dentalError } = await supabase
    .from('disease_codes')
    .select('*')
    .eq('is_dental', true)
    .limit(20)

  console.log(`歯科関連病名: ${dentalDiseases?.length || 0}件`)
  if (dentalDiseases && dentalDiseases.length > 0) {
    console.log('\n歯科病名サンプル:')
    dentalDiseases.forEach(d => {
      console.log(`  - ${d.code}: ${d.name} (${d.kana}) [ICD10: ${d.icd10_code}]`)
    })
  }

  // "う蝕"を含む病名を検索（全病名から）
  console.log('\n\n🔍 "う蝕"を含む病名検索（全病名）:')
  const { data: cariesAll, error: cariesAllError } = await supabase
    .from('disease_codes')
    .select('*')
    .ilike('name', '%う蝕%')
    .limit(10)

  if (cariesAll && cariesAll.length > 0) {
    console.log(`検索結果: ${cariesAll.length}件`)
    cariesAll.forEach(d => {
      console.log(`  - ${d.code}: ${d.name} [歯科: ${d.is_dental}]`)
    })
  } else {
    console.log('⚠️  検索結果なし')
  }

  // "齲"（う蝕の漢字）を含む病名を検索
  console.log('\n\n🔍 "齲"を含む病名検索:')
  const { data: cariesKanji, error: cariesKanjiError } = await supabase
    .from('disease_codes')
    .select('*')
    .ilike('name', '%齲%')
    .limit(10)

  if (cariesKanji && cariesKanji.length > 0) {
    console.log(`検索結果: ${cariesKanji.length}件`)
    cariesKanji.forEach(d => {
      console.log(`  - ${d.code}: ${d.name} [歯科: ${d.is_dental}]`)
    })
  } else {
    console.log('⚠️  検索結果なし')
  }

  // "歯"を含む病名を検索
  console.log('\n\n🔍 "歯"を含む病名検索:')
  const { data: toothDiseases, error: toothError } = await supabase
    .from('disease_codes')
    .select('*')
    .ilike('name', '%歯%')
    .limit(10)

  if (toothDiseases && toothDiseases.length > 0) {
    console.log(`検索結果: ${toothDiseases.length}件`)
    toothDiseases.forEach(d => {
      console.log(`  - ${d.code}: ${d.name} [歯科: ${d.is_dental}]`)
    })
  } else {
    console.log('⚠️  検索結果なし')
  }

  console.log('\n✅ チェック完了')
}

main()
