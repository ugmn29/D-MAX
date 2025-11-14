/**
 * EMRデータチェックスクリプト
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('📊 EMRデータ確認中...\n')

  // 病名コード数確認
  const { count: diseaseCount, error: diseaseError } = await supabase
    .from('disease_codes')
    .select('*', { count: 'exact', head: true })

  console.log(`病名コード: ${diseaseCount}件`)
  if (diseaseError) console.error('病名エラー:', diseaseError)

  // 病名サンプル取得
  const { data: diseaseSample, error: diseaseSampleError } = await supabase
    .from('disease_codes')
    .select('code, name, kana, is_dental')
    .limit(3)

  if (diseaseSample && diseaseSample.length > 0) {
    console.log('病名サンプル:')
    diseaseSample.forEach(d => console.log(`  - ${d.code}: ${d.name} (${d.kana}) [歯科:${d.is_dental}]`))
  } else {
    console.log('⚠️  病名データなし')
  }

  // 診療行為コード数確認
  const { count: treatmentCount, error: treatmentError } = await supabase
    .from('treatment_codes')
    .select('*', { count: 'exact', head: true })

  console.log(`\n診療行為コード: ${treatmentCount}件`)
  if (treatmentError) console.error('診療行為エラー:', treatmentError)

  // 診療行為サンプル取得
  const { data: treatmentSample, error: treatmentSampleError } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .limit(5)

  if (treatmentSample && treatmentSample.length > 0) {
    console.log('診療行為サンプル:')
    treatmentSample.forEach(t => console.log(`  - ${t.code}: ${t.name} (${t.points}点)`))
  } else {
    console.log('⚠️  診療行為データなし')
  }

  // 検索テスト（病名）
  console.log('\n🔍 病名検索テスト: "う蝕"')
  const { data: diseaseSearchResult, error: diseaseSearchError } = await supabase
    .from('disease_codes')
    .select('*')
    .or(`name.ilike.%う蝕%,kana.ilike.%う蝕%,code.ilike.%う蝕%`)
    .eq('is_dental', true)
    .limit(5)

  if (diseaseSearchResult && diseaseSearchResult.length > 0) {
    console.log(`検索結果: ${diseaseSearchResult.length}件`)
    diseaseSearchResult.forEach(d => console.log(`  - ${d.code}: ${d.name}`))
  } else {
    console.log('⚠️  検索結果なし')
    if (diseaseSearchError) console.error('検索エラー:', diseaseSearchError)
  }

  // 検索テスト（診療行為）
  console.log('\n🔍 診療行為検索テスト: "抜歯"')
  const { data: treatmentSearchResult, error: treatmentSearchError } = await supabase
    .from('treatment_codes')
    .select('*')
    .or(`name.ilike.%抜歯%,code.ilike.%抜歯%`)
    .limit(5)

  if (treatmentSearchResult && treatmentSearchResult.length > 0) {
    console.log(`検索結果: ${treatmentSearchResult.length}件`)
    treatmentSearchResult.forEach(t => console.log(`  - ${t.code}: ${t.name} (${t.points}点)`))
  } else {
    console.log('⚠️  検索結果なし')
    if (treatmentSearchError) console.error('検索エラー:', treatmentSearchError)
  }

  console.log('\n✅ チェック完了')
}

main()
