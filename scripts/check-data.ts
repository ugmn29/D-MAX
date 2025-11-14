/**
 * データベース内のデータを確認
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('=== データベース確認 ===\n')

  // 病名コード確認
  const { data: diseases, error: diseaseError, count: diseaseCount } = await supabase
    .from('disease_codes')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (diseaseError) {
    console.error('病名コード取得エラー:', diseaseError)
  } else {
    console.log(`病名コード総数: ${diseaseCount}`)
    console.log('最初の5件:')
    diseases?.forEach((d: any) => {
      console.log(`  - ${d.code}: ${d.name} (${d.icd10_code})`)
    })
  }

  console.log()

  // 診療行為コード確認
  const { data: treatments, error: treatmentError, count: treatmentCount } = await supabase
    .from('treatment_codes')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (treatmentError) {
    console.error('診療行為コード取得エラー:', treatmentError)
  } else {
    console.log(`診療行為コード総数: ${treatmentCount}`)
    console.log('最初の5件:')
    treatments?.forEach((t: any) => {
      console.log(`  - ${t.code}: ${t.name} (${t.points}点)`)
    })
  }

  console.log()

  // 検索テスト
  console.log('=== 検索テスト ===\n')

  const { data: searchResults, error: searchError } = await supabase
    .from('disease_codes')
    .select('*')
    .or('name.ilike.%う蝕%,kana.ilike.%う蝕%,code.ilike.%う蝕%')
    .limit(3)

  if (searchError) {
    console.error('病名検索エラー:', searchError)
  } else {
    console.log('「う蝕」で検索:')
    searchResults?.forEach((d: any) => {
      console.log(`  - ${d.name}`)
    })
  }

  console.log()

  // 診療行為検索テスト
  const { data: treatmentResults, error: treatmentSearchError } = await supabase
    .from('treatment_codes')
    .select('*')
    .or('name.ilike.%充填%,code.ilike.%充填%')
    .limit(5)

  if (treatmentSearchError) {
    console.error('診療行為検索エラー:', treatmentSearchError)
  } else {
    console.log('「充填」で検索:')
    treatmentResults?.forEach((t: any) => {
      console.log(`  - ${t.name} (${t.points}点)`)
    })
  }
}

main()
