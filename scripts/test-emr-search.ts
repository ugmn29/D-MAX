/**
 * EMR検索機能テスト
 * Test EMR search functionality
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * 病名コード検索（UIと同じロジック）
 */
async function searchDiseaseCodes(query: string, limit: number = 20, dentalOnly: boolean = false) {
  try {
    let queryBuilder = supabase
      .from('disease_codes')
      .select('*')
      .or(`name.ilike.%${query}%,kana.ilike.%${query}%,code.ilike.%${query}%`)
      .limit(limit)

    // 歯科関連のみフィルタ（オプション）
    if (dentalOnly) {
      queryBuilder = queryBuilder.eq('is_dental', true)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error('病名検索エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('病名検索エラー:', error)
    return []
  }
}

/**
 * 診療行為コード検索（UIと同じロジック）
 */
async function searchTreatmentCodes(query: string, limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .select('*')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error('診療行為検索エラー:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('診療行為検索エラー:', error)
    return []
  }
}

async function main() {
  console.log('🔍 EMR検索機能テスト\n')
  console.log('='.repeat(60))

  // Test 1: 病名検索（歯科フィルタなし - UIと同じ）
  console.log('\n📝 テスト1: 病名検索 "う蝕" (dentalOnly=false)')
  console.log('-'.repeat(60))
  const diseaseResults1 = await searchDiseaseCodes('う蝕', 20, false)
  console.log(`結果: ${diseaseResults1.length}件`)
  if (diseaseResults1.length > 0) {
    diseaseResults1.slice(0, 5).forEach(d => {
      console.log(`  ✅ ${d.code}: ${d.name} [歯科:${d.is_dental}]`)
    })
  } else {
    console.log('  ❌ 結果なし')
  }

  // Test 2: 病名検索（歯科フィルタあり）
  console.log('\n📝 テスト2: 病名検索 "う蝕" (dentalOnly=true)')
  console.log('-'.repeat(60))
  const diseaseResults2 = await searchDiseaseCodes('う蝕', 20, true)
  console.log(`結果: ${diseaseResults2.length}件`)
  if (diseaseResults2.length > 0) {
    diseaseResults2.slice(0, 5).forEach(d => {
      console.log(`  ✅ ${d.code}: ${d.name} [歯科:${d.is_dental}]`)
    })
  } else {
    console.log('  ❌ 結果なし')
  }

  // Test 3: 病名検索（一般的な病名）
  console.log('\n📝 テスト3: 病名検索 "歯周炎"')
  console.log('-'.repeat(60))
  const diseaseResults3 = await searchDiseaseCodes('歯周炎', 20, false)
  console.log(`結果: ${diseaseResults3.length}件`)
  if (diseaseResults3.length > 0) {
    diseaseResults3.slice(0, 5).forEach(d => {
      console.log(`  ✅ ${d.code}: ${d.name} [歯科:${d.is_dental}]`)
    })
  } else {
    console.log('  ❌ 結果なし')
  }

  // Test 4: 診療行為検索
  console.log('\n📝 テスト4: 診療行為検索 "抜歯"')
  console.log('-'.repeat(60))
  const treatmentResults1 = await searchTreatmentCodes('抜歯', 20)
  console.log(`結果: ${treatmentResults1.length}件`)
  if (treatmentResults1.length > 0) {
    treatmentResults1.slice(0, 5).forEach(t => {
      console.log(`  ✅ ${t.code}: ${t.name} (${t.points}点)`)
    })
  } else {
    console.log('  ❌ 結果なし')
  }

  // Test 5: 診療行為検索（一般的な処置）
  console.log('\n📝 テスト5: 診療行為検索 "充填"')
  console.log('-'.repeat(60))
  const treatmentResults2 = await searchTreatmentCodes('充填', 20)
  console.log(`結果: ${treatmentResults2.length}件`)
  if (treatmentResults2.length > 0) {
    treatmentResults2.slice(0, 5).forEach(t => {
      console.log(`  ✅ ${t.code}: ${t.name} (${t.points}点)`)
    })
  } else {
    console.log('  ❌ 結果なし')
  }

  // Test 6: 診療行為検索（根管治療）
  console.log('\n📝 テスト6: 診療行為検索 "根管"')
  console.log('-'.repeat(60))
  const treatmentResults3 = await searchTreatmentCodes('根管', 20)
  console.log(`結果: ${treatmentResults3.length}件`)
  if (treatmentResults3.length > 0) {
    treatmentResults3.slice(0, 5).forEach(t => {
      console.log(`  ✅ ${t.code}: ${t.name} (${t.points}点)`)
    })
  } else {
    console.log('  ❌ 結果なし')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ 全テスト完了\n')
}

main()
