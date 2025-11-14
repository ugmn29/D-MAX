/**
 * treatment_codesテーブルの実際のコードを確認
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTreatmentCodes() {
  console.log('🔍 treatment_codesテーブルの処置コード確認\n')
  console.log('='.repeat(70))

  const keywords = [
    '抜髄',
    '根管貼薬',
    '根管拡大',
    '根管形成',
    '感染根管',
    '根管充填',
    '充填',
    'う蝕',
    '抜歯',
    '難抜歯',
    'スケーリング',
    '歯周基本検査'
  ]

  for (const keyword of keywords) {
    console.log(`\n📋 キーワード: "${keyword}"`)
    console.log('-'.repeat(70))

    const { data, error } = await supabase
      .from('treatment_codes')
      .select('code, name, points')
      .ilike('name', `%${keyword}%`)
      .limit(5)

    if (error) {
      console.error('  ❌ エラー:', error.message)
    } else if (data && data.length > 0) {
      data.forEach(t => {
        console.log(`  ✅ ${t.code} | ${t.name} | ${t.points}点`)
      })
    } else {
      console.log('  ⚠️  該当なし')
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ 確認完了\n')
}

checkTreatmentCodes()
