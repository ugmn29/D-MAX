/**
 * 歯科病名フラグ修正スクリプト
 * Fix is_dental flags for dental disease codes
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🦷 歯科病名フラグを修正中...\n')

  // 歯科関連のキーワード
  const dentalKeywords = [
    '歯', '齲', 'う蝕', '歯髄', '歯周', '歯肉', '歯槽',
    '根尖', '咬合', '歯列', '顎', '口腔', '舌', '口蓋',
    '埋伏', '萌出', 'エナメル', '象牙', 'セメント'
  ]

  let totalUpdated = 0

  for (const keyword of dentalKeywords) {
    console.log(`"${keyword}"を含む病名を更新中...`)

    const { data: matchedDiseases, error: searchError } = await supabase
      .from('disease_codes')
      .select('id, code, name')
      .ilike('name', `%${keyword}%`)
      .eq('is_dental', false)

    if (searchError) {
      console.error(`  ❌ 検索エラー:`, searchError.message)
      continue
    }

    if (matchedDiseases && matchedDiseases.length > 0) {
      const ids = matchedDiseases.map(d => d.id)

      const { error: updateError } = await supabase
        .from('disease_codes')
        .update({ is_dental: true })
        .in('id', ids)

      if (updateError) {
        console.error(`  ❌ 更新エラー:`, updateError.message)
      } else {
        totalUpdated += matchedDiseases.length
        console.log(`  ✅ ${matchedDiseases.length}件を更新`)
      }
    } else {
      console.log(`  ℹ️  該当なし`)
    }
  }

  console.log(`\n✅ 合計 ${totalUpdated} 件の病名フラグを更新しました`)

  // 確認
  const { count: dentalCount } = await supabase
    .from('disease_codes')
    .select('*', { count: 'exact', head: true })
    .eq('is_dental', true)

  console.log(`\n📊 歯科病名総数: ${dentalCount}件\n`)

  // サンプル表示
  const { data: samples } = await supabase
    .from('disease_codes')
    .select('code, name')
    .eq('is_dental', true)
    .limit(10)

  if (samples && samples.length > 0) {
    console.log('サンプル:')
    samples.forEach(s => console.log(`  - ${s.code}: ${s.name}`))
  }
}

main()
